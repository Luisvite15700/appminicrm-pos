
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, useTheme } from 'react-native-paper';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Client {
  id: number;
  NOMBRE: string;
  CORREO: string | null;
  WHATSAPP: string | null;
  IDENTIFICADOR: string | null;
  ESTADO: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ClientDetailScreen() {
  const { id, updated } = useLocalSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const theme = useTheme();
  const router = useRouter();

  const fetchClient = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_CLIENT_DETAIL_WEBHOOK}?id=${id}`);
      const data = await response.json();
      if (data.length > 0) {
        setClient(data[0]);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id, updated]);

  const handleEdit = () => {
    if (client) {
      router.push({
        pathname: '/editar-cliente-modal',
        params: { client: JSON.stringify(client) },
      });
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      padding: 16,
    },
    title: {
        marginBottom: 15, 
        marginTop: 15
    }
  });

  if (!client) {
    return null; // Or a loading indicator
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <ScrollView>
            {client && 
                <Stack.Screen 
                    options={{ 
                        title: client.NOMBRE,
                        headerStyle: { backgroundColor: theme.colors.surface },
                        headerTintColor: theme.colors.onSurface,
                    }} 
                />
            }
            <View style={styles.container}>
                <Card>
                  <Card.Content>
                      <Title>{client.NOMBRE}</Title>
                      <Paragraph>Correo: {client.CORREO || 'No especificado'}</Paragraph>
                      <Paragraph>Whatsapp: {client.WHATSAPP || 'No especificado'}</Paragraph>
                      <Paragraph>DNI/RUC: {client.IDENTIFICADOR || 'No especificado'}</Paragraph>
                      <Paragraph>Estado: {client.ESTADO || 'No especificado'}</Paragraph>
                  </Card.Content>
                  <Card.Actions>
                    <Button onPress={handleEdit}>Editar</Button>
                  </Card.Actions>
                </Card>
            </View>
        </ScrollView>
    </SafeAreaView>
  );
}
