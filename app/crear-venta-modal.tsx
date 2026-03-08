
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTheme, Searchbar, Title, Text, ActivityIndicator, TextInput, Button } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- INTERFACES --- //
interface Producto {
    id: number;
    nombre: string;
    foto: string;
    especificaciones: string;
    precio_regular: number;
}

// --- MAIN COMPONENT --- //
export default function CrearVentaModal() {
    const theme = useTheme();
    const router = useRouter();

    // --- STATE MANAGEMENT --- //
    const [allProducts, setAllProducts] = useState<Producto[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [showProductList, setShowProductList] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [finalProductName, setFinalProductName] = useState('');
    const [cantidad, setCantidad] = useState('1');
    const [precio, setPrecio] = useState('0');
    const [total, setTotal] = useState('0');
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteCorreo, setClienteCorreo] = useState('');
    const [nroDocumento, setNroDocumento] = useState('');
    const [tipoComprobante, setTipoComprobante] = useState('Boleta de Venta');
    const [estado, setEstado] = useState('PENDIENTE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nextPedidoId, setNextPedidoId] = useState('');
    const [loadingPedidoId, setLoadingPedidoId] = useState(true);

    // --- DATA FETCHING & ID GENERATION --- //
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoadingProducts(true);
            setLoadingPedidoId(true);
            try {
                const [productsRes, correlativoRes] = await Promise.all([
                    fetch(process.env.EXPO_PUBLIC_INVENTORY_LIST_API!),
                    fetch(process.env.EXPO_PUBLIC_OBTENER_ID_PEDIDO!)
                ]);

                const productsData: Producto[] = await productsRes.json();
                setAllProducts(productsData);

                const correlativoData = await correlativoRes.json();
                if (correlativoData && correlativoData.length > 0 && correlativoData[0].siguiente_pedido_id) {
                    setNextPedidoId(correlativoData[0].siguiente_pedido_id);
                } else {
                    console.error("Invalid API response for correlativo:", correlativoData);
                    setNextPedidoId('ID_ERROR');
                }

            } catch (error) { 
                console.error("Error fetching initial data:", error); 
                setNextPedidoId('ID_ERROR'); 
            }
            finally {
                setLoadingProducts(false);
                setLoadingPedidoId(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const numCantidad = parseFloat(cantidad) || 0;
        const numPrecio = parseFloat(precio) || 0;
        setTotal((numCantidad * numPrecio).toFixed(2));
    }, [cantidad, precio]);

    // --- HANDLER FUNCTIONS --- //
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.length > 1) {
            const filtered = allProducts.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase()));
            setFilteredProducts(filtered);
            setShowProductList(true);
        } else {
            setFilteredProducts([]);
            setShowProductList(false);
        }
    };

    const handleSelectProduct = (product: Producto) => {
        const extractContenido = (especificaciones: string): string => {
            const keyword = "Contenido";
            const startIndex = especificaciones.indexOf(keyword);
            if (startIndex === -1) return '';
            const contentSection = especificaciones.substring(startIndex);
            const lines = contentSection.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('Cantidad de flores'));
            return lines.join('\n');
        };
        
        setSelectedProduct(product);
        setShowProductList(false);
        setSearchQuery(product.nombre);
        const contenido = extractContenido(product.especificaciones);
        setFinalProductName(`${product.nombre}\n\n${contenido}`);
        setPrecio(product.precio_regular.toString());
        setCantidad('1');
    };

    const handleGenerateVenta = async () => {
        if (!selectedProduct || !clienteNombre || !nroDocumento) {
            Alert.alert('Campos Incompletos', 'Por favor, complete Nombre y Nro. de Documento.');
            return;
        }

        if (tipoComprobante === 'Factura' && nroDocumento.length !== 11) {
            Alert.alert('Error en RUC', 'Para Facturas, el Nro. de Documento (RUC) debe tener 11 dígitos.');
            return;
        }
        if (tipoComprobante === 'Boleta de Venta' && nroDocumento.length !== 8) {
            Alert.alert('Error en DNI', 'Para Boletas de Venta, el Nro. de Documento (DNI) debe tener 8 dígitos.');
            return;
        }

        setIsSubmitting(true);
        
        const ventaData = {
            PRODUCTO: finalProductName,
            CANTIDAD: cantidad,
            PRECIO: precio,
            TOTAL: total,
            CLIENTE_NOMBRE: clienteNombre,
            CLIENTE_CORREO: clienteCorreo || 'admin@gmail.com',
            NRO_DOCUMENTO: nroDocumento,
            TIPO_COMPROBANTE: tipoComprobante,
            ESTADO: estado,
            CODIGO_SEGUIMIENTO: "51999999999",
            CLIENTE_ID: "51999999999",
            PEDIDO_ID: nextPedidoId,
        };

        try {
            const response = await fetch(process.env.EXPO_PUBLIC_REGISTER_VENTAM_API!, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ventaData),
            });

            if (!response.ok) {
                const errorBody = await response.text(); 
                console.error('N8N Error Response:', errorBody);
                throw new Error('El webhook de registro de venta devolvió un error.');
            }

            Alert.alert('Éxito', `Venta ${nextPedidoId} registrada correctamente.`);
            router.back();

        } catch (error: any) {
            console.error('Failed to register sale:', error);
            Alert.alert('Error', `No se pudo registrar la venta: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- STYLES --- //
    const styles = StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.colors.background },
        container: { flex: 1 },
        content: { padding: 16, gap: 12 },
        searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant },
        resultImage: { width: 50, height: 50, borderRadius: 8, marginRight: 10 },
        resultText: { flex: 1, fontSize: 16 },
        resultsContainer: { maxHeight: 250 },
        selectorContainer: { marginBottom: 8 },
        selectorLabel: { fontSize: 16, color: theme.colors.onSurfaceVariant, marginBottom: 8 },
        selectorButtons: { flexDirection: 'row', gap: 10 },
    });

    // --- RENDER --- //
    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Generar Venta Manual' }} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <ScrollView>
                    <View style={styles.content}>
                        <Title>1. Buscar Producto</Title>
                        <Searchbar
                            placeholder="Escribe el nombre del producto..."
                            onChangeText={handleSearch}
                            value={searchQuery}
                        />
                        
                        {showProductList && searchQuery.length > 1 && (
                             <ScrollView style={styles.resultsContainer} nestedScrollEnabled={true}>
                                {loadingProducts && <ActivityIndicator />}
                                {filteredProducts.map(item => (
                                    <TouchableOpacity key={item.id} onPress={() => handleSelectProduct(item)}>
                                        <View style={styles.searchResultItem}>
                                            <Image source={{ uri: item.foto }} style={styles.resultImage} />
                                            <Text style={styles.resultText}>{item.nombre}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {selectedProduct && (
                            <>
                                <Title style={{marginTop: 16}}>2. Datos de la Venta</Title>
                                <TextInput mode="outlined" label="ID de Pedido Manual" value={loadingPedidoId ? 'Calculando...' : nextPedidoId} editable={false} />
                                <TextInput mode="outlined" label="Producto (auto-generado)" value={finalProductName} editable={false} multiline numberOfLines={6} />
                                <View style={{flexDirection: 'row', gap: 10}}>
                                    <TextInput mode="outlined" label="Cantidad" value={cantidad} onChangeText={setCantidad} keyboardType="numeric" style={{flex: 1}} />
                                    <TextInput mode="outlined" label="Precio" value={precio} onChangeText={setPrecio} keyboardType="numeric" style={{flex: 1}} />
                                    <TextInput mode="outlined" label="Total" value={total} editable={false} style={{flex: 1}} />
                                </View>
                                <TextInput mode="outlined" label="Nombre del Cliente" value={clienteNombre} onChangeText={setClienteNombre} />
                                
                                <View style={styles.selectorContainer}>
                                    <Text style={styles.selectorLabel}>Tipo de Comprobante</Text>
                                    <View style={styles.selectorButtons}>
                                        <Button mode={tipoComprobante === 'Boleta de Venta' ? 'contained' : 'outlined'} onPress={() => setTipoComprobante('Boleta de Venta')}>Boleta de Venta</Button>
                                        <Button mode={tipoComprobante === 'Factura' ? 'contained' : 'outlined'} onPress={() => setTipoComprobante('Factura')}>Factura</Button>
                                    </View>
                                </View>

                                <TextInput mode="outlined" label="Nro. Documento (DNI/RUC)" value={nroDocumento} onChangeText={setNroDocumento} keyboardType="numeric" />
                                <TextInput mode="outlined" label="Correo Cliente (Opcional)" value={clienteCorreo} onChangeText={setClienteCorreo} keyboardType="email-address" />
                                
                                <Button 
                                    mode="contained" 
                                    onPress={handleGenerateVenta} 
                                    style={{marginTop: 16, paddingVertical: 8}}
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                    icon="send"
                                >
                                    Generar Venta
                                </Button>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
