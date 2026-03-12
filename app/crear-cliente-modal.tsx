
import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, useTheme, Title, HelperText } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CrearClienteModal() {
    const theme = useTheme();
    const router = useRouter();

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const apiUrl = process.env.EXPO_PUBLIC_CLIENTE_CREAR;

    const handleCreateCliente = async () => {
        if (!nombre || !telefono) {
            Alert.alert('Campos Requeridos', 'El nombre y el teléfono son obligatorios.');
            return;
        }

        if (!apiUrl) {
            Alert.alert('Configuración Incompleta', 'La URL para crear clientes no está configurada. No se puede guardar.');
            return;
        }

        setIsSubmitting(true);

        const uniqueId = `CL-${Date.now()}`;

        // Adjust payload to match the API's expected format (NOMBRE, CORREO, etc.)
        const payload = {
            NOMBRE: nombre,
            CORREO: email || '',
            WHATSAPP: telefono, 
            PEDIDO_ID: uniqueId,
            ESTADO: 'ACTIVO',
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Error del Webhook: ${errorBody}`);
            }

            Alert.alert('Éxito', 'Cliente creado correctamente.');
            router.back();

        } catch (error: any) {
            Alert.alert('Error', `No se pudo crear el cliente: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const styles = StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.colors.background },
        container: { flex: 1 },
        content: { padding: 20, gap: 16 },
        title: { marginBottom: 16 },
        errorText: { marginTop: 16, textAlign: 'center' }
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Crear Nuevo Cliente' }} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Title style={styles.title}>Datos del Nuevo Cliente</Title>
                    
                    <TextInput
                        mode="outlined"
                        label="Nombre del Cliente"
                        value={nombre}
                        onChangeText={setNombre}
                    />

                    <TextInput
                        mode="outlined"
                        label="Correo Electrónico (Opcional)"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />

                    <TextInput
                        mode="outlined"
                        label="Número de WhatsApp"
                        value={telefono}
                        onChangeText={setTelefono}
                        keyboardType="phone-pad"
                    />

                    {!apiUrl && (
                        <HelperText type="error" visible={true} style={styles.errorText}>
                            Falta la URL del webhook de creación. El botón de guardar está desactivado.
                        </HelperText>
                    )}

                    <Button 
                        mode="contained" 
                        onPress={handleCreateCliente} 
                        style={{ marginTop: 24, paddingVertical: 8 }}
                        loading={isSubmitting}
                        disabled={isSubmitting || !apiUrl}
                        icon="content-save"
                    >
                        Guardar Cliente
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
