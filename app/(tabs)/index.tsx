
import { ThemedText } from '@/components/themed-text';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Paragraph, Searchbar, Title, useTheme, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

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
  createdAt: string;
  updatedAt: string;
}

export default function TabVentasScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sales, setSales] = useState<Venta[]>([]);
  const [originalSales, setOriginalSales] = useState<Venta[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const fetchSales = async () => {
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_LISTA_VENTAS_WEBHOOK!);
      const data: Venta[] = await response.json();
      setSales(data);
      setOriginalSales(data);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSales();
    setRefreshing(false);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = originalSales.filter(sale =>
      sale.PRODUCTO.toLowerCase().includes(query.toLowerCase()) ||
      sale.PEDIDO_ID.toLowerCase().includes(query.toLowerCase()) ||
      sale.CLIENTE_NOMBRE.toLowerCase().includes(query.toLowerCase())
    );
    setSales(filtered);
  };

  const handleSort = (order: 'asc' | 'desc') => {
    const sorted = [...sales].sort((a, b) => {
      const totalA = parseFloat(a.TOTAL);
      const totalB = parseFloat(b.TOTAL);
      return order === 'asc' ? totalA - totalB : totalB - totalA;
    });
    setSales(sorted);
  };

  const handleDateFilter = (period: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    let filtered: Venta[] = [];

    if (period === 'day') {
      filtered = originalSales.filter(sale => new Date(sale.createdAt).toDateString() === now.toDateString());
    } else if (period === 'week') {
      const startOfWeek = getStartOfWeek(now);
      startOfWeek.setHours(0, 0, 0, 0);
      filtered = originalSales.filter(sale => new Date(sale.createdAt) >= startOfWeek);
    } else if (period === 'month') {
      filtered = originalSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      });
    } else if (period === 'year') {
      filtered = originalSales.filter(sale => new Date(sale.createdAt).getFullYear() === now.getFullYear());
    }

    setSales(filtered);
  };
  
  const handleViewDetails = (venta: Venta) => {
    router.push({ pathname: '/venta-modal', params: { venta: JSON.stringify(venta) } });
  };

  const handleCreateVenta = () => {
    router.push('/crear-venta-modal');
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    card: { marginBottom: 16, backgroundColor: theme.colors.surface },
    searchbar: { marginBottom: 16 },
    priceFilterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    dateFilterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    filterButton: { flex: 1, marginHorizontal: 4 },
    dateButton: { flex: 1, marginHorizontal: 2 },
    title: { marginBottom: 16 },
    listContent: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: theme.colors.primary },
  });

  const renderSale = ({ item }: { item: Venta }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Pedido {item.PEDIDO_ID}</Title>
        <Paragraph>{item.PRODUCTO}</Paragraph>
        <Paragraph>Cliente: {item.CLIENTE_NOMBRE}</Paragraph>
        <Paragraph>Total: S/{item.TOTAL}</Paragraph>
        <Paragraph>Estado: {item.ESTADO}</Paragraph>
        <Paragraph>Fecha: {new Date(item.createdAt).toLocaleDateString()}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => handleViewDetails(item)}>Ver Detalle</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSale}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View>
              <ThemedText type="title" style={styles.title}>Ventas</ThemedText>
              <Searchbar
                placeholder="Buscar por Pedido, Producto o Cliente"
                onChangeText={handleSearch}
                value={searchQuery}
                style={styles.searchbar}
              />
              <View style={styles.priceFilterContainer}>
                <Button mode="contained" onPress={() => handleSort('desc')} style={styles.filterButton}>Mayor total</Button>
                <Button mode="contained" onPress={() => handleSort('asc')} style={styles.filterButton}>Menor total</Button>
              </View>
              <View style={styles.dateFilterContainer}>
                <Button mode="outlined" onPress={() => handleDateFilter('day')} style={styles.dateButton}>Día</Button>
                <Button mode="outlined" onPress={() => handleDateFilter('week')} style={styles.dateButton}>Semana</Button>
                <Button mode="outlined" onPress={() => handleDateFilter('month')} style={styles.dateButton}>Mes</Button>
                <Button mode="outlined" onPress={() => handleDateFilter('year')} style={styles.dateButton}>Año</Button>
              </View>
            </View>
          }
        />
        <FAB
            icon="plus"
            label="Crear Venta"
            style={styles.fab}
            onPress={handleCreateVenta}
            color={theme.colors.onPrimary}
        />
    </SafeAreaView>
  );
}
