
import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { DataTable, Searchbar, Button, FAB, useTheme } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the type for a product
interface Product {
  id: number;
  nombre: string;
  foto: string | null;
  galeria: string;
  especificaciones: string | null;
  precio_regular: string;
  precio_descuento: string;
  video: string | null;
  slug: string;
  cantidad: number;
  categoria: string;
  createdAt: string;
  updatedAt: string;
}

export default function TabInventarioScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  const fetchProducts = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_INVENTORY_LIST_API!);
      const data: Product[] = await response.json();
      setOriginalProducts(data);
      setProducts(data);
      setSearchQuery(''); // Clear search on refresh
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // OPTIMIZATION: Fetch data only when the screen is focused for the first time
  useFocusEffect(
    useCallback(() => {
      // Only fetch if we don't have products yet.
      if (originalProducts.length === 0) {
        fetchProducts();
      }
    }, [originalProducts.length, fetchProducts])
  );

  const onRefresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query === '') {
      setProducts(originalProducts);
    } else {
      const filtered = originalProducts.filter(item =>
        item.nombre.toLowerCase().includes(query.toLowerCase()) ||
        (item.categoria && item.categoria.toLowerCase().includes(query.toLowerCase()))
      );
      setProducts(filtered);
    }
  };

  const handleSort = (order: 'asc' | 'desc') => {
    const sorted = [...products].sort((a, b) => {
      return order === 'asc' ? a.cantidad - b.cantidad : b.cantidad - a.cantidad;
    });
    setProducts(sorted);
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 80 }, // Space for FAB
    title: { marginBottom: 16 },
    searchbar: { marginBottom: 16, backgroundColor: theme.colors.surface },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    filterButton: { flex: 1, marginHorizontal: 4 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: theme.colors.primary },
    table: { minWidth: 550 },
    colProducto: { width: 200 },
    colCategoria: { width: 100},
    colPrecio: { width: 50, justifyContent: 'flex-end' },
    colCantidad: { width: 100, justifyContent: 'flex-end' },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <ThemedText type="title" style={styles.title}>Inventario</ThemedText>

                <Searchbar
                  placeholder="Buscar por producto o categoría"
                  onChangeText={handleSearch}
                  value={searchQuery}
                  style={styles.searchbar}
                />

                <View style={styles.filterContainer}>
                  <Button mode="contained" onPress={() => handleSort('desc')} style={styles.filterButton}>Mayor cantidad</Button>
                  <Button mode="contained" onPress={() => handleSort('asc')} style={styles.filterButton}>Menor cantidad</Button>
                </View>

                <ScrollView horizontal>
                    <DataTable style={styles.table}>
                        <DataTable.Header>
                            <DataTable.Title style={styles.colProducto}>Producto</DataTable.Title>
                            <DataTable.Title style={styles.colCategoria}>Categoría</DataTable.Title>
                            <DataTable.Title numeric style={styles.colPrecio}>Precio</DataTable.Title>
                            
                        </DataTable.Header>

                        {products.map((item) => (
                        <DataTable.Row key={item.id} onPress={() => router.push(`/producto/${item.id}`)}>
                            <DataTable.Cell style={styles.colProducto}>{item.nombre}</DataTable.Cell>
                            <DataTable.Cell style={styles.colCategoria}>{item.categoria}</DataTable.Cell>
                            <DataTable.Cell numeric style={styles.colPrecio}>S/{item.precio_regular}</DataTable.Cell>
                             
                        </DataTable.Row>
                        ))}
                    </DataTable>
                </ScrollView>
            </ScrollView>

            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => router.push('/registrar-producto-modal')}
            />
        </View>
    </SafeAreaView>
  );
}
