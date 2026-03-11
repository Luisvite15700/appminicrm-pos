
import { ThemedText } from '@/components/themed-text';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Paragraph, Searchbar, Title, useTheme, FAB, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';

// Original Venta interface
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

// Interface for the grouped structure
interface PedidoAgrupado {
  PEDIDO_ID: string;
  items: Venta[];
}

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

export default function TabVentasScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  // State now holds the grouped pedidos
  const [pedidos, setPedidos] = useState<PedidoAgrupado[]>([]);
  const [originalPedidos, setOriginalPedidos] = useState<PedidoAgrupado[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const groupSalesByPedidoId = (sales: Venta[]): PedidoAgrupado[] => {
    if (!sales || sales.length === 0) return [];

    const grouped = sales.reduce((acc, sale) => {
      const pedidoId = sale.PEDIDO_ID;
      if (!acc[pedidoId]) {
        acc[pedidoId] = { PEDIDO_ID: pedidoId, items: [] };
      }
      acc[pedidoId].items.push(sale);
      return acc;
    }, {} as Record<string, PedidoAgrupado>);

    // Sort pedidos by the date of the first item, newest first
    return Object.values(grouped).sort((a, b) => new Date(b.items[0].createdAt).getTime() - new Date(a.items[0].createdAt).getTime());
  };

  const fetchSalesAndGroup = async () => {
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_LISTA_VENTAS_WEBHOOK!);
      const data: Venta[] = await response.json();
      const groupedData = groupSalesByPedidoId(data);
      setPedidos(groupedData);
      setOriginalPedidos(groupedData);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  useEffect(() => {
    fetchSalesAndGroup();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSalesAndGroup();
    setRefreshing(false);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = originalPedidos.filter(pedido =>
      pedido.PEDIDO_ID.toLowerCase().includes(query.toLowerCase()) ||
      pedido.items.some(item => 
        item.PRODUCTO.toLowerCase().includes(query.toLowerCase()) ||
        item.CLIENTE_NOMBRE.toLowerCase().includes(query.toLowerCase())
      )
    );
    setPedidos(filtered);
  };

  // This function doesn't need to change, it operates on the filtered list
  const handleSort = (order: 'asc' | 'desc') => {
    const sorted = [...pedidos].sort((a, b) => {
        // Sort by date of the first item in each group
        const dateA = new Date(a.items[0].createdAt).getTime();
        const dateB = new Date(b.items[0].createdAt).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
    setPedidos(sorted);
  };

  const handleDateFilter = (period: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    let filtered: PedidoAgrupado[] = [];
    const filterDate = (saleDateStr: string) => {
        const saleDate = new Date(saleDateStr);
        if (period === 'day') return saleDate.toDateString() === now.toDateString();
        if (period === 'week') {
            const startOfWeek = getStartOfWeek(now);
            startOfWeek.setHours(0, 0, 0, 0);
            return saleDate >= startOfWeek;
        }
        if (period === 'month') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        if (period === 'year') return saleDate.getFullYear() === now.getFullYear();
        return false;
    };
    filtered = originalPedidos.filter(p => filterDate(p.items[0].createdAt));
    setPedidos(filtered);
  };
  
  // This function stays the same, it receives a single Venta item
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
    listContent: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 80 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: theme.colors.primary },
    productItemContainer: { paddingVertical: 8 },
    divider: { marginTop: 12, marginBottom: 4, height: 1 },
    mainCardTitle: { paddingBottom: 8 },
  });

  // This is the new render function for a grouped Pedido
  const renderPedidoAgrupado = ({ item }: { item: PedidoAgrupado }) => (
    <Card style={styles.card}>
        <Card.Content>
            <Title style={styles.mainCardTitle}>Pedido {item.PEDIDO_ID}</Title>
            {item.items.map((ventaItem, index) => (
                <View key={ventaItem.id} style={styles.productItemContainer}>
                    {/* This block is the original card content, restored */}
                    <Paragraph>{ventaItem.PRODUCTO}</Paragraph>
                    <Paragraph>Cliente: {ventaItem.CLIENTE_NOMBRE}</Paragraph>
                    <Paragraph>Total: S/{ventaItem.TOTAL}</Paragraph>
                    <Paragraph>Estado: {ventaItem.ESTADO}</Paragraph>
                    <Paragraph>Fecha: {new Date(ventaItem.createdAt).toLocaleDateString()}</Paragraph>
                    <Card.Actions style={{ paddingHorizontal: 0, paddingTop: 12 }}>
                        {/* The button is restored and works for each individual item */}
                        <Button onPress={() => handleViewDetails(ventaItem)}>Ver Detalle</Button>
                    </Card.Actions>
                    {/* Add a divider if it's not the last item in the card */}
                    {index < item.items.length - 1 && <Divider style={styles.divider} />}
                </View>
            ))}
        </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.PEDIDO_ID}
          renderItem={renderPedidoAgrupado} // Use the new render function
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
                <Button mode="contained" onPress={() => handleSort('desc')} style={styles.filterButton}>Más Recientes</Button>
                <Button mode="contained" onPress={() => handleSort('asc')} style={styles.filterButton}>Más Antiguos</Button>
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
