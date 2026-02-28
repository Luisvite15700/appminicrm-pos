
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Title, useTheme } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function EditarClienteModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { client: clientString } = params;
  const theme = useTheme();

  interface Client {
    id: number;
    NOMBRE: string;
    CORREO: string | null;
    WHATSAPP: string | null;
    IDENTIFICADOR: string | null;
    ESTADO: string | null;
  }
  
  const [client, setClient] = useState<Client | null>(null);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [estado, setEstado] = useState('');

  useEffect(() => {
    if (clientString && typeof clientString === 'string') {
      const parsedClient = JSON.parse(clientString);
      setClient(parsedClient);
      setNombre(parsedClient.NOMBRE);
      setCorreo(parsedClient.CORREO || '');
      setWhatsapp(parsedClient.WHATSAPP || '');
      setIdentificador(parsedClient.IDENTIFICADOR || '');
      setEstado(parsedClient.ESTADO || '');
    }
  }, [clientString]);

  const handleUpdate = async () => {
    if (!client) return;

    const updatedClientData = {
      id: client.id,
      NOMBRE: nombre,
      CORREO: correo,
      WHATSAPP: whatsapp,
      IDENTIFICADOR: identificador,
      ESTADO: estado,
      updatedAt: new Date().toISOString(),
    };

    const endpoint = 'https://n8n2.stg.brayan.es/webhook/f71ddb3f-343e-4a4a-aa01-52a5e7d41d03_ACTUALIZAR_CLIENTE';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedClientData),
      });

      if (response.ok) {
        console.log('Client updated successfully!');
        router.replace({ pathname: `/cliente/${client.id}`, params: { updated: 'true' } });
      } else {
        const errorText = await response.text();
        console.error('Error updating client:', response.status, errorText);
      }
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    input: {
      marginBottom: 16,
    },
    button: {
      marginTop: 16,
    },
    title: {
        marginBottom: 16,
        paddingTop: 16,
    }
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
        <Stack.Screen 
            options={{ 
                title: 'Editar Cliente',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
            }}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} style={{backgroundColor: theme.colors.background}}>
            <Title style={styles.title}>Editar Cliente</Title>
            <TextInput label="Nombre" value={nombre} onChangeText={setNombre} style={styles.input} />
            <TextInput label="Correo" value={correo} onChangeText={setCorreo} style={styles.input} />
            <TextInput label="Whatsapp" value={whatsapp} onChangeText={setWhatsapp} style={styles.input} />
            <TextInput label="DNI/RUC" value={identificador} onChangeText={setIdentificador} style={styles.input} />
            <TextInput label="Estado" value={estado} onChangeText={setEstado} style={styles.input} />
            <Button mode="contained" onPress={handleUpdate} style={styles.button}>
              Actualizar Cliente
            </Button>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
