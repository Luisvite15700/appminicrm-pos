
import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { DataTable, Searchbar, useTheme, Title, FAB, Text, HelperText, TouchableRipple } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- INTERFACES --- //
interface Cliente {
  id: string; // Using PEDIDO_ID as the unique key
  nombre: string;
  email: string;
  telefono: string;
  rawData: ApiCliente; // Store the original raw data
}

interface ApiCliente {
    CLIENTE_NOMBRE: string;
    CLIENTE_EMAIL: string;
    CLIENTE_ID: string; // This is the WhatsApp number
    PEDIDO_ID: string; // This is the unique client identifier
}

const ITEMS_PER_PAGE = 15;

// --- SCREEN COMPONENT --- //
export default function ClientesScreen() {
  const theme = useTheme();
  const router = useRouter();

  // --- STATE MANAGEMENT --- //
  const [searchQuery, setSearchQuery] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [originalClientes, setOriginalClientes] = useState<Cliente[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING --- //
  const fetchClientes = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    const apiUrl = process.env.EXPO_PUBLIC_CLIENT_LIST_API;

    if (!apiUrl) {
        setError('La URL para cargar clientes no está configurada.');
        setRefreshing(false);
        setClientes([]);
        setOriginalClientes([]);
        return;
    }

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`El servidor respondió con un error: ${response.status}`);
      }
      const apiResponse: ApiCliente[] = await response.json();

      const formattedClientes = Array.isArray(apiResponse) ? apiResponse.map(item => ({
        id: item.PEDIDO_ID, // Use PEDIDO_ID as the unique id
        nombre: item.CLIENTE_NOMBRE,
        email: item.CLIENTE_EMAIL || 'N/A',
        telefono: item.CLIENTE_ID, // WhatsApp number
        rawData: item, // Keep original data for navigation
      })) : [];

      setOriginalClientes(formattedClientes);
      setClientes(formattedClientes);
      setSearchQuery('');
      setPage(0);

    } catch (e: any) {
      console.error("Error fetching clientes:", e);
      setError(`No se pudieron cargar los clientes: ${e.message}`);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Fetch data only once when the component mounts
  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Manual refresh function
  const onRefresh = useCallback(() => {
    fetchClientes();
  }, [fetchClientes]);

  // --- SEARCH LOGIC --- //
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(0);
    if (query === '') {
      setClientes(originalClientes);
    } else {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = originalClientes.filter(c => 
        c.nombre.toLowerCase().includes(lowerCaseQuery) ||
        c.email.toLowerCase().includes(lowerCaseQuery) ||
        c.telefono.toLowerCase().includes(lowerCaseQuery)
      );
      setClientes(filtered);
    }
  };

  // --- PAGINATION --- //
  const from = page * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE;
  const paginatedClientes = clientes.slice(from, to);
  const totalPages = Math.ceil(clientes.length / ITEMS_PER_PAGE);

  // --- NAVIGATION --- //
  const handleNavigateToCreate = () => {
    router.push('/crear-cliente-modal');
  };

  const handleRowPress = (cliente: Cliente) => {
    router.push({
        pathname: '/cliente-detalle-modal',
        params: { cliente: JSON.stringify(cliente.rawData) },
    });
  };

  // --- STYLES --- //
  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingTop: 16 },
    title: { marginBottom: 8 },
    searchbar: { marginBottom: 16 },
    tableHeader: { backgroundColor: theme.colors.surface },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    errorText: {
        margin: 16,
        textAlign: 'center'
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: theme.colors.onSurfaceVariant
    }
  });

  // --- MAIN RENDER --- //
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Title style={styles.title}>Gestionar Clientes</Title>
          <Searchbar
            placeholder="Buscar por nombre, correo o WhatsApp..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

        {error && (
            <HelperText type="error" visible={true} style={styles.errorText}>
                {error}
            </HelperText>
        )}

        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title>Nombre</DataTable.Title>
              <DataTable.Title>Correo</DataTable.Title>
              <DataTable.Title numeric>WhatsApp</DataTable.Title>
            </DataTable.Header>

            {paginatedClientes.length > 0 ? (
              paginatedClientes.map((cliente, index) => (
                <TouchableRipple key={`${cliente.id}-${index}`} onPress={() => handleRowPress(cliente)}>
                    <DataTable.Row>
                        <DataTable.Cell>{cliente.nombre}</DataTable.Cell>
                        <DataTable.Cell>{cliente.email}</DataTable.Cell>
                        <DataTable.Cell numeric>{cliente.telefono}</DataTable.Cell>
                    </DataTable.Row>
                </TouchableRipple>
              ))
            ) : (
                !refreshing && !error && <Text style={styles.emptyText}>No se encontraron clientes.</Text>
            )}

            {totalPages > 1 && (
                <DataTable.Pagination
                page={page}
                numberOfPages={totalPages}
                onPageChange={(p) => setPage(p)}
                label={`${from + 1}-${Math.min(to, clientes.length)} de ${clientes.length}`}
                />
            )}
          </DataTable>
        </ScrollView>

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleNavigateToCreate}
          color={theme.colors.onPrimary}
        />
      </View>
    </SafeAreaView>
  );
}
