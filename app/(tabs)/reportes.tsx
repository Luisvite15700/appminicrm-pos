
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, ScrollView, View, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, useTheme, Button, SegmentedButtons } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- INTERFACES --- //
// ASSUMPTION: The Venta object contains a Detalles array with the products sold.
interface DetalleVenta {
  nombre: string;
  cantidad: number;
}
interface Venta {
  id: number;
  TOTAL: string;
  createdAt: string;
  Detalles: DetalleVenta[];
}
interface Cliente {
  id: number;
}

const screenWidth = Dimensions.get('window').width;

const emptyChartData = {
  labels: [],
  datasets: [{ data: [] }],
};

export default function TabReportesScreen() {
  // --- STATE --- //
  const [originalSales, setOriginalSales] = useState<Venta[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0); // This will remain as total stock for now
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  // Filter and processed data state
  const [timeFilter, setTimeFilter] = useState('month');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [salesEvolutionData, setSalesEvolutionData] = useState(emptyChartData);
  const [topProductsData, setTopProductsData] = useState(emptyChartData);

  // Chart configuration
  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: theme.colors.primary },
  };

  // --- DATA FETCHING --- //
  const fetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [salesRes, clientsRes, productsRes] = await Promise.all([
        fetch(process.env.EXPO_PUBLIC_LISTA_VENTAS_WEBHOOK!),
        fetch(process.env.EXPO_PUBLIC_CLIENT_LIST_API!),
        fetch(process.env.EXPO_PUBLIC_INVENTORY_LIST_API!),
      ]);

      const sales = await salesRes.json();
      const clients = await clientsRes.json();
      const products = await productsRes.json();

      if (Array.isArray(sales)) setOriginalSales(sales);
      if (Array.isArray(clients)) setTotalClients(clients.length);
      // The 'Total Stock' KPI still uses the products endpoint
      if (Array.isArray(products)) {
        const totalStock = products.reduce((acc, p) => acc + (p.cantidad || 0), 0);
        setTotalProducts(totalStock);
      }

    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);


  // --- DATA PROCESSING --- //
  useEffect(() => {
    if (originalSales.length === 0) return;

    const now = new Date();
    const startDate = new Date();

    switch (timeFilter) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'fortnight':
        startDate.setDate(now.getDate() - 15);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const filteredSales = originalSales.filter(sale => new Date(sale.createdAt) >= startDate);

    // --- Process KPIs ---
    const revenue = filteredSales.reduce((acc, sale) => acc + parseFloat(sale.TOTAL), 0);
    setTotalRevenue(revenue);
    setTotalSales(filteredSales.length);

    // --- Process Sales Evolution ---
    const salesByTime = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.createdAt);
      // Format label based on filter for clarity
      const key = timeFilter === 'day' ? date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('default', { day: '2-digit', month: 'short' });
      acc[key] = (acc[key] || 0) + parseFloat(sale.TOTAL);
      return acc;
    }, {} as { [key: string]: number });

    setSalesEvolutionData({
      labels: Object.keys(salesByTime),
      datasets: [{ data: Object.values(salesByTime) }],
    });

    // --- Process Top Selling Products ---
    const productCounts = filteredSales.reduce((acc, sale) => {
      // Ensure Detalles is an array before trying to reduce it
      if (Array.isArray(sale.Detalles)) {
        sale.Detalles.forEach(detalle => {
          const name = (detalle.nombre || 'N/A').substring(0, 15); // Truncate name
          acc[name] = (acc[name] || 0) + detalle.cantidad;
        });
      }
      return acc;
    }, {} as { [key: string]: number });

    const sortedProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7); // Show top 7 products

    if (sortedProducts.length > 0) {
        setTopProductsData({
            labels: sortedProducts.map(([name]) => name),
            datasets: [{ data: sortedProducts.map(([, count]) => count) }],
        });
    } else {
        setTopProductsData(emptyChartData);
    }

  }, [timeFilter, originalSales]);

  // --- STYLES --- //
  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { paddingHorizontal: 16, paddingBottom: 16 },
    header: { paddingTop: 40 },
    title: { marginBottom: 16, textAlign: 'center' },
    kpiContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    kpiCard: { width: '48%', marginBottom: 16, backgroundColor: theme.colors.surface },
    chartCard: { width: '100%', marginBottom: 16, backgroundColor: theme.colors.surface },
    chart: { marginVertical: 8, borderRadius: 16 },
    filterContainer: { marginVertical: 8, alignItems: 'center' },
  });

  // --- RENDER --- //
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllData} />}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Reportes</ThemedText>
        </View>

        {/* KPIs Section */}
        <View style={styles.kpiContainer}>
          <Card style={styles.kpiCard}><Card.Content><Title>Ingresos</Title><Paragraph>S/{totalRevenue.toFixed(2)}</Paragraph></Card.Content></Card>
          <Card style={styles.kpiCard}><Card.Content><Title>Ventas</Title><Paragraph>{totalSales}</Paragraph></Card.Content></Card>
          <Card style={styles.kpiCard}><Card.Content><Title>Clientes</Title><Paragraph>{totalClients}</Paragraph></Card.Content></Card>
          <Card style={styles.kpiCard}><Card.Content><Title>Stock Total</Title><Paragraph>{totalProducts}</Paragraph></Card.Content></Card>
        </View>

        {/* Sales Evolution Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Evolución de Ventas</Title>
            {salesEvolutionData.labels.length > 0 ? (
              <LineChart data={salesEvolutionData} width={screenWidth - 64} height={220} chartConfig={chartConfig} bezier style={styles.chart} />
            ) : <Paragraph>No hay datos de ventas para el período.</Paragraph>}
          </Card.Content>
        </Card>
        
        {/* Top Selling Products Chart */}
        <Card style={styles.chartCard}>
            <Card.Content>
                <Title>Productos Más Vendidos</Title>
                <View style={styles.filterContainer}>
                    <SegmentedButtons
                        value={timeFilter}
                        onValueChange={setTimeFilter}
                        buttons={[
                            { value: 'day', label: 'Día' },
                            { value: 'week', label: 'Semana' },
                            { value: 'fortnight', label: 'Quincena' },
                            { value: 'month', label: 'Mes' },
                        ]}
                    />
                </View>
                {topProductsData.labels.length > 0 ? (
                    <BarChart data={topProductsData} width={screenWidth - 64} height={250} chartConfig={chartConfig} verticalLabelRotation={30} style={styles.chart} />
                ) : <Paragraph>No hay productos vendidos en este período.</Paragraph>}
            </Card.Content>
        </Card>

        {/*
        // --- Stock de Productos (Oculto) ---
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Stock de Productos</Title>
            {inventoryData.labels.length > 0 ? (
              <BarChart
                data={inventoryData}
                width={screenWidth - 64}
                height={250}
                chartConfig={chartConfig}
                verticalLabelRotation={30}
                style={styles.chart}
              />
            ) : <Paragraph>No hay datos de inventario.</Paragraph>}
          </Card.Content>
        </Card>
        */}
      </ScrollView>
    </SafeAreaView>
  );
}
