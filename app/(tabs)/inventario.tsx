
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { DataTable, Searchbar, Button, FAB, useTheme, Title } from 'react-native-paper';
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
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_INVENTORY_LIST_API!);
      const data: Product[] = await response.json();
      setProducts(data);
      setOriginalProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = originalProducts.filter(item =>
      item.nombre.toLowerCase().includes(query.toLowerCase())
    );
    setProducts(filtered);
  };

  const handleSort = (order: 'asc' | 'desc') => {
    const sorted = [...products].sort((a, b) => {
      return order === 'asc' ? a.cantidad - b.cantidad : b.cantidad - a.cantidad;
    });
    setProducts(sorted);
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 40, 
        paddingBottom: 80, // Add padding for FAB
    },
    title: {
      marginBottom: 16,
    },
    searchbar: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    filterButton: {
      flex: 1,
      marginHorizontal: 4,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
  });

  const renderProduct = ({ item }: { item: Product }) => (
    <DataTable.Row key={item.id} onPress={() => router.push(`/producto/${item.id}`)}>
        <DataTable.Cell>{item.nombre}</DataTable.Cell>
        <DataTable.Cell numeric>{item.cantidad}</DataTable.Cell>
        <DataTable.Cell numeric>S/{item.precio_regular}</DataTable.Cell>
    </DataTable.Row>
  );

  const ListHeader = () => (
    <View>
        <ThemedText type="title" style={styles.title}>
          Inventario
        </ThemedText>
        <Searchbar
          placeholder="Buscar producto"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterContainer}>
          <Button mode="contained" onPress={() => handleSort('desc')} style={styles.filterButton}>
            Mayor cantidad
          </Button>
          <Button mode="contained" onPress={() => handleSort('asc')} style={styles.filterButton}>
            Menor cantidad
          </Button>
        </View>
        <DataTable.Header>
            <DataTable.Title>Producto</DataTable.Title>
            <DataTable.Title numeric>Cantidad</DataTable.Title>
            <DataTable.Title numeric>Precio</DataTable.Title>
        </DataTable.Header>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
        <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => router.push('/registrar-producto-modal')}
        />
    </SafeAreaView>
  );
}
