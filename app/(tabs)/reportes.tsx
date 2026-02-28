
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, ScrollView, View, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, useTheme } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

// Interfaces for the data structures
interface Venta {
  id: number;
  TOTAL: string;
  createdAt: string;
}

interface Cliente {
  id: number;
}

interface Producto {
  id: number;
  nombre: string;
  cantidad: number;
}

const screenWidth = Dimensions.get('window').width;

const emptyChartData = {
  labels: [],
  datasets: [{ data: [] }],
};

export default function TabReportesScreen() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [salesData, setSalesData] = useState(emptyChartData);
  const [inventoryData, setInventoryData] = useState(emptyChartData);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [salesRes, clientsRes, productsRes] = await Promise.all([
        fetch('https://n8n2.stg.brayan.es/webhook/2354354353-c918-4f13-86cc-LISTA_VENTAS_P0012'),
        fetch('https://n8n2.stg.brayan.es/webhook/97683232mk-c918-4f13-86cc-LISTA_CLIENTE_P0012'),
        fetch('https://n8n2.stg.brayan.es/webhook/97688bd0-c918-4f13-86cc-LISTA_PRODUCTOS_P0012'),
      ]);

      const sales: Venta[] = await salesRes.json();
      const clients: Cliente[] = await clientsRes.json();
      const products: Producto[] = await productsRes.json();

      // Calculate KPIs
      if (Array.isArray(sales)) {
        const revenue = sales.reduce((acc, sale) => acc + parseFloat(sale.TOTAL), 0);
        setTotalRevenue(revenue);
        setTotalSales(sales.length);

        const salesByMonth = sales.reduce((acc, sale) => {
            const month = new Date(sale.createdAt).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + parseFloat(sale.TOTAL);
            return acc;
        }, {} as { [key: string]: number });

        setSalesData({
            labels: Object.keys(salesByMonth),
            datasets: [{
                data: Object.values(salesByMonth),
            }],
        });
      }

      if (Array.isArray(clients)) {
        setTotalClients(clients.length);
      }

      if (Array.isArray(products)) {
        const totalStock = products.reduce((acc, product) => acc + product.cantidad, 0);
        setTotalProducts(totalStock);

        const productNames = products.map(p => (p.nombre || '').substring(0, 10));
        const productQuantities = products.map(p => p.cantidad);
        setInventoryData({
            labels: productNames,
            datasets: [{
                data: productQuantities,
            }],
        });
      }

    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    header: {
      paddingTop: 40,
    },
    title: {
      marginBottom: 16,
      textAlign: 'center',
    },
    kpiContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    kpiCard: {
      width: '48%',
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    chartCard: {
      width: '100%',
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Reportes</ThemedText>
        </View>

        <View style={styles.kpiContainer}>
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Title>Ingresos Totales</Title>
              <Paragraph>S/{totalRevenue.toFixed(2)}</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Title>Ventas Totales</Title>
              <Paragraph>{totalSales}</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Title>Clientes Totales</Title>
              <Paragraph>{totalClients}</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Title>Stock Total</Title>
              <Paragraph>{totalProducts}</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Evolución de Ventas (por Mes)</Title>
            {salesData.labels.length > 0 ? (
              <LineChart
                data={salesData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            ) : <Paragraph>No hay datos de ventas.</Paragraph>}
          </Card.Content>
        </Card>

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
      </ScrollView>
    </SafeAreaView>
  );
}
