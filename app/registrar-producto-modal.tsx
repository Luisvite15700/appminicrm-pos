
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
  const [categoria, setCategoria] = useState(''); // State for Categoria
  const router = useRouter();
  const theme = useTheme();

  const handleRegister = async () => {
    const productData = {
      nombre,
      foto,
      galeria,
      especificaciones,
      precio_regular: precioRegular,
      precio_descuento: precioDescuento,
      video,
      slug,
      cantidad: parseInt(cantidad, 10) || 0,
      categoria, // Include Categoria in the payload
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_REGISTER_PRODUCT_API!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        console.log('Product registered successfully!');
        router.back();
      } else {
        const errorText = await response.text();
        console.error('Error registering product:', response.status, errorText);
      }
    } catch (error) {
      console.error("Error registering product:", error);
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
            <TextInput label="Foto (URL)" value={foto} onChangeText={setFoto} style={styles.input} />
            <TextInput label="Galería (URLs separadas por comas)" value={galeria} onChangeText={setGaleria} style={styles.input} />
            <TextInput label="Especificaciones" value={especificaciones} onChangeText={setEspecificaciones} style={styles.input} multiline />
            <TextInput label="Video (URL)" value={video} onChangeText={setVideo} style={styles.input} />
            <TextInput label="Slug" value={slug} onChangeText={setSlug} style={styles.input} />
            <Button mode="contained" onPress={handleRegister} style={styles.button}>
              Registrar Producto
            </Button>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
