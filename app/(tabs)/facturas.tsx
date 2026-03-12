
import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Text } from 'react-native';
import { DataTable, Searchbar, useTheme, Title, Button, Portal, Dialog, Chip, IconButton, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import PdfViewerModal from '../../components/PdfViewerModal';

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
  fileName: string;
  type: string;
  status: string;
  issueTime: number;
  issueDate: string;
  responseDate: string;
  pdfA4: string;
  pdfTicket80: string;
}

const ITEMS_PER_PAGE = 12;

// --- SCREEN COMPONENT --- //
export default function FacturasScreen() {
  // --- STATE MANAGEMENT --- //
  const [searchQuery, setSearchQuery] = useState('');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [originalFacturas, setOriginalFacturas] = useState<Factura[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  // Pagination state
  const [page, setPage] = useState(0);

  // Dialogs and Modals state
  const [formatDialogVisible, setFormatDialogVisible] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfUrlToView, setPdfUrlToView] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);

  // --- DATA FETCHING & PROCESSING (MANUAL TRIGGER) --- //
  const fetchFacturas = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    const apiUrl = process.env.EXPO_PUBLIC_OBTENER_PDF;

    if (!apiUrl) {
        setError('La URL para cargar facturas no está configurada.');
        setRefreshing(false);
        return;
    }

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`El servidor respondió con un error: ${response.status}`);
      }
      const apiResponse = await response.json();
      const rawFacturas: ApiFactura[] = Array.isArray(apiResponse.data) ? apiResponse.data : [];

      const formattedFacturas = rawFacturas
        .filter(item => item && item.id)
        .map(item => ({
          id: item.id,
          nombre: item.fileName,
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

  // This is the ONLY way data is fetched, triggered by user pull-to-refresh.
  const onRefresh = useCallback(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  // --- PAGINATION LOGIC --- //
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE;
  const paginatedFacturas = facturas.slice(from, to);
  const totalPages = Math.ceil(facturas.length / ITEMS_PER_PAGE);

  // --- HELPER FUNCTIONS --- //
  const getTipoDocumento = (tipo: string) => {
    switch (tipo) {
      case '01': return 'Factura';
      case '03': return 'Boleta';
      default: return tipo;
    }
  };

  const formatNombre = (fullName: string) => {
    const parts = fullName.split('-');
    if (parts.length >= 4) {
      return `${parts[2]}-${parts[3]}`;
    }
    return fullName;
  };

  // --- DIALOG & MODAL HANDLERS --- //
  const showFormatDialog = (factura: Factura) => {
    setSelectedFactura(factura);
    setPdfFileName(factura.nombre);
    setFormatDialogVisible(true);
  };

  const hideFormatDialog = () => setFormatDialogVisible(false);

  const handleFormatSelect = (url: string | undefined) => {
    hideFormatDialog();
    if (url) {
      setPdfUrlToView(url);
      setPdfViewerVisible(true);
    }
  };

  const hidePdfViewer = () => {
    setPdfViewerVisible(false);
    setPdfUrlToView(null);
    setPdfFileName(null);
  };

  // --- SEARCH LOGIC --- //
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0);
    if (query === '') {
      setFacturas(originalFacturas);
    } else {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = originalFacturas.filter(item =>
        (formatNombre(item.nombre).toLowerCase().includes(lowerCaseQuery)) ||
        (getTipoDocumento(item.tipo).toLowerCase().includes(lowerCaseQuery)) ||
        (item.estado && item.estado.toLowerCase().includes(lowerCaseQuery)) ||
        (item.issueDate && item.issueDate.toLowerCase().includes(lowerCaseQuery)) ||
        (item.responseDate && item.responseDate.toLowerCase().includes(lowerCaseQuery))
      );
      setFacturas(filtered);
    }
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
    dialogButton: { marginTop: 8 },
    table: { minWidth: 950 },
    colNombre: { width: 180 },
    colTipo: { width: 80, justifyContent: 'center' },
    colEstado: { width: 130, justifyContent: 'center' },
    colFechaEmision: { width: 220, justifyContent: 'center' },
    colFechaRespuesta: { width: 220, justifyContent: 'center' },
    colAccion: { width: 110, justifyContent: 'center' },
    centerMessageText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: theme.colors.onSurfaceVariant },
    errorText: { margin: 16, textAlign: 'center' },
    emptyText: { textAlign: 'center', marginTop: 20, color: theme.colors.onSurfaceVariant }
  });

  // --- CHILD COMPONENTS --- //
  const StatusChip = ({ status }: { status: string }) => {
     switch (status) {
      case 'ACEPTADO': return <Chip icon="check-circle" selectedColor="#0B6A38" style={{ backgroundColor: '#D1F4E1' }}>Aceptado</Chip>;
      case 'RECHAZADO': return <Chip icon="alert-circle" selectedColor={theme.colors.onErrorContainer} style={{ backgroundColor: theme.colors.errorContainer }}>Rechazado</Chip>;
      case 'EXCEPCION': return <Chip icon="sync-alert" selectedColor="#7F5F01" style={{ backgroundColor: '#FFECB3' }}>Reintentar</Chip>;
      case 'VALIDANDO': return <Chip icon="timer-sand" selectedColor={theme.colors.onSurfaceVariant} style={{ backgroundColor: theme.colors.surfaceVariant }}>Validando</Chip>;
      default: return <Chip>{status}</Chip>;
    }
  };
  
  // --- MAIN RENDER --- //
  return (
    <SafeAreaView style={styles.safeArea}>
      <Portal>
        <PdfViewerModal visible={pdfViewerVisible} onDismiss={hidePdfViewer} pdfUrl={pdfUrlToView} fileName={pdfFileName || undefined} />
        <Dialog visible={formatDialogVisible} onDismiss={hideFormatDialog}>
          <Dialog.title>Elegir Formato de PDF</Dialog.title>
          <Dialog.Content>
            <Button icon="file-pdf-box" mode="contained" onPress={() => handleFormatSelect(selectedFactura?.urlA4)} style={styles.dialogButton}>Ver Formato A4</Button>
            <Button icon="ticket-confirmation" mode="contained" onPress={() => handleFormatSelect(selectedFactura?.urlTicket)} style={styles.dialogButton}>Ver Ticket 80mm</Button>
          </Dialog.Content>
          <Dialog.Actions><Button onPress={hideFormatDialog}>Cancelar</Button></Dialog.Actions>
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
          <ScrollView
            horizontal
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {facturas.length === 0 && !refreshing && !error ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <Text style={styles.centerMessageText}>Desliza hacia abajo para cargar las facturas</Text>
              </View>
            ) : (
              <DataTable style={styles.table}>
                  <DataTable.Header style={styles.tableHeader}>
                      <DataTable.Title style={styles.colNombre}>Serie-Correlativo</DataTable.Title>
                      <DataTable.Title style={styles.colTipo}>Tipo</DataTable.Title>
                      <DataTable.Title style={styles.colEstado}>Estado</DataTable.Title>
                      <DataTable.Title style={styles.colFechaEmision}>Fecha Emisión</DataTable.Title>
                      <DataTable.Title style={styles.colFechaRespuesta}>Fecha Resp. SUNAT</DataTable.Title>
                      <DataTable.Title style={styles.colAccion}>Acción</DataTable.Title>
                  </DataTable.Header>

                  {paginatedFacturas.length > 0 ? (
                    paginatedFacturas.map((item) => (
                        <DataTable.Row key={item.id}>
                            <DataTable.Cell style={styles.colNombre}>{formatNombre(item.nombre)}</DataTable.Cell>
                            <DataTable.Cell style={styles.colTipo}>{getTipoDocumento(item.tipo)}</DataTable.Cell>
                            <DataTable.Cell style={styles.colEstado}><StatusChip status={item.estado} /></DataTable.Cell>
                            <DataTable.Cell style={styles.colFechaEmision}>{item.issueDate}</DataTable.Cell>
                            <DataTable.Cell style={styles.colFechaRespuesta}>{item.responseDate}</DataTable.Cell>
                            <DataTable.Cell style={styles.colAccion}><Button mode="contained" onPress={() => showFormatDialog(item)}>Ver</Button></DataTable.Cell>
                        </DataTable.Row>
                    ))
                  ) : (
                    !refreshing && <DataTable.Row><DataTable.Cell><Text style={styles.emptyText}>No se encontraron facturas para tu búsqueda.</Text></DataTable.Cell></DataTable.Row>
                  )}
              </DataTable>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
