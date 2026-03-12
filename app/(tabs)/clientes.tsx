
import React, { useState, useCallback } from 'react';
import { StyleSheet, FlatList, View, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Searchbar, Button, useTheme } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

interface Client {
  id: number;
  NOMBRE: string;
  CORREO: string;
  WHATSAPP: string;
  IDENTIFICADOR: string;
  ESTADO: string;
  createdAt: string;
  updatedAt: string;
}

export default function TabClientesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [originalClients, setOriginalClients] = useState<Client[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const fetchClients = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_CLIENT_LIST_API!);
      const data: Client[] = await response.json();
      setOriginalClients(data);
      setClients(data);
      setSearchQuery(''); // Reset search on refresh
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // OPTIMIZATION: Fetch data only when the screen is focused
  useFocusEffect(
    useCallback(() => {
      // Only fetch if we don't have clients yet.
      if (originalClients.length === 0) {
        fetchClients();
      }
    }, [originalClients.length, fetchClients])
  );

  const onRefresh = useCallback(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query === '') {
      setClients(originalClients);
    } else {
      const filtered = originalClients.filter(client =>
        client.NOMBRE.toLowerCase().includes(query.toLowerCase())
      );
      setClients(filtered);
    }
  };

  const handleSort = (order: 'asc' | 'desc') => {
    const sorted = [...clients].sort((a, b) => {
      return order === 'asc' ? a.NOMBRE.localeCompare(b.NOMBRE) : b.NOMBRE.localeCompare(a.NOMBRE);
    });
    setClients(sorted);
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    listContent: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16 },
    card: { marginBottom: 16, backgroundColor: theme.colors.surface },
    searchbar: { marginBottom: 16, backgroundColor: theme.colors.surface },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    filterButton: { flex: 1, marginHorizontal: 4 },
    title: { marginBottom: 16 },
  });

  const renderClient = ({ item }: { item: Client }) => (
    <Card style={styles.card} onPress={() => router.push(`/cliente/${item.id}`)}>
      <Card.Content>
        <Title>{item.NOMBRE}</Title>
        <Paragraph>{item.CORREO}</Paragraph>
        <Paragraph>{item.WHATSAPP}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderClient}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <View>
                <ThemedText type="title" style={styles.title}>Clientes</ThemedText>
                <Searchbar
                  placeholder="Buscar cliente"
                  onChangeText={handleSearch}
                  value={searchQuery}
                  style={styles.searchbar}
                />
                <View style={styles.filterContainer}>
                  <Button mode="contained" onPress={() => handleSort('asc')} style={styles.filterButton}>A-Z</Button>
                  <Button mode="contained" onPress={() => handleSort('desc')} style={styles.filterButton}>Z-A</Button>
                </View>
            </View>
          }
        />
    </SafeAreaView>
  );
}
