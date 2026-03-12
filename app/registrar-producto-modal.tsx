
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Title, useTheme } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';

export default function RegistrarProductoModal() {
  const [nombre, setNombre] = useState('');
  const [foto, setFoto] = useState('');
  const [galeria, setGaleria] = useState('');
  const [especificaciones, setEspecificaciones] = useState('');
  const [precioRegular, setPrecioRegular] = useState('');
  const [precioDescuento, setPrecioDescuento] = useState('');
  const [video, setVideo] = useState('');
  const [slug, setSlug] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [categoria, setCategoria] = useState('');
  const router = useRouter();
  const theme = useTheme();

  const handleRegister = async () => {
    // Basic validation
    if (!nombre || !categoria || !cantidad || !precioRegular) {
      Alert.alert("Campos Requeridos", "Por favor, completa Nombre, Categoría, Cantidad y Precio Regular.");
      return;
    }

    const productData = {
      nombre,
      foto,
      galeria,
      especificaciones,
      // --- FIX: Convert prices to numbers before sending ---
      precio_regular: parseFloat(precioRegular),
      precio_descuento: precioDescuento ? parseFloat(precioDescuento) : null,
      video,
      slug,
      cantidad: parseInt(cantidad, 10) || 0,
      categoria,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const endpoint = process.env.EXPO_PUBLIC_REGISTER_PRODUCT_API!;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        // --- FIX: Added success alert ---
        Alert.alert("Éxito", "¡Producto registrado correctamente!");
        router.back();
      } else {
        const errorText = await response.text();
        // --- FIX: Added error alert ---
        Alert.alert("Error de Registro", `No se pudo registrar el producto: ${errorText}`);
        console.error('Error registering product:', response.status, errorText);
      }
    } catch (error: any) {
      // --- FIX: Added connection error alert ---
      Alert.alert("Error de Conexión", `No se pudo conectar con el servidor: ${error.message}`);
      console.error("Error registering product:", error);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    input: { marginBottom: 16 },
    button: { marginTop: 16, paddingVertical: 8 },
    // --- FIX: Reduced paddingTop and centered title ---
    title: { marginBottom: 16, paddingTop: 4, textAlign: 'center' }
  });

  return (
    <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
        <Stack.Screen 
            options={{ 
                title: 'Registrar Producto',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
            }}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} style={{backgroundColor: theme.colors.background}}>
            <Title style={styles.title}>Registrar Nuevo Producto</Title>
            <TextInput label="Nombre" value={nombre} onChangeText={setNombre} style={styles.input} />
            <TextInput label="Categoría" value={categoria} onChangeText={setCategoria} style={styles.input} />
            <TextInput label="Cantidad" value={cantidad} onChangeText={setCantidad} style={styles.input} keyboardType="numeric" />
            <TextInput label="Precio Regular" value={precioRegular} onChangeText={setPrecioRegular} style={styles.input} keyboardType="numeric" />
            <TextInput label="Precio Descuento" value={precioDescuento} onChangeText={setPrecioDescuento} style={styles.input} keyboardType="numeric" />
            
            {/* --- FIX: Multiline inputs for long text/URLs --- */}
            <TextInput label="Foto (URL)" value={foto} onChangeText={setFoto} style={styles.input} multiline numberOfLines={2} />
            <TextInput label="Galería (URLs separadas por comas)" value={galeria} onChangeText={setGaleria} style={styles.input} multiline numberOfLines={3} />
            
            {/* --- FIX: Multiline for specifications, respects line breaks --- */}
            <TextInput label="Especificaciones" value={especificaciones} onChangeText={setEspecificaciones} style={styles.input} multiline />
            <TextInput label="Video (URL)" value={video} onChangeText={setVideo} style={styles.input} multiline numberOfLines={2} />
            
            <TextInput label="Slug" value={slug} onChangeText={setSlug} style={styles.input} />
            <Button mode="contained" onPress={handleRegister} style={styles.button}>
              Registrar Producto
            </Button>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
