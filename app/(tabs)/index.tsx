
import { ThemedText } from '@/components/themed-text';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Paragraph, Searchbar, Title, useTheme, FAB, Divider } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';

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
  DATOS_COMPROBANTE: string;
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

    return Object.values(grouped).sort((a, b) => new Date(b.items[0].createdAt).getTime() - new Date(a.items[0].createdAt).getTime());
  };

  const fetchSalesAndGroup = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_LISTA_VENTAS_WEBHOOK!);
      const data: Venta[] = await response.json();
      const groupedData = groupSalesByPedidoId(data);
      setOriginalPedidos(groupedData);
      setPedidos(groupedData);
      setSearchQuery('');
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // OPTIMIZATION: Fetch data only when the screen is focused for the first time
  useFocusEffect(
    useCallback(() => {
      if (originalPedidos.length === 0) {
        fetchSalesAndGroup();
      }
    }, [originalPedidos.length, fetchSalesAndGroup])
  );

  const onRefresh = useCallback(() => {
    fetchSalesAndGroup();
  }, [fetchSalesAndGroup]);

      const handleSearch = (query: string) => {
        setSearchQuery(query);
        const lowerCaseQuery = query.toLowerCase();
      
        const filtered = originalPedidos.filter(pedido => {
          // 1. Búsqueda por texto (como ya la tenías)
          const textMatch = (
            pedido.PEDIDO_ID.toLowerCase().includes(lowerCaseQuery) ||
            pedido.items.some(item => 
              item.PRODUCTO.toLowerCase().includes(lowerCaseQuery) ||
              item.CLIENTE_NOMBRE.toLowerCase().includes(lowerCaseQuery)
            )
          );
      
          // 2. Búsqueda por fecha (mejorada)
          let dateMatch = false;
          const dateParts = query.split('/');
          const itemDate = new Date(pedido.items[0].createdAt);
      
          // Caso A: El usuario escribe "dd/mm/yyyy"
          if (dateParts.length === 3) {
            const searchMonth = parseInt(dateParts[1], 10);
            const searchYear = parseInt(dateParts[2], 10);
      
            if (!isNaN(searchMonth) && !isNaN(searchYear)) {
              // Comparamos mes y año. OJO: getMonth() es base 0 (0-11)
              if (itemDate.getMonth() + 1 === searchMonth && itemDate.getFullYear() === searchYear) {
                dateMatch = true;
              }
            }
          } 
          // Caso B: El usuario escribe "dd/mm"
          else if (dateParts.length === 2) {
            const searchDay = parseInt(dateParts[0], 10);
            const searchMonth = parseInt(dateParts[1], 10);
            const currentYear = new Date().getFullYear(); // Obtenemos el año actual
      
            if (!isNaN(searchDay) && !isNaN(searchMonth)) {
              // Comparamos día, mes Y que el año sea el actual
              if (
                itemDate.getDate() === searchDay && 
                itemDate.getMonth() + 1 === searchMonth &&
                itemDate.getFullYear() === currentYear // <-- ¡Esta es la nueva condición!
              ) {
                dateMatch = true;
              }
            }
          }
              // Un pedido se muestra si coincide con el texto O con la fecha
          return textMatch || dateMatch;
        });      
        setPedidos(filtered);
      };

  const handleSort = (order: 'asc' | 'desc') => {
    const sorted = [...pedidos].sort((a, b) => {
        const dateA = new Date(a.items[0].createdAt).getTime();
        const dateB = new Date(b.items[0].createdAt).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
    setPedidos(sorted);
  };

  const handleDateFilter = (period: 'day' | 'week' | 'month' | 'year' | 'all') => {
    if (period === 'all') {
      setPedidos(originalPedidos);
      return;
    }

    const now = new Date();
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
    const filtered = originalPedidos.filter(p => filterDate(p.items[0].createdAt));
    setPedidos(filtered);
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
    dateFilterContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 16 },
    filterButton: { flex: 1, marginHorizontal: 4, minWidth: '45%' },
    dateButton: { flex: 1, marginHorizontal: 2, marginVertical: 4, minWidth: '20%' },
    title: { marginBottom: 16 },
    listContent: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 80 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: theme.colors.primary },
    productItemContainer: { paddingVertical: 8 },
    divider: { marginTop: 12, marginBottom: 4, height: 1 },
    mainCardTitle: { paddingBottom: 8 },
  });

  const renderPedidoAgrupado = ({ item }: { item: PedidoAgrupado }) => (
    <Card style={styles.card}>
        <Card.Content>
            <Title style={styles.mainCardTitle}>Pedido {item.PEDIDO_ID}</Title>
            {item.items.map((ventaItem, index) => (
                <View key={ventaItem.id} style={styles.productItemContainer}>
                    <Paragraph>{ventaItem.PRODUCTO}</Paragraph>
                    <Paragraph>Cliente: {ventaItem.CLIENTE_NOMBRE}</Paragraph>
                    <Paragraph>Total: S/{ventaItem.TOTAL}</Paragraph>
                    <Paragraph>Estado: {ventaItem.ESTADO}</Paragraph>
                    <Paragraph>Fecha: {new Date(ventaItem.createdAt).toLocaleDateString()}</Paragraph>
                    <Paragraph>N°Comprobante: {ventaItem.DATOS_COMPROBANTE}</Paragraph>
                    <Card.Actions style={{ paddingHorizontal: 0, paddingTop: 12 }}>
                        <Button onPress={() => handleViewDetails(ventaItem)}>Ver Detalle</Button>
                    </Card.Actions>
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
          renderItem={renderPedidoAgrupado}
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
