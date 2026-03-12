
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { TextInput, Button, Title, useTheme, Paragraph } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

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

export default function VentaModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { venta: ventaString } = params;
  const theme = useTheme();
  
  const [ventaId, setVentaId] = useState<number | null>(null);
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
  
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const setVentaData = useCallback((ventaData: Venta) => {
    setVentaId(ventaData.id);
    setProducto(ventaData.PRODUCTO || '');
    setCantidad(String(ventaData.CANTIDAD ?? ''));
    setPrecio(String(ventaData.PRECIO ?? ''));
    setTotal(String(ventaData.TOTAL ?? ''));
    setClienteNombre(ventaData.CLIENTE_NOMBRE || '');
    setEstado(ventaData.ESTADO || '');
    setClienteCorreo(ventaData.CLIENTE_CORREO || '');
    setClienteId(ventaData.CLIENTE_ID || '');
    setCodigoSeguimiento(ventaData.CODIGO_SEGUIMIENTO || '');
    setPedidoId(ventaData.PEDIDO_ID || '');
    setTipoComprobante(ventaData.TIPO_COMPROBANTE || '');
    setNroDocumento(ventaData.NRO_DOCUMENTO || '');
    setCreatedAt(ventaData.createdAt ? new Date(ventaData.createdAt).toLocaleString() : '');
    setUpdatedAt(ventaData.updatedAt ? new Date(ventaData.updatedAt).toLocaleString() : '');
    setOriginalVenta(ventaData);
  }, []);

  const fetchVentaById = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_ID_VENTA_WEBHOOK!}?id=${id}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setVentaData(data[0]);
      }
    } catch (error) {
      Alert.alert("Error de Carga", "No se pudieron recargar los detalles de la venta.");
    } finally {
      setLoading(false);
    }
  }, [setVentaData]);
  
  useEffect(() => {
    if (ventaString && typeof ventaString === 'string') {
      const parsedVenta = JSON.parse(ventaString);
      fetchVentaById(parsedVenta.id);
    } else {
      setLoading(false);
    }
  }, [ventaString, fetchVentaById]);

  useEffect(() => {
    const numCantidad = parseFloat(cantidad) || 0;
    const numPrecio = parseFloat(precio) || 0;
    setTotal((numCantidad * numPrecio).toFixed(2));
  }, [cantidad, precio]);

  const handleUpdate = async () => {
    if (!ventaId) return;
    setIsUpdating(true);
    try {
      const payload = { id: ventaId, PRODUCTO: producto, CANTIDAD: cantidad, PRECIO: precio, TOTAL: total, CLIENTE_NOMBRE: clienteNombre, CLIENTE_CORREO: clienteCorreo, CLIENTE_ID: clienteId, CODIGO_SEGUIMIENTO: codigoSeguimiento, PEDIDO_ID: pedidoId, TIPO_COMPROBANTE: tipoComprobante, NRO_DOCUMENTO: nroDocumento, ESTADO: estado };
      const response = await fetch(process.env.EXPO_PUBLIC_ACTUALIZAR_VENTAS_WEBHOOK!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (response.ok) {
        Alert.alert('Éxito', 'El pedido ha sido actualizado correctamente. Refrescando datos...');
        await fetchVentaById(ventaId);
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
    if (!originalVenta) {
        Alert.alert("Error", "Datos de la venta no disponibles. Por favor, recargue.");
        return;
    }

    setIsGenerating(true);
    try {
        let sunatDocType;
        switch (originalVenta.TIPO_COMPROBANTE) {
            case 'Factura':
                sunatDocType = '6'; // RUC
                break;
            case 'Boleta':
            case 'Boleta de Venta': // Handle both short and long names
                sunatDocType = '1'; // DNI
                break;
            default:
                Alert.alert("Error de Datos", `Tipo de comprobante no válido: '${originalVenta.TIPO_COMPROBANTE}'. Se esperaba 'Factura' o 'Boleta'.`);
                setIsGenerating(false);
                return;
        }

        const payload = {
            customer: {
                name: originalVenta.CLIENTE_NOMBRE,
                email: originalVenta.CLIENTE_CORREO,
                doc_type: sunatDocType,
                doc_number: originalVenta.NRO_DOCUMENTO,
            },
            items: [
                {
                    description: originalVenta.PRODUCTO,
                    quantity: Number(originalVenta.CANTIDAD),
                    price: Number(originalVenta.PRECIO),
                },
            ],
            PEDIDO_ID: originalVenta.PEDIDO_ID,
        };

        const response = await fetch(process.env.EXPO_PUBLIC_CREAR_COMPROBANTE!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'El servicio de facturación respondió con un error.');
        }

        Alert.alert("Éxito", "El comprobante fue enviado para su procesamiento.");
        
        const updatePayload = { ...originalVenta, ESTADO: 'COMPROBANTE_GENERADO' };
        const updateResponse = await fetch(process.env.EXPO_PUBLIC_ACTUALIZAR_VENTAS_WEBHOOK!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
        });

        if (!updateResponse.ok) {
            Alert.alert("Aviso", "El comprobante se generó, pero el estado del pedido no pudo actualizarse. Por favor, actualice manualmente.");
        }
        
        await fetchVentaById(originalVenta.id);

    } catch (error: any) {
        Alert.alert("Error al Generar", `No se pudo procesar el comprobante: ${error.message}`);
    } finally {
        setIsGenerating(false);
    }
};


  const isEditable = originalVenta?.ESTADO === 'PENDIENTE' || originalVenta?.ESTADO === 'PARA_SUNAT';
  
  const hasChanges = originalVenta?.PRODUCTO !== producto || String(originalVenta?.CANTIDAD) !== cantidad || String(originalVenta?.PRECIO) !== precio || originalVenta?.CLIENTE_NOMBRE !== clienteNombre || originalVenta?.ESTADO !== estado;

  let isUpdateDisabled = true;
  if (originalVenta) {
    if ((originalVenta.ESTADO === 'PENDIENTE' || originalVenta.ESTADO === 'PARA_SUNAT') && hasChanges) {
      isUpdateDisabled = false;
    } else if (originalVenta.ESTADO === 'COMPROBANTE_GENERADO' && estado === 'CANCELADO') {
      isUpdateDisabled = false;
    }
  }

  const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 60 },
    input: { marginBottom: 12 },
    inputDisabled: { marginBottom: 12, backgroundColor: theme.colors.surfaceDisabled },
    button: { marginTop: 8, paddingVertical: 6 },
    title: { marginBottom: 16, paddingTop: 16, color: theme.colors.primary, textAlign: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    estadoContainer: { marginBottom: 16, padding: 12, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8 },
    estadoLabel: { fontSize: 16, marginBottom: 12, fontWeight: 'bold' },
    estadoButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    estadoButton: { width: '48%', marginBottom: 8 },
    dateText: { fontSize: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.colors.onSurface, borderBottomWidth: 1, borderBottomColor: theme.colors.outline, paddingBottom: 6 }
  });

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator animating={true} size="large" /></View>;
  }

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
            <TextInput label="Comprobante" value={`${tipoComprobante || 'N/A'} - ${nroDocumento || 'N/A'}`} style={styles.inputDisabled} disabled/>

            <View style={styles.estadoContainer}>
                <Paragraph style={styles.estadoLabel}>Actualizar Estado del Pedido</Paragraph>
                <View style={styles.estadoButtons}>
                    {ESTADOS.map(s => {
                        let buttonDisabled = false;
                        const currentStatus = originalVenta?.ESTADO;

                        if (currentStatus === 'CANCELADO') {
                            buttonDisabled = true;
                        } else if (currentStatus === 'COMPROBANTE_GENERADO') {
                            if (s !== 'COMPROBANTE_GENERADO' && s !== 'CANCELADO') {
                                buttonDisabled = true;
                            }
                        } else if (currentStatus === 'PENDIENTE' || currentStatus === 'PARA_SUNAT') {
                            if (s === 'COMPROBANTE_GENERADO') {
                                buttonDisabled = true;
                            }
                        }

                        return (
                            <Button key={s} mode={estado === s ? 'contained' : 'outlined'} onPress={() => setEstado(s)} style={styles.estadoButton} disabled={buttonDisabled}>
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
                disabled={isUpdateDisabled || isUpdating}
                icon="update"
            >
              Actualizar Pedido
            </Button>

            <Button 
                mode="outlined"
                onPress={handleGenerateComprobante}
                style={styles.button}
                loading={isGenerating}
                disabled={isUpdating || isGenerating || originalVenta?.ESTADO !== 'PARA_SUNAT'}
                icon="file-document-outline"
            >
              Generar Comprobante
            </Button>
            
            <View style={{marginTop: 20}}>
                <Paragraph style={styles.dateText}>Creado: {createdAt}</Paragraph>
                <Paragraph style={styles.dateText}>Última Actualización: {updatedAt}</Paragraph>
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
