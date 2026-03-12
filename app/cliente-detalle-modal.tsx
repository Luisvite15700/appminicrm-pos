
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { TextInput, Button, Title, useTheme, HelperText } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ApiCliente {
  CLIENTE_NOMBRE: string;
  CLIENTE_EMAIL: string;
  CLIENTE_ID: string; // WhatsApp number
  PEDIDO_ID: string; // Unique client identifier
}

export default function ClienteDetalleModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { cliente: clienteString } = params;
  const theme = useTheme();
  
  const [originalCliente, setOriginalCliente] = useState<ApiCliente | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUrl = process.env.EXPO_PUBLIC_CLIENTE_ACTUALIZAR;

  useEffect(() => {
    if (clienteString && typeof clienteString === 'string') {
      try {
        const parsedCliente: ApiCliente = JSON.parse(clienteString);
        setOriginalCliente(parsedCliente);
        setNombre(parsedCliente.CLIENTE_NOMBRE || '');
        setEmail(parsedCliente.CLIENTE_EMAIL || '');
        setTelefono(parsedCliente.CLIENTE_ID || '');
      } catch (e) {
        setError("No se pudieron cargar los datos del cliente.");
      }
    }
  }, [clienteString]);

  const handleUpdate = async () => {
    if (!originalCliente) return;

    if (!updateUrl) {
        Alert.alert("Error de Configuración", "La URL para actualizar clientes no está definida.");
        return;
    }

    setIsUpdating(true);
    setError(null);
    try {
        const payload = {
            ...originalCliente, // Send original data
            CLIENTE_NOMBRE: nombre, // And new values
            CLIENTE_EMAIL: email,
            CLIENTE_ID: telefono,
        };

      const response = await fetch(updateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload) 
        });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Respuesta no válida del servidor.');
      }

      Alert.alert('Éxito', 'Cliente actualizado correctamente.', [
          { text: 'OK', onPress: () => router.back() }
      ]);

    } catch (e: any) {
        setError(`Error al actualizar: ${e.message}`);
    } finally {
        setIsUpdating(false);
    }
  };

  const hasChanges = 
    originalCliente?.CLIENTE_NOMBRE !== nombre ||
    originalCliente?.CLIENTE_EMAIL !== email ||
    originalCliente?.CLIENTE_ID !== telefono;

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 60 },
    input: { marginBottom: 12 },
    button: { marginTop: 8, paddingVertical: 6 },
    title: { marginBottom: 16, paddingTop: 16, color: theme.colors.primary, textAlign: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { marginTop: 16, textAlign: 'center' }
  });

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator animating={true} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
            <Stack.Screen options={{ title: `Editar Cliente` }} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Title style={styles.title}>Detalles del Cliente</Title>
                
                <TextInput label="Nombre" value={nombre} onChangeText={setNombre} style={styles.input} />
                <TextInput label="Correo" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address"/>
                <TextInput label="Teléfono (WhatsApp)" value={telefono} onChangeText={setTelefono} style={styles.input} keyboardType="phone-pad"/>

                {error && (
                    <HelperText type="error" visible={true} style={styles.errorText}>
                        {error}
                    </HelperText>
                )}

                {!updateUrl && (
                    <HelperText type="info" visible={true} style={styles.errorText}>
                        La URL de actualización no está configurada. El botón de guardar está desactivado.
                    </HelperText>
                )}

                <Button 
                    mode="contained"
                    onPress={handleUpdate}
                    style={styles.button}
                    loading={isUpdating}
                    disabled={!hasChanges || isUpdating || !updateUrl}
                    icon="update"
                >
                Actualizar Cliente
                </Button>
                
            </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
