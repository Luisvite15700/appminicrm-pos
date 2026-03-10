
import React, { useState, useEffect } from 'react';
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
  
  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [total, setTotal] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCorreo, setClienteCorreo] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('');
  const [pedidoId, setPedidoId] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState('');
  const [nroDocumento, setNroDocumento] = useState('');
  const [estado, setEstado] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchVenta = async () => {
      if (ventaString && typeof ventaString === 'string') {
        const parsedVenta = JSON.parse(ventaString);
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_ID_VENTA_WEBHOOK!}?id=${parsedVenta.id}`);
          const data = await response.json();
          if (data && data.length > 0) {
            const ventaData: Venta = data[0];

            setProducto(ventaData.PRODUCTO || '');
            setCantidad(String(ventaData.CANTIDAD ?? ''));
            setPrecio(String(ventaData.PRECIO ?? ''));
            setTotal(String(ventaData.TOTAL ?? ''));
            setClienteNombre(ventaData.CLIENTE_NOMBRE || '');
            setClienteCorreo(ventaData.CLIENTE_CORREO || '');
            setClienteId(ventaData.CLIENTE_ID || '');
            setCodigoSeguimiento(ventaData.CODIGO_SEGUIMIENTO || '');
            setPedidoId(ventaData.PEDIDO_ID || '');
            setTipoComprobante(ventaData.TIPO_COMPROBANTE || '');
            setNroDocumento(ventaData.NRO_DOCUMENTO || '');
            setEstado(ventaData.ESTADO || '');
            setCreatedAt(ventaData.createdAt ? new Date(ventaData.createdAt).toLocaleString() : '');
            setUpdatedAt(ventaData.updatedAt ? new Date(ventaData.updatedAt).toLocaleString() : '');
          }
        } catch (error) {
          console.error("Error fetching venta:", error);
          Alert.alert("Error de Carga", "No se pudieron cargar los detalles de la venta.");
        } finally {
            setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchVenta();
  }, [ventaString]);

  const handleUpdate = async () => {
    if (!pedidoId) {
        Alert.alert('Error', 'No se puede actualizar porque no se encontró el ID del Pedido.');
        return;
    }
    setIsUpdating(true);
    try {
      // --- FINAL FIX: Convert numeric fields back to numbers before sending ---
      const fullPayload = {
        PEDIDO_ID: pedidoId,
        ESTADO: estado,
        CLIENTE_NOMBRE: clienteNombre,
        PRODUCTO: producto,
        // Convert back to numbers to match backend expectation
        CANTIDAD: Number(cantidad),
        PRECIO: Number(precio),
        TOTAL: Number(total),
        // Send all other preserved data
        CLIENTE_CORREO: clienteCorreo,
        CLIENTE_ID: clienteId,
        CODIGO_SEGUIMIENTO: codigoSeguimiento,
        TIPO_COMPROBANTE: tipoComprobante,
        NRO_DOCUMENTO: nroDocumento,
      };

      const response = await fetch(process.env.EXPO_PUBLIC_ACTUALIZAR_VENTAS_WEBHOOK!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
      });

      if (response.ok) {
        Alert.alert('Éxito', `El pedido ${pedidoId} ha sido actualizado correctamente.`);
        router.back();
      } else {
        const errorText = await response.text();
        Alert.alert('Error de Actualización', `No se pudo actualizar el pedido: ${errorText}`);
      }
    } catch (error: any) {
      Alert.alert('Error de Conexión', `Ocurrió un error: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateComprobante = async () => { /* ... */ };
  
  const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    inputDisabled: { marginBottom: 12, backgroundColor: theme.colors.surfaceDisabled },
    inputEditable: { marginBottom: 12 },
    button: { marginTop: 8, paddingVertical: 6 },
    title: { marginBottom: 16, paddingTop: 16, color: theme.colors.primary, textAlign: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    estadoContainer: { marginBottom: 16, padding: 12, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8 },
    estadoLabel: { fontSize: 16, marginBottom: 12, color: theme.colors.onSurfaceVariant, fontWeight: 'bold' },
    estadoButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    estadoButton: { width: '48%', marginBottom: 8 },
    dateText: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 4, textAlign: 'center' },
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
            
            <Paragraph style={styles.sectionTitle}>Datos del Producto (Solo Lectura)</Paragraph>
            <TextInput label="Producto" value={producto} style={styles.inputDisabled} disabled multiline/>
            <TextInput label="Cantidad" value={cantidad} style={styles.inputDisabled} disabled />
            <TextInput label="Precio Unitario" value={`S/. ${precio}`} style={styles.inputDisabled} disabled />
            <TextInput label="Total del Producto" value={`S/. ${total}`} style={styles.inputDisabled} disabled />
            
            <Paragraph style={styles.sectionTitle}>Datos a Modificar</Paragraph>
            <TextInput label="Cliente" value={clienteNombre} onChangeText={setClienteNombre} style={styles.inputEditable} />
            <TextInput label="Comprobante" value={`${tipoComprobante || 'N/A'} - ${nroDocumento || 'N/A'}`} style={styles.inputDisabled} disabled/>

            <View style={styles.estadoContainer}>
                <Paragraph style={styles.estadoLabel}>Actualizar Estado del Pedido</Paragraph>
                <View style={styles.estadoButtons}>
                    {ESTADOS.map(s => (
                        <Button key={s} mode={estado === s ? 'contained' : 'outlined'} onPress={() => setEstado(s)} style={styles.estadoButton}>
                            {s.replace('_', ' ')}
                        </Button>
                    ))}
                </View>
            </View>

            <Button 
                mode="contained"
                onPress={handleUpdate}
                style={styles.button}
                loading={isUpdating}
                disabled={isUpdating || isGenerating}
                icon="update"
            >
              Actualizar Pedido
            </Button>

            <Button 
                mode="outlined"
                onPress={handleGenerateComprobante}
                style={styles.button}
                loading={isGenerating}
                disabled={isUpdating || isGenerating}
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
