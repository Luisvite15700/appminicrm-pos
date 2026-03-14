
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Title, useTheme, Paragraph, Snackbar, Text } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

// --- INTERFACES & CONSTANTS --- //
interface Venta {
  id: number;
  PRODUCTO: string;
  CANTIDAD: number | string;
  PRECIO: number | string;
  TOTAL: number | string;
  CLIENTE_NOMBRE: string;
  CLIENTE_CORREO: string;
  CLIENTE_ID: string;
  CODIGO_SEGUIMIENTO: string;
  PEDIDO_ID: string;
  ESTADO: string;
  TIPO_COMPROBANTE?: string;
  NRO_DOCUMENTO?: string;
  createdAt: string;
  updatedAt: string;
}

const ESTADOS = ['PENDIENTE', 'PARA_SUNAT', 'COMPROBANTE_GENERADO', 'CANCELADO'];

// --- SCREEN COMPONENT --- //
export default function VentaModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { venta: ventaString } = params;
  const theme = useTheme();
  
  // --- STATE MANAGEMENT --- //
  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [total, setTotal] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [estado, setEstado] = useState('');
  const [clienteCorreo, setClienteCorreo] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('');
  const [pedidoId, setPedidoId] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState('');
  const [nroDocumento, setNroDocumento] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  const [originalVenta, setOriginalVenta] = useState<Venta | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // --- DATA INITIALIZATION --- //
  useEffect(() => {
    if (ventaString && typeof ventaString === 'string') {
      try {
        const parsedVenta: Venta = JSON.parse(ventaString);
        setOriginalVenta(parsedVenta);
        setProducto(parsedVenta.PRODUCTO || '');
        setCantidad(String(parsedVenta.CANTIDAD ?? ''));
        setPrecio(String(parsedVenta.PRECIO ?? ''));
        setClienteNombre(parsedVenta.CLIENTE_NOMBRE || '');
        setEstado(parsedVenta.ESTADO || '');
        setClienteCorreo(parsedVenta.CLIENTE_CORREO || '');
        setClienteId(parsedVenta.CLIENTE_ID || '');
        setCodigoSeguimiento(parsedVenta.CODIGO_SEGUIMIENTO || '');
        setPedidoId(parsedVenta.PEDIDO_ID || '');
        setTipoComprobante(parsedVenta.TIPO_COMPROBANTE || '');
        setNroDocumento(parsedVenta.NRO_DOCUMENTO || '');
        setCreatedAt(parsedVenta.createdAt ? new Date(parsedVenta.createdAt).toLocaleString() : '');
        setUpdatedAt(parsedVenta.updatedAt ? new Date(parsedVenta.updatedAt).toLocaleString() : '');
      } catch (e) { Alert.alert("Error de Datos", "No se pudo cargar la información."); router.back(); }
    }
  }, [ventaString]);

  useEffect(() => {
    const numCantidad = parseFloat(cantidad) || 0;
    const numPrecio = parseFloat(precio) || 0;
    setTotal((numCantidad * numPrecio).toFixed(2));
  }, [cantidad, precio]);

  // --- API ACTIONS --- //

  const handleStatusChange = async (newStatus: string) => {
    if (!originalVenta?.PEDIDO_ID || newStatus === estado) return;

    setStatusUpdateLoading(newStatus);
    try {
        const payload = {
            PEDIDO_ID: originalVenta.PEDIDO_ID,
            ESTADO: newStatus
        };

        const response = await fetch(process.env.EXPO_PUBLIC_ACTUALIZAR_ESTADO!, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error del servidor al actualizar estado.");
        }

        const updatedVenta = { ...originalVenta, ESTADO: newStatus, updatedAt: new Date().toISOString() };
        setOriginalVenta(updatedVenta as Venta);
        setEstado(newStatus);
        setUpdatedAt(new Date(updatedVenta.updatedAt).toLocaleString());
        
        setSnackbarMessage(`Estado actualizado a: ${newStatus.replace('_', ' ')}`)
        setSnackbarVisible(true)

    } catch (error: any) {
        Alert.alert('Error', `No se pudo actualizar el estado: ${error.message}`);
    } finally {
        setStatusUpdateLoading(null);
    }
  };

  const handleUpdate = async () => {
    if (!originalVenta?.id) return;
    setIsUpdating(true);
    try {
      const payload = { ...originalVenta, PRODUCTO: producto, CANTIDAD: cantidad, PRECIO: precio, TOTAL: total, CLIENTE_NOMBRE: clienteNombre, CLIENTE_CORREO: clienteCorreo, CLIENTE_ID: clienteId };
      const response = await fetch(process.env.EXPO_PUBLIC_ACTUALIZAR_VENTAS_WEBHOOK!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      
      if (response.ok) {
        Alert.alert('Éxito', 'El pedido ha sido actualizado. Refresca la lista principal para ver los cambios.');
        router.back();
      } else {
        const responseData = await response.json();
        throw new Error(responseData.message || 'Error del servidor.');
      }
    } catch (error: any) {
      Alert.alert('Error de Actualización', `No se pudo actualizar el pedido: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateComprobante = async () => {
    if (!pedidoId || !originalVenta) {
      Alert.alert('Error', 'No hay datos del pedido para generar el comprobante.');
      return;
    }

    const apiUrl = process.env.EXPO_PUBLIC_CREAR_COMPROBANTE;
    if (!apiUrl) {
      Alert.alert('Error de Configuración', 'La URL para generar comprobantes no está definida.');
      return;
    }

    setIsGenerating(true);

    try {
      const payload = {
        customer: {
          name: clienteNombre,
          email: clienteCorreo || '',
          doc_type: tipoComprobante === 'Factura Electrónica' ? '1' : '3',
          doc_number: nroDocumento,
        },
        items: [
          {
            description: producto,
            quantity: parseFloat(cantidad) || 0,
            price: parseFloat(precio) || 0,
          },
        ],
        PEDIDO_ID: pedidoId,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            throw new Error(errorJson.message || `Error del Webhook: ${errorBody}`);
        } catch (e) {
            throw new Error(`Error del Webhook: ${errorBody}`);
        }
      }

      await response.json();

      Alert.alert('Éxito', 'La solicitud para generar el comprobante ha sido enviada.');
      
      // Automatically update status to prevent multiple submissions
      if (estado !== 'COMPROBANTE_GENERADO') {
        await handleStatusChange('COMPROBANTE_GENERADO');
      }

    } catch (error: any) {
      Alert.alert('Error al Generar', error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- UI LOGIC & STYLES --- //
  const isEditable = originalVenta?.ESTADO === 'PENDIENTE' || originalVenta?.ESTADO === 'PARA_SUNAT';
  
  const hasChanges = originalVenta?.PRODUCTO !== producto || String(originalVenta?.CANTIDAD) !== cantidad || String(originalVenta?.PRECIO) !== precio || originalVenta?.CLIENTE_NOMBRE !== clienteNombre || originalVenta?.CLIENTE_CORREO !== clienteCorreo || originalVenta?.CLIENTE_ID !== clienteId;

  const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 60 },
    input: { marginBottom: 12 },
    inputDisabled: { marginBottom: 12, backgroundColor: theme.colors.surfaceDisabled },
    button: { marginTop: 8, paddingVertical: 6 },
    title: { marginBottom: 16, paddingTop: 16, color: theme.colors.primary, textAlign: 'center' },
    estadoContainer: { marginBottom: 16, padding: 12, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8 },
    estadoLabel: { fontSize: 16, marginBottom: 12, fontWeight: 'bold' },
    estadoButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    estadoButton: { width: '48%', marginBottom: 8 },
    dateText: { fontSize: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.colors.onSurface, borderBottomWidth: 1, borderBottomColor: theme.colors.outline, paddingBottom: 6 },
    snackbar: { backgroundColor: '#FFC107' },
    snackbarText: { color: '#000000' }
  });

  if (!originalVenta) { return null; }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
        <Stack.Screen options={{ title: `Pedido ${pedidoId || '...'}` }} />
        <ScrollView contentContainerStyle={styles.scrollContent} style={{backgroundColor: theme.colors.background}}>
            <Title style={styles.title}>Gestionar Pedido {pedidoId}</Title>
            
            <Paragraph style={styles.sectionTitle}>Datos del Producto</Paragraph>
            <TextInput label="Producto" value={producto} onChangeText={setProducto} style={isEditable ? styles.input : styles.inputDisabled} disabled={!isEditable} multiline/>
            <TextInput label="Cantidad" value={cantidad} onChangeText={setCantidad} style={isEditable ? styles.input : styles.inputDisabled} disabled={!isEditable} keyboardType="numeric"/>
            <TextInput label="Precio Unitario" value={precio} onChangeText={setPrecio} style={isEditable ? styles.input : styles.inputDisabled} disabled={!isEditable} keyboardType="numeric"/>
            <TextInput label="Total del Producto" value={`S/. ${total}`} style={styles.inputDisabled} disabled />
            
            <Paragraph style={styles.sectionTitle}>Datos del Cliente</Paragraph>
            <TextInput label="Cliente" value={clienteNombre} onChangeText={setClienteNombre} style={isEditable ? styles.input : styles.inputDisabled} disabled={!isEditable} />
            <TextInput label="Teléfono Cliente" value={clienteId} onChangeText={setClienteId} style={isEditable ? styles.input : styles.inputDisabled} disabled={!isEditable} keyboardType="phone-pad"/>
            <TextInput label="Comprobante" value={`${tipoComprobante || 'N/A'} - ${nroDocumento || 'N/A'}`} style={styles.inputDisabled} disabled/>


            <View style={styles.estadoContainer}>
                <Paragraph style={styles.estadoLabel}>Actualizar Estado del Pedido</Paragraph>
                <View style={styles.estadoButtons}>
                    {ESTADOS.map(s => {
                        let buttonDisabled = false;
                        if (estado === 'CANCELADO') buttonDisabled = true;
                        else if (estado === 'COMPROBANTE_GENERADO' && s !== 'CANCELADO') buttonDisabled = true;
                        else if ((estado === 'PENDIENTE' || estado === 'PARA_SUNAT') && s === 'COMPROBANTE_GENERADO') buttonDisabled = true;

                        return (
                            <Button 
                                key={s} 
                                mode={estado === s ? 'contained' : 'outlined'} 
                                onPress={() => handleStatusChange(s)} 
                                style={styles.estadoButton} 
                                disabled={buttonDisabled || !!statusUpdateLoading}
                                loading={statusUpdateLoading === s}
                            >
                                {s.replace('_', ' ')}
                            </Button>
                        );
                    })}
                </View>
            </View>

            <Button 
                mode="contained"
                onPress={handleUpdate}
                style={styles.button}
                loading={isUpdating}
                disabled={!hasChanges || isUpdating || !!statusUpdateLoading}
                icon="update"
            >
              Actualizar Otros Datos
            </Button>

            <Button 
                mode="outlined"
                onPress={handleGenerateComprobante}
                style={styles.button}
                loading={isGenerating}
                disabled={isUpdating || isGenerating || !(estado === 'PENDIENTE' || estado === 'PARA_SUNAT') || !!statusUpdateLoading}
                icon="file-document-outline"
            >
              Generar Comprobante
            </Button>
            
            <View style={{marginTop: 20}}>
                <Paragraph style={styles.dateText}>Creado: {createdAt}</Paragraph>
                <Paragraph style={styles.dateText}>Última Actualización: {updatedAt}</Paragraph>
            </View>
        </ScrollView>
        <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            style={styles.snackbar}
        >
            <Text style={styles.snackbarText}>{snackbarMessage}</Text>
        </Snackbar>
    </KeyboardAvoidingView>
  );
}
