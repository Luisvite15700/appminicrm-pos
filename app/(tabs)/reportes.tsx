
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, ScrollView, View, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, useTheme, SegmentedButtons, Text, Button } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartData } from 'react-native-chart-kit/dist/HelperTypes';

// --- INTERFACES --- //
interface Venta {
  id: number;
  TOTAL: string;
  createdAt: string;
  PRODUCTO: string;
  CANTIDAD: string | number;
}

const screenWidth = Dimensions.get('window').width;

// Use the official ChartData type and ensure datasets is correctly typed
const emptyChartData: ChartData = {
  labels: [],
  datasets: [], // Initialize with an empty array for datasets
};

export default function TabReportesScreen() {
  // --- STATE --- //
  const [originalSales, setOriginalSales] = useState<Venta[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  // Filter and processed data state
  const [timeFilter, setTimeFilter] = useState('month');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  // Use the official ChartData type for the state
  const [salesEvolutionData, setSalesEvolutionData] = useState<ChartData>(emptyChartData);
  const [topProductsData, setTopProductsData] = useState<ChartData>(emptyChartData);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const salesUrl = process.env.EXPO_PUBLIC_LISTA_VENTAS_WEBHOOK;
      const clientsUrl = process.env.EXPO_PUBLIC_CLIENT_LIST_API;

      if (!salesUrl || !clientsUrl) {
        throw new Error("Una o más URLs de API no están configuradas en el archivo .env");
      }

      const [salesRes, clientsRes] = await Promise.all([fetch(salesUrl), fetch(clientsUrl)]);

      if (!salesRes.ok || !clientsRes.ok) {
        throw new Error('Fallo al obtener los datos de ventas o clientes.');
      }

      const sales = await salesRes.json();
      const clients = await clientsRes.json();

      if (Array.isArray(sales)) setOriginalSales(sales);
      if (Array.isArray(clients)) setTotalClients(clients.length);

    } catch (error: any) {
      console.error("Error fetching report data:", error);
      setError(error.message || "Ocurrió un error desconocido.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Corrected: Fetch data only once on component mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- DATA PROCESSING (runs when filter or data changes) --- //
  useEffect(() => {
    if (originalSales.length === 0) {
      setTotalRevenue(0);
      setTotalSales(0);
      setTotalProducts(0);
      setSalesEvolutionData(emptyChartData);
      setTopProductsData(emptyChartData);
      return;
    }

    const now = new Date();
    const startDate = new Date();

    switch (timeFilter) {
      case 'day': startDate.setDate(now.getDate() - 1); break;
      case 'week': startDate.setDate(now.getDate() - 7); break;
      case 'fortnight': startDate.setDate(now.getDate() - 15); break;
      case 'month': default: startDate.setMonth(now.getMonth() - 1); break;
    }

    const filteredSales = originalSales.filter(sale => new Date(sale.createdAt) >= startDate);

    const revenue = filteredSales.reduce((acc, sale) => acc + parseFloat(sale.TOTAL || '0'), 0);
    setTotalRevenue(revenue);
    setTotalSales(filteredSales.length);

    const totalStock = filteredSales.reduce((acc, sale) => acc + Number(sale.CANTIDAD || 0), 0);
    setTotalProducts(totalStock);

    const salesByTime = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.createdAt);
      const key = timeFilter === 'day' ? date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString('default', { day: '2-digit', month: 'short' });
      acc[key] = (acc[key] || 0) + parseFloat(sale.TOTAL || '0');
      return acc;
    }, {} as { [key: string]: number });

    if (Object.keys(salesByTime).length > 0) {
      setSalesEvolutionData({ labels: Object.keys(salesByTime), datasets: [{ data: Object.values(salesByTime) }] });
    } else {
      setSalesEvolutionData(emptyChartData);
    }

    const productCounts = filteredSales.reduce((acc, sale) => {
      const name = (sale.PRODUCTO || 'N/A').substring(0, 15);
      const quantity = Number(sale.CANTIDAD || 0);
      if (quantity > 0) {
        acc[name] = (acc[name] || 0) + quantity;
      }
      return acc;
    }, {} as { [key: string]: number });

    const sortedProducts = Object.entries(productCounts).sort(([, a], [, b]) => b - a).slice(0, 7);

    if (sortedProducts.length > 0) {
      setTopProductsData({ labels: sortedProducts.map(([name]) => name), datasets: [{ data: sortedProducts.map(([, count]) => count) }] });
    } else {
      setTopProductsData(emptyChartData);
    }

  }, [timeFilter, originalSales]);

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
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    errorText: { textAlign: 'center', color: theme.colors.error, marginBottom: 16 }
  });

  if (error && !refreshing && originalSales.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <ThemedText type="title">Error</ThemedText>
          <Paragraph style={styles.errorText}>{error}</Paragraph>
          <Button mode="contained" onPress={fetchAllData}>Reintentar</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAllData} />}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Reportes</ThemedText>
        </View>

        <View style={styles.kpiContainer}>
          <Card style={styles.kpiCard}><Card.Content><Title>Ingresos</Title><Paragraph>S/{totalRevenue.toFixed(2)}</Paragraph></Card.Content></Card>
          <Card style={styles.kpiCard}><Card.Content><Title>Ventas</Title><Paragraph>{totalSales}</Paragraph></Card.Content></Card>
          <Card style={styles.kpiCard}><Card.Content><Title>Clientes</Title><Paragraph>{totalClients}</Paragraph></Card.Content></Card>
          <Card style={styles.kpiCard}><Card.Content><Title>Unidades Vendidas</Title><Paragraph>{totalProducts}</Paragraph></Card.Content></Card>
        </View>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Evolución de Ventas</Title>
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
            {salesEvolutionData.labels.length > 0 ? (
              <LineChart data={salesEvolutionData} width={screenWidth - 64} height={220} chartConfig={chartConfig} bezier style={styles.chart} />
            ) : <Paragraph>No hay datos de ventas para el período.</Paragraph>}
          </Card.Content>
        </Card>
        
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Productos Más Vendidos</Title>
            {topProductsData.labels.length > 0 ? (
              <BarChart data={topProductsData} width={screenWidth - 64} height={250} chartConfig={chartConfig} verticalLabelRotation={30} style={styles.chart} yAxisLabel="" yAxisSuffix="" />
            ) : <Paragraph>No hay productos vendidos en este período.</Paragraph>}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
