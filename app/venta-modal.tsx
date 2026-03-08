
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { TextInput, Button, Title, useTheme, Paragraph } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

interface Venta {
  id: number;
  PRODUCTO: string;
  CANTIDAD: string;
  PRECIO: string;
  TOTAL: string;
  CLIENTE_NOMBRE: string;
  CLIENTE_CORREO: string;
  CLIENTE_ID: string;
  CODIGO_SEGUIMIENTO: string;
  ESTADO: string;
  PEDIDO_ID: string;
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
  const [isUpdating, setIsUpdating] = useState(false); // For the update button
  const [isGenerating, setIsGenerating] = useState(false); // For the generate receipt button

  useEffect(() => {
    const fetchVenta = async () => {
      if (ventaString && typeof ventaString === 'string') {
        const parsedVenta = JSON.parse(ventaString);
        setVentaId(parsedVenta.id);
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_ID_VENTA_WEBHOOK!}?id=${parsedVenta.id}`);
          const data = await response.json();
          if (data && data.length > 0) {
            const ventaData: Venta = data[0];
            setProducto(ventaData.PRODUCTO || '');
            setCantidad(ventaData.CANTIDAD || '');
            setPrecio(ventaData.PRECIO || '');
            setTotal(ventaData.TOTAL || '');
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
    if (!ventaId) return;
    setIsUpdating(true);

    const updatedVentaData = {
      id: ventaId,
      PRODUCTO: producto,
      CANTIDAD: cantidad,
      PRECIO: precio,
      TOTAL: total,
      CLIENTE_NOMBRE: clienteNombre,
      CLIENTE_CORREO: clienteCorreo,
      CLIENTE_ID: clienteId,
      CODIGO_SEGUIMIENTO: codigoSeguimiento,
      PEDIDO_ID: pedidoId,
      TIPO_COMPROBANTE: tipoComprobante,
      NRO_DOCUMENTO: nroDocumento,
      ESTADO: estado,
    };

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_ACTUALIZAR_VENTAS_WEBHOOK!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVentaData),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Venta actualizada correctamente.');
        router.back();
      } else {
        const errorText = await response.text();
        Alert.alert('Error', `No se pudo actualizar la venta: ${errorText}`);
      }
    } catch (error: any) {
      Alert.alert('Error', `Ocurrió un error: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateComprobante = async () => {
    setIsGenerating(true);

    const comprobanteData = {
        id: ventaId,
        PRODUCTO: producto,
        CANTIDAD: cantidad,
        PRECIO: precio,
        TOTAL: total,
        CLIENTE_NOMBRE: clienteNombre,
        CLIENTE_CORREO: clienteCorreo,
        CLIENTE_ID: clienteId,
        CODIGO_SEGUIMIENTO: codigoSeguimiento,
        PEDIDO_ID: pedidoId,
        TIPO_COMPROBANTE: tipoComprobante,
        NRO_DOCUMENTO: nroDocumento,
        ESTADO: estado, // Current state is sent
    };

    try {
        const response = await fetch(process.env.EXPO_PUBLIC_CREAR_COMPROBANTE!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comprobanteData),
        });

        if(response.ok) {
            Alert.alert('Éxito', 'La solicitud para generar el comprobante ha sido enviada.');
            // Optionally, you could update the status locally or refetch
            setEstado('PARA_SUNAT');
        } else {
            const errorText = await response.text();
            Alert.alert('Error', `No se pudo generar el comprobante: ${errorText}`);
        }
    } catch (error: any) {
        Alert.alert('Error', `Ocurrió un error al enviar la solicitud: ${error.message}`);
    } finally {
        setIsGenerating(false);
    }
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    input: {
      marginBottom: 16,
    },
    button: {
      marginTop: 8, // Adjusted margin for multiple buttons
      paddingVertical: 6,
    },
    title: {
        marginBottom: 16,
        paddingTop: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    estadoContainer: {
        marginBottom: 16,
    },
    estadoLabel: {
        fontSize: 16,
        marginBottom: 8,
        color: theme.colors.onSurface,
    },
    estadoButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    estadoButton: {
        width: '48%',
        marginBottom: 8,
    },
    dateText: {
        fontSize: 14,
        color: theme.colors.onSurface,
        marginBottom: 8,
    }
  });

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} />
        </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
        <Stack.Screen 
            options={{ 
                title: 'Editar Venta',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
            }}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} style={{backgroundColor: theme.colors.background}}>
            <Title style={styles.title}>Editar Venta</Title>
            
            <TextInput label="Producto" value={producto} onChangeText={setProducto} style={styles.input} />
            <TextInput label="Cantidad" value={cantidad} onChangeText={setCantidad} style={styles.input} keyboardType="numeric" />
            <TextInput label="Precio" value={precio} onChangeText={setPrecio} style={styles.input} keyboardType="numeric" />
            <TextInput label="Total" value={total} onChangeText={setTotal} style={styles.input} keyboardType="numeric" />
            <TextInput label="Nombre Cliente" value={clienteNombre} onChangeText={setClienteNombre} style={styles.input} />
            <TextInput label="Correo Cliente" value={clienteCorreo} onChangeText={setClienteCorreo} style={styles.input} keyboardType="email-address" />
            <TextInput label="ID Cliente" value={clienteId} onChangeText={setClienteId} style={styles.input} />
            <TextInput label="Código Seguimiento" value={codigoSeguimiento} onChangeText={setCodigoSeguimiento} style={styles.input} />
            <TextInput label="ID Pedido" value={pedidoId} onChangeText={setPedidoId} style={styles.input} />
            <TextInput label="Tipo Comprobante" value={tipoComprobante} onChangeText={setTipoComprobante} style={styles.input} />
            <TextInput label="Nro. Documento" value={nroDocumento} onChangeText={setNroDocumento} style={styles.input} />

            <View style={styles.estadoContainer}>
                <Paragraph style={styles.estadoLabel}>Estado</Paragraph>
                <View style={styles.estadoButtons}>
                    {ESTADOS.map(s => (
                        <Button 
                            key={s} 
                            mode={estado === s ? 'contained' : 'outlined'} 
                            onPress={() => setEstado(s)}
                            style={styles.estadoButton}
                        >
                            {s.replace('_', ' ')}
                        </Button>
                    ))}
                </View>
            </View>

            <Paragraph style={styles.dateText}>Creado: {createdAt}</Paragraph>
            <Paragraph style={styles.dateText}>Actualizado: {updatedAt}</Paragraph>

            <Button 
                mode="contained"
                onPress={handleUpdate}
                style={styles.button}
                loading={isUpdating}
                disabled={isUpdating || isGenerating}
            >
              Actualizar Venta
            </Button>

            <Button 
                mode="outlined" // Or contained, as you prefer
                onPress={handleGenerateComprobante}
                style={styles.button}
                loading={isGenerating}
                disabled={isUpdating || isGenerating}
                icon="file-document-outline"
            >
              GENERAR COMPROBANTE
            </Button>

        </ScrollView>
    </KeyboardAvoidingView>
  );
}
