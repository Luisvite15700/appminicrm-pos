
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTheme, Searchbar, Title, Text, ActivityIndicator, TextInput, Button, IconButton, Divider } from 'react-native-paper';
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

interface VentaItem {
    id: string; // Unique ID for each cart item
    producto?: Producto; // Can be optional for manual entries
    finalProductName: string;
    cantidad: number;
    precio: number;
    total: number;
}

// --- MAIN COMPONENT --- //
export default function CrearVentaModal() {
    const theme = useTheme();
    const router = useRouter();

    // --- STATE --- //
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteCorreo, setClienteCorreo] = useState('');
    const [nroDocumento, setNroDocumento] = useState('');
    const [tipoComprobante, setTipoComprobante] = useState('Boleta de Venta');
    const [nextPedidoId, setNextPedidoId] = useState('');
    const [loadingPedidoId, setLoadingPedidoId] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allProducts, setAllProducts] = useState<Producto[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [items, setItems] = useState<VentaItem[]>([]);
    const [saleTotal, setSaleTotal] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [currentCantidad, setCurrentCantidad] = useState('1');

    // --- EFFECTS --- //
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
                setNextPedidoId(correlativoData?.[0]?.siguiente_pedido_id || 'ID_ERROR');
            } catch (error) {
                console.error("Error fetching initial data:", error);
                setNextPedidoId('ID_ERROR');
            } finally {
                setLoadingProducts(false);
                setLoadingPedidoId(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.total, 0);
        setSaleTotal(total);
    }, [items]);

    // --- HANDLERS --- //
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.length > 1) {
            setFilteredProducts(allProducts.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase())));
        } else {
            setFilteredProducts([]);
        }
    };

    const handleSelectProduct = (product: Producto) => {
        setSelectedProduct(product);
        setSearchQuery(product.nombre);
        setFilteredProducts([]);
    };

    const handleAddItem = () => {
        if (!selectedProduct) return;
        const cantidadNum = parseInt(currentCantidad, 10);
        if (isNaN(cantidadNum) || cantidadNum <= 0) {
            Alert.alert("Cantidad Inválida", "Ingrese un número válido.");
            return;
        }

        const extractContenido = (especificaciones: string): string => {
            const keyword = "Contenido";
            const startIndex = especificaciones.indexOf(keyword);
            if (startIndex === -1) return '';
            const contentSection = especificaciones.substring(startIndex);
            const lines = contentSection.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('Cantidad de flores'));
            return lines.join('\n');
        };

        const contenido = extractContenido(selectedProduct.especificaciones);
        const finalProductName = `${selectedProduct.nombre}\n\n${contenido}`;

        const newItem: VentaItem = {
            id: `item_${Date.now()}`,
            producto: selectedProduct,
            finalProductName,
            cantidad: cantidadNum,
            precio: selectedProduct.precio_regular,
            total: cantidadNum * selectedProduct.precio_regular,
        };

        setItems(prevItems => [...prevItems, newItem]);
        setSelectedProduct(null);
        setSearchQuery('');
        setCurrentCantidad('1');
    };
    
    const handleAddItemManual = () => {
        const newItem: VentaItem = {
            id: `manual_${Date.now()}`,
            finalProductName: 'Nuevo Ítem Manual',
            cantidad: 1,
            precio: 0,
            total: 0,
        };
        setItems(prevItems => [...prevItems, newItem]);
    };

    const handleUpdateItem = (id: string, field: 'finalProductName' | 'precio' | 'cantidad', value: string) => {
        setItems(currentItems =>
            currentItems.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item };
                    if (field === 'finalProductName') {
                        updatedItem.finalProductName = value;
                    } else if (field === 'precio') {
                        const newPrice = parseFloat(value) || 0;
                        updatedItem.precio = newPrice;
                        updatedItem.total = updatedItem.cantidad * newPrice;
                    } else if (field === 'cantidad') {
                        const newCantidad = parseInt(value, 10) || 0;
                        updatedItem.cantidad = newCantidad;
                        updatedItem.total = newCantidad * updatedItem.precio;
                    }
                    return updatedItem;
                }
                return item;
            })
        );
    };

    const handleRemoveItem = (id: string) => {
        setItems(currentItems => currentItems.filter(item => item.id !== id));
    };

    const handleGenerateVenta = async () => {
        if (items.length === 0) {
            Alert.alert('Venta Vacía', 'Debe agregar al menos un producto.');
            return;
        }
        if (!clienteNombre || !nroDocumento) {
            Alert.alert('Campos Incompletos', 'Complete Nombre y Nro. de Documento del cliente.');
            return;
        }
        // ... more validation logic ...

        setIsSubmitting(true);
        const salesPayload = items.map(item => ({
            PRODUCTO: item.finalProductName,
            CANTIDAD: String(item.cantidad),
            PRECIO: String(item.precio),
            TOTAL: String(item.total),
            CLIENTE_NOMBRE: clienteNombre,
            CLIENTE_CORREO: clienteCorreo || 'admin@gmail.com',
            NRO_DOCUMENTO: nroDocumento,
            TIPO_COMPROBANTE: tipoComprobante,
            ESTADO: 'PENDIENTE',
            CODIGO_SEGUIMIENTO: "51999999999",
            CLIENTE_ID: "51999999999",
            PEDIDO_ID: nextPedidoId,
        }));

        try {
            const response = await fetch(process.env.EXPO_PUBLIC_REGISTER_VENTAM_API!, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(salesPayload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Error del Webhook: ${errorBody}`);
            }

            Alert.alert('Éxito', `Venta ${nextPedidoId} registrada correctamente.`);
            router.back();

        } catch (error: any) {
            Alert.alert('Error', `No se pudo registrar la venta: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const styles = StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.colors.background },
        container: { flex: 1 },
        content: { padding: 16, gap: 16 },
        sectionTitle: { fontSize: 20 },
        sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        inputGroup: { gap: 12 },
        searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant },
        resultImage: { width: 50, height: 50, borderRadius: 8, marginRight: 10 },
        resultText: { flex: 1, fontSize: 16 },
        resultsContainer: { maxHeight: 200, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 4 },
        addItemContainer: { padding: 12, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 4, gap: 10, backgroundColor: theme.colors.surfaceVariant },
        addItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        cartItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.outlineVariant, gap: 8 },
        cartItemDetails: { flex: 1, gap: 8 },
        totalContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: theme.colors.outline },
        totalText: { fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
        selectorContainer: { marginBottom: 8 },
        selectorLabel: { fontSize: 16, color: theme.colors.onSurfaceVariant, marginBottom: 8 },
        selectorButtons: { flexDirection: 'row', gap: 10 },
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Generar Venta Múltiple' }} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>

                    {/* --- 1. DATOS DEL CLIENTE --- */}
                    <View style={styles.inputGroup}>
                        <Title style={styles.sectionTitle}>1. Datos del Cliente</Title>
                        <TextInput mode="outlined" label="ID de Pedido" value={loadingPedidoId ? 'Calculando...' : nextPedidoId} editable={false} />
                        <TextInput mode="outlined" label="Nombre del Cliente" value={clienteNombre} onChangeText={setClienteNombre} />
                        <View style={styles.selectorContainer}>
                            <Text style={styles.selectorLabel}>Tipo de Comprobante</Text>
                            <View style={styles.selectorButtons}>
                                <Button mode={tipoComprobante === 'Boleta de Venta' ? 'contained' : 'outlined'} onPress={() => setTipoComprobante('Boleta de Venta')}>Boleta</Button>
                                <Button mode={tipoComprobante === 'Factura' ? 'contained' : 'outlined'} onPress={() => setTipoComprobante('Factura')}>Factura</Button>
                            </View>
                        </View>
                        <TextInput mode="outlined" label="Nro. Documento (DNI/RUC)" value={nroDocumento} onChangeText={setNroDocumento} keyboardType="numeric" />
                        <TextInput mode="outlined" label="Correo Cliente (Opcional)" value={clienteCorreo} onChangeText={setClienteCorreo} keyboardType="email-address" />
                    </View>

                    <Divider style={{ marginVertical: 8 }} />

                    {/* --- 2. AÑADIR PRODUCTOS --- */}
                    <View style={styles.inputGroup}>
                        <View style={styles.sectionHeader}>
                            <Title style={styles.sectionTitle}>2. Añadir Productos</Title>
                            <Button icon="plus-box-outline" mode="outlined" onPress={handleAddItemManual}>Manual</Button>
                        </View>
                        <Searchbar placeholder="O buscar producto existente..." onChangeText={handleSearch} value={searchQuery} />
                        {loadingProducts && <ActivityIndicator />}
                        {filteredProducts.length > 0 && (
                            <ScrollView style={styles.resultsContainer} nestedScrollEnabled>
                                {filteredProducts.map(p => (
                                    <TouchableOpacity key={p.id} onPress={() => handleSelectProduct(p)}>
                                        <View style={styles.searchResultItem}><Image source={{ uri: p.foto }} style={styles.resultImage} /><Text style={styles.resultText}>{p.nombre}</Text></View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        {selectedProduct && (
                            <View style={styles.addItemContainer}>
                                <Text variant="titleMedium">{selectedProduct.nombre}</Text>
                                <View style={styles.addItemRow}>
                                    <TextInput mode="outlined" label="Cantidad" value={currentCantidad} onChangeText={setCurrentCantidad} keyboardType="numeric" style={{ flex: 1 }} />
                                    <Button icon="plus" mode="contained" onPress={handleAddItem} style={{ alignSelf: 'center' }}>Añadir</Button>
                                </View>
                            </View>
                        )}
                    </View>

                    <Divider style={{ marginVertical: 8 }} />

                    {/* --- 3. PEDIDO ACTUAL (EDITABLE) --- */}
                    <View style={styles.inputGroup}>
                        <Title style={styles.sectionTitle}>3. Pedido Actual</Title>
                        {items.length === 0 ? (
                            <Text>Aún no has añadido productos.</Text>
                        ) : (
                            <View style={{ gap: 12 }}>
                                {items.map(item => (
                                    <View key={item.id} style={styles.cartItem}>
                                        <IconButton icon="delete-outline" iconColor={theme.colors.error} onPress={() => handleRemoveItem(item.id)} style={{ alignSelf: 'flex-start', marginTop: 4 }}/>
                                        <View style={styles.cartItemDetails}>
                                            <TextInput
                                                mode="outlined"
                                                label="Descripción del Producto"
                                                value={item.finalProductName}
                                                onChangeText={text => handleUpdateItem(item.id, 'finalProductName', text)}
                                                multiline
                                            />
                                            <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
                                                <TextInput
                                                    mode="outlined"
                                                    label="Cantidad"
                                                    value={String(item.cantidad)}
                                                    onChangeText={text => handleUpdateItem(item.id, 'cantidad', text)}
                                                    keyboardType="numeric"
                                                    style={{flex: 1}}
                                                />
                                                <TextInput
                                                    mode="outlined"
                                                    label="Precio Unit. (S/.)"
                                                    value={String(item.precio)}
                                                    onChangeText={text => handleUpdateItem(item.id, 'precio', text)}
                                                    keyboardType="numeric"
                                                    style={{flex: 1}}
                                                />
                                            </View>
                                            <View style={{alignItems: 'flex-end', marginTop: 8 }}>
                                                <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>Total Ítem: S/. {item.total.toFixed(2)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                                <View style={styles.totalContainer}>
                                    <Text style={styles.totalText}>TOTAL VENTA: S/. {saleTotal.toFixed(2)}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                    
                    <Button mode="contained" onPress={handleGenerateVenta} style={{ marginTop: 24, paddingVertical: 8 }} loading={isSubmitting} disabled={isSubmitting || items.length === 0} icon="send">Generar Venta</Button>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
