
import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Text, Alert } from 'react-native';
import { DataTable, Searchbar, useTheme, Title, Button, Portal, Dialog, Chip, IconButton, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  cacheDirectory as legacyCacheDirectory,
  deleteAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy';

// --- INTERFACES --- //
interface Factura {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  issueDate: string;
  responseDate: string;
  urlA4: string;
  urlTicket: string;
}

interface ApiFactura {
  id: string;
  type: string;
  status: string;
  issueTime: number;
  issueDate: string;
  responseDate: string;
  pdfA4: string;
  pdfTicket80: string;
}

const ITEMS_PER_PAGE = 12;

// --- HELPERS --- //
const getFileNameFromUrl = (url: string): string => {
  const fallbackName = `comprobante-${Date.now()}`;
  if (!url) return fallbackName;
  try {
    const urlWithoutQuery = url.split('?')[0];
    const segments = urlWithoutQuery.split('/');
    return segments[segments.length - 1].replace(/\.pdf$/i, '') || fallbackName;
  } catch {
    return fallbackName;
  }
};

// --- SCREEN COMPONENT --- //
export default function FacturasScreen() {
  // --- HOOKS --- //
  const theme = useTheme();
  const router = useRouter();

  // --- STATE --- //
  const [searchQuery, setSearchQuery] = useState('');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [originalFacturas, setOriginalFacturas] = useState<Factura[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [formatDialogVisible, setFormatDialogVisible] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // --- DATA FETCHING --- //
  const fetchFacturas = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    const apiUrl = (process.env.EXPO_PUBLIC_OBTENER_PDF || '').replace('hhttps://', 'https://');

    if (!apiUrl) {
      setError('La URL para cargar facturas no está configurada.');
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`El servidor respondió con un error: ${response.status}`);
      
      const apiResponse = await response.json();
      const rawFacturas: ApiFactura[] = Array.isArray(apiResponse.data) ? apiResponse.data : [];

      const formattedFacturas = rawFacturas
        .filter(item => item && item.id && item.pdfA4)
        .map(item => ({
          id: item.id,
          nombre: getFileNameFromUrl(item.pdfA4),
          tipo: item.type,
          estado: item.status || 'N/A',
          issueDate: item.issueDate || 'N/A',
          responseDate: item.responseDate || 'N/A',
          urlA4: item.pdfA4,
          urlTicket: item.pdfTicket80,
        }));

      setOriginalFacturas(formattedFacturas);
      setFacturas(formattedFacturas);
      setSearchQuery('');
      setPage(0);
    } catch (e: any) {
      console.error("Error fetching facturas:", e);
      setError(`No se pudieron cargar las facturas: ${e.message}`);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => { fetchFacturas(); }, [fetchFacturas]);

  // --- PAGINATION --- //
  const paginatedFacturas = facturas.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(facturas.length / ITEMS_PER_PAGE);

  // --- HELPERS --- //
  const getTipoDocumento = (tipo: string) => tipo === '01' ? 'Factura' : tipo === '03' ? 'Boleta' : tipo;
  const formatNombre = (name: string) => name.split('-').slice(2).join('-') || name;

  // --- HANDLERS --- //
  const showFormatDialog = (factura: Factura) => {
    setSelectedFactura(factura);
    setFormatDialogVisible(true);
  };

  const hideFormatDialog = () => setFormatDialogVisible(false);

  const handleFormatSelect = (url: string, title: string) => {
    hideFormatDialog();
    router.push({ pathname: '/pdf-viewer', params: { pdfUrl: url, title } });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0);
    const lowerCaseQuery = query.toLowerCase();
  
    // --- PASO 1: Crea la función que "normaliza" la serie ---
    // 'B001-00058' se convertirá en 'b001-58'
    const normalizeSerie = (text: string) => {
      const parts = text.split('-');
      // Solo aplica la lógica si el texto tiene un guion (ej. 'F001-123')
      if (parts.length === 2) {
        const serie = parts[0].toLowerCase();
        // parseInt() es la clave: convierte '00058' en el número 58
        const number = parseInt(parts[1], 10);
        
        if (!isNaN(number)) {
          // Reconstruimos la cadena limpia: 'b001' + '-' + 58 => 'b001-58'
          return `${serie}-${number}`;
        }
      }
      // Si no tiene guion, solo lo devuelve en minúsculas.
      return text.toLowerCase();
    };
  
    // --- PASO 2: Normaliza lo que el usuario está buscando ---
    const normalizedQuery = normalizeSerie(lowerCaseQuery);
  
    const filtered = lowerCaseQuery === '' 
      ? originalFacturas 
      : originalFacturas.filter(item => {
  
        // --- Mantenemos la búsqueda general que ya tenías ---
        // Esto permite seguir buscando por fecha, estado, etc.
        const genericMatch = Object.values(item).some(value => 
          String(value).toLowerCase().includes(lowerCaseQuery)
        );
  
        // --- PASO 3: Normaliza la Serie-Correlativo del item actual ---
        const itemSerie = formatNombre(item.nombre); // ej: 'B001-00000058'
        const normalizedItemSerie = normalizeSerie(itemSerie); // ej: 'b001-58'
  
        // --- PASO 4: Compara las versiones normalizadas ---
        // Comprueba si 'b001-58' incluye lo que buscaste, ej: 'b001-58'
        const serieMatch = normalizedItemSerie.includes(normalizedQuery);
  
        // Un item se muestra si la búsqueda general O la búsqueda por serie coinciden
        return genericMatch || serieMatch;
      });
  
    setFacturas(filtered);
  };
  
  const handleClearCache = async () => {
    Alert.alert(
      "Limpiar Caché",
      "¿Borrar todos los comprobantes guardados? Esto liberará espacio y se volverán a descargar la próxima vez.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar Todo",
          style: "destructive",
          onPress: async () => {
            setIsClearingCache(true);
            try {
              const cacheDir = legacyCacheDirectory || '';
              const files = await readDirectoryAsync(cacheDir);
              const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
              let deletedCount = 0;
              for (const file of pdfFiles) {
                await deleteAsync(cacheDir + file, { idempotent: true });
                deletedCount++;
              }
              Alert.alert("Éxito", `Se eliminaron ${deletedCount} comprobantes guardados.`);
            } catch (error) {
              Alert.alert("Error", "No se pudo limpiar el caché de documentos.");
            } finally {
              setIsClearingCache(false);
              hideFormatDialog();
            }
          }
        }
      ]
    );
  };

  // --- STYLES --- //
  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1 },
    headerContainer: { paddingHorizontal: 16 },
    title: { marginTop: 16, marginBottom: 8 },
    searchAndPaginationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    searchbar: { flex: 1 },
    paginationControls: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    pageNumber: { marginHorizontal: 8, fontSize: 16, color: theme.colors.onSurface },
    tableContainer: { flex: 1 },
    tableHeader: { backgroundColor: theme.colors.surface },
    table: { minWidth: 900 }, // Adjusted minWidth
    colNombre: { width: 180 },
    colTipo: { width: 80, justifyContent: 'center' },
    colAccion: { width: 110, justifyContent: 'center' },
    colFechaEmision: { width: 220, justifyContent: 'center' },
    colEstado: { width: 130, justifyContent: 'center' },
    dialogTitleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dialogButton: { marginTop: 8 },
    centerMessageText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: theme.colors.onSurfaceVariant },
    errorText: { margin: 16, textAlign: 'center' },
    emptyText: { textAlign: 'center', marginTop: 20, color: theme.colors.onSurfaceVariant }
  });

  // --- CHILD COMPONENTS --- //
  const StatusChip = ({ status }: { status: string }) => {
    const config = {
      ACEPTADO: { icon: "check-circle", color: "#0B6A38", bg: '#D1F4E1', label: "Aceptado" },
      RECHAZADO: { icon: "alert-circle", color: theme.colors.onErrorContainer, bg: theme.colors.errorContainer, label: "Rechazado" },
      EXCEPCION: { icon: "sync-alert", color: "#7F5F01", bg: '#FFECB3', label: "Reintentar" },
      VALIDANDO: { icon: "timer-sand", color: theme.colors.onSurfaceVariant, bg: theme.colors.surfaceVariant, label: "Validando" },
    }[status] || { icon: "help-circle", label: status };
    return <Chip icon={config.icon} selectedColor={config.color} style={{ backgroundColor: config.bg }}>{config.label}</Chip>;
  };

  // --- MAIN RENDER --- //
  return (
    <SafeAreaView style={styles.safeArea}>
      <Portal>
        <Dialog visible={formatDialogVisible} onDismiss={hideFormatDialog}>
          <View style={styles.dialogTitleContainer}>
            <Dialog.Title>Elegir Formato</Dialog.Title>
            <IconButton 
              icon="delete-sweep-outline" 
              size={20} 
              onPress={handleClearCache}
              disabled={isClearingCache}
            />
          </View>
          <Dialog.Content>
            <Button 
              icon="file-pdf-box" 
              mode="contained" 
              onPress={() => handleFormatSelect(selectedFactura!.urlA4, formatNombre(selectedFactura!.nombre))}
              disabled={!selectedFactura?.urlA4}
              style={styles.dialogButton}>Ver Formato A4</Button>
            <Button 
              icon="ticket-confirmation" 
              mode="contained" 
              onPress={() => handleFormatSelect(selectedFactura!.urlTicket, formatNombre(selectedFactura!.nombre))}
              disabled={!selectedFactura?.urlTicket}
              style={styles.dialogButton}>Ver Ticket 80mm</Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideFormatDialog}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.container}>
        <View style={styles.headerContainer}>
            <Title style={styles.title}>Facturas y Documentos</Title>
            <View style={styles.searchAndPaginationContainer}>
                <Searchbar placeholder="Buscar..." onChangeText={handleSearch} value={searchQuery} style={styles.searchbar} />
                <View style={styles.paginationControls}>
                    <IconButton icon="chevron-left" onPress={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} />
                    <Text style={styles.pageNumber}>{`${totalPages > 0 ? page + 1 : 0} / ${totalPages}`}</Text>
                    <IconButton icon="chevron-right" onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} />
                </View>
            </View>
        </View>

        {error && <HelperText type="error" visible={true} style={styles.errorText}>{error}</HelperText>}

        <View style={styles.tableContainer}>
          <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            {facturas.length === 0 && !refreshing && !error ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Text style={styles.centerMessageText}>Desliza hacia abajo para cargar las facturas</Text>
              </View>
            ) : (
              <DataTable style={styles.table}>
                  <DataTable.Header style={styles.tableHeader}>
                      <DataTable.Title style={styles.colNombre}>Serie-Correlativo</DataTable.Title>
                      <DataTable.Title style={styles.colTipo}>Tipo</DataTable.Title>
                      <DataTable.Title style={styles.colAccion}>Acción</DataTable.Title>
                      <DataTable.Title style={styles.colFechaEmision}>Fecha Emisión</DataTable.Title>
                      <DataTable.Title style={styles.colEstado}>Estado</DataTable.Title>
                  </DataTable.Header>
                  {paginatedFacturas.length > 0 ? (
                    paginatedFacturas.map((item) => (
                        <DataTable.Row key={item.id}>
                            <DataTable.Cell style={styles.colNombre}>{formatNombre(item.nombre)}</DataTable.Cell>
                            <DataTable.Cell style={styles.colTipo}>{getTipoDocumento(item.tipo)}</DataTable.Cell>
                            <DataTable.Cell style={styles.colAccion}><Button mode="contained" onPress={() => showFormatDialog(item)}>Ver</Button></DataTable.Cell>
                            <DataTable.Cell style={styles.colFechaEmision}>{item.issueDate}</DataTable.Cell>
                            <DataTable.Cell style={styles.colEstado}><StatusChip status={item.estado} /></DataTable.Cell>
                        </DataTable.Row>
                    ))
                  ) : (
                    !refreshing && <DataTable.Row><DataTable.Cell><Text style={styles.emptyText}>No se encontraron facturas.</Text></DataTable.Cell></DataTable.Row>
                  )}
              </DataTable>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
