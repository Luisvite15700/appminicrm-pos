
import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Text } from 'react-native';
import { DataTable, Searchbar, useTheme, Title, Button, Portal, Dialog, Chip } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PdfViewerModal from '../../components/PdfViewerModal';

// --- INTERFACES --- //
interface Factura {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  issueTime: number;
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

// --- SCREEN COMPONENT --- //
export default function FacturasScreen() {
  // --- STATE MANAGEMENT --- //
  const [searchQuery, setSearchQuery] = useState('');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [originalFacturas, setOriginalFacturas] = useState<Factura[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const theme = useTheme();

  // Dialogs and Modals state
  const [formatDialogVisible, setFormatDialogVisible] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfUrlToView, setPdfUrlToView] = useState<string | null>(null);

  // --- DATA FETCHING & PROCESSING --- //
  const fetchFacturas = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_OBTENER_PDF!);
      const apiResponse = await response.json();

      const rawFacturas: ApiFactura[] = Array.isArray(apiResponse.data) ? apiResponse.data : [];

      const formattedFacturas = rawFacturas
        .filter(item => item && item.id)
        .map(item => ({
          id: item.id,
          nombre: item.fileName,
          tipo: item.type,
          estado: item.status || 'N/A',
          issueTime: item.issueTime,
          issueDate: item.issueDate || 'N/A',
          responseDate: item.responseDate || 'N/A',
          urlA4: item.pdfA4,
          urlTicket: item.pdfTicket80,
        }));

      setFacturas(formattedFacturas);
      setOriginalFacturas(formattedFacturas);
    } catch (error) {
      console.error("Error fetching facturas:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Effect to fetch data on focus
  useFocusEffect(useCallback(() => { fetchFacturas(); }, [fetchFacturas]));

  // Effect to update time for dynamic status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => { fetchFacturas(); }, [fetchFacturas]);

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
  };

  // --- SEARCH LOGIC --- //
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();
    const filtered = originalFacturas.filter(item =>
      (formatNombre(item.nombre).toLowerCase().includes(lowerCaseQuery)) ||
      (getTipoDocumento(item.tipo).toLowerCase().includes(lowerCaseQuery)) ||
      (item.estado && item.estado.toLowerCase().includes(lowerCaseQuery)) ||
      (item.issueDate && item.issueDate.toLowerCase().includes(lowerCaseQuery)) ||
      (item.responseDate && item.responseDate.toLowerCase().includes(lowerCaseQuery))
    );
    setFacturas(filtered);
  };

  // --- STYLES --- //
  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1 },
    headerContainer: { paddingHorizontal: 16 },
    title: { marginTop: 16, marginBottom: 16 },
    searchbar: { marginBottom: 16 },
    tableHeader: { backgroundColor: theme.colors.surface },
    dialogButton: { marginTop: 8 },
    table: { minWidth: 950 },
    colNombre: { width: 180 },
    colTipo: { width: 80, justifyContent: 'center' },
    colEstado: { width: 130, justifyContent: 'center' },
    colFechaEmision: { width: 220, justifyContent: 'center' },
    colFechaRespuesta: { width: 220, justifyContent: 'center' },
    colAccion: { width: 110, justifyContent: 'center' },
  });

  // --- CHILD COMPONENTS --- //

  // Status Chip Component with new, improved colors
  const StatusChip = ({ status, issueTime }: { status: string; issueTime: number }) => {
    const tenMinutesInSeconds = 600;
    const timeDifference = (currentTime / 1000) - issueTime;

    if (status === 'EXCEPCION') {
      if (timeDifference > tenMinutesInSeconds) {
        // Warning color (Reintentar)
        return <Chip icon="sync-alert" selectedColor="#7F5F01" style={{ backgroundColor: '#FFECB3' }}>Reintentar</Chip>;
      }
      // Neutral color (Validando)
      return <Chip icon="timer-sand" selectedColor={theme.colors.onSurfaceVariant} style={{ backgroundColor: theme.colors.surfaceVariant }}>Validando</Chip>;
    }

    switch (status) {
      case 'ACEPTADO':
        // Success color
        return <Chip icon="check-circle" selectedColor="#0B6A38" style={{ backgroundColor: '#D1F4E1' }}>Aceptado</Chip>;
      case 'RECHAZADO':
        // Correct error color from theme (no more pink!)
        return <Chip icon="alert-circle" selectedColor={theme.colors.onErrorContainer} style={{ backgroundColor: theme.colors.errorContainer }}>Rechazado</Chip>;
      default:
        return <Chip>{status}</Chip>;
    }
  };
  
  // --- MAIN RENDER --- //
  return (
    <SafeAreaView style={styles.safeArea}>
      <Portal>
        <PdfViewerModal visible={pdfViewerVisible} onDismiss={hidePdfViewer} pdfUrl={pdfUrlToView} />
        <Dialog visible={formatDialogVisible} onDismiss={hideFormatDialog}>
          <Dialog.Title>Elegir Formato de PDF</Dialog.Title>
          <Dialog.Content>
            <Button icon="file-pdf-box" mode="contained" onPress={() => handleFormatSelect(selectedFactura?.urlA4)} style={styles.dialogButton}>Ver Formato A4</Button>
            <Button icon="ticket-confirmation" mode="contained" onPress={() => handleFormatSelect(selectedFactura?.urlTicket)} style={styles.dialogButton}>Ver Ticket 80mm</Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideFormatDialog}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <View style={styles.container}>
        <View style={styles.headerContainer}>
            <Title style={styles.title}>Facturas y Documentos</Title>
            <Searchbar
            placeholder="Buscar..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchbar}
            />
        </View>

        <ScrollView 
          horizontal 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <DataTable style={styles.table}>
                <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title style={styles.colNombre}>Serie-Correlativo</DataTable.Title>
                    <DataTable.Title style={styles.colTipo}>Tipo</DataTable.Title>
                    <DataTable.Title style={styles.colEstado}>Estado</DataTable.Title>
                    <DataTable.Title style={styles.colFechaEmision}>Fecha Emisión</DataTable.Title>
                    <DataTable.Title style={styles.colFechaRespuesta}>Fecha Resp. SUNAT</DataTable.Title>
                    <DataTable.Title style={styles.colAccion}>Acción</DataTable.Title>
                </DataTable.Header>

                {facturas.map((item) => (
                    <DataTable.Row key={item.id}>
                        <DataTable.Cell style={styles.colNombre}>{formatNombre(item.nombre)}</DataTable.Cell>
                        <DataTable.Cell style={styles.colTipo}>{getTipoDocumento(item.tipo)}</DataTable.Cell>
                        <DataTable.Cell style={styles.colEstado}>
                          <StatusChip status={item.estado} issueTime={item.issueTime} />
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colFechaEmision}>{item.issueDate}</DataTable.Cell>
                        <DataTable.Cell style={styles.colFechaRespuesta}>{item.responseDate}</DataTable.Cell>
                        <DataTable.Cell style={styles.colAccion}>
                            <Button mode="contained" onPress={() => showFormatDialog(item)}>Ver</Button>
                        </DataTable.Cell>
                    </DataTable.Row>
                ))}
            </DataTable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
