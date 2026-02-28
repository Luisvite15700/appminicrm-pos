
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Title, useTheme } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function EditarProductoModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { product: productString } = params;
  const theme = useTheme();

  // Define the type for a product
  interface Product {
    id: number;
    nombre: string;
    foto: string | null;
    galeria: string;
    especificaciones: string | null;
    precio_regular: string;
    precio_descuento: string;
    video: string | null;
    slug: string;
    cantidad: number;
  }
  
  const [product, setProduct] = useState<Product | null>(null);
  const [nombre, setNombre] = useState('');
  const [foto, setFoto] = useState('');
  const [galeria, setGaleria] = useState('');
  const [especificaciones, setEspecificaciones] = useState('');
  const [precioRegular, setPrecioRegular] = useState('');
  const [precioDescuento, setPrecioDescuento] = useState('');
  const [video, setVideo] = useState('');
  const [slug, setSlug] = useState('');
  const [cantidad, setCantidad] = useState('');

  useEffect(() => {
    if (productString && typeof productString === 'string') {
      const parsedProduct = JSON.parse(productString);
      setProduct(parsedProduct);
      setNombre(parsedProduct.nombre);
      setFoto(parsedProduct.foto || '');
      setGaleria(parsedProduct.galeria || '');
      setEspecificaciones(parsedProduct.especificaciones || '');
      setPrecioRegular(parsedProduct.precio_regular || '');
      setPrecioDescuento(parsedProduct.precio_descuento || '');
      setVideo(parsedProduct.video || '');
      setSlug(parsedProduct.slug || '');
      setCantidad(parsedProduct.cantidad?.toString() || '');
    }
  }, [productString]);

  const handleUpdate = async () => {
    if (!product) return;

    const updatedProductData = {
      id: product.id, // The user stated the ID is required in the body
      nombre,
      foto,
      galeria,
      especificaciones,
      precio_regular: precioRegular,
      precio_descuento: precioDescuento,
      video,
      slug,
      cantidad: parseInt(cantidad, 10),
      updatedAt: new Date().toISOString(),
    };

    const endpoint = process.env.EXPO_PUBLIC_UPDATE_PRODUCT_API!;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST', // Using POST as requested
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProductData),
      });

      if (response.ok) {
        console.log('Product updated successfully!');
        // TODO: We should refresh the data on the previous screen
        router.back();
      } else {
        const errorText = await response.text();
        console.error('Error updating product:', response.status, errorText);
      }
    } catch (error) {
      console.error("Error updating product:", error);
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
                title: 'Editar Producto',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
            }}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} style={{backgroundColor: theme.colors.background}}>
            <Title style={styles.title}>Editar Producto</Title>
            <TextInput label="Nombre" value={nombre} onChangeText={setNombre} style={styles.input} />
            <TextInput label="Foto (URL)" value={foto} onChangeText={setFoto} style={styles.input} />
            <TextInput label="Galería (URLs separadas por comas)" value={galeria} onChangeText={setGaleria} style={styles.input} />
            <TextInput label="Especificaciones" value={especificaciones} onChangeText={setEspecificaciones} style={styles.input} multiline />
            <TextInput label="Precio Regular" value={precioRegular} onChangeText={setPrecioRegular} style={styles.input} keyboardType="numeric" />
            <TextInput label="Precio Descuento" value={precioDescuento} onChangeText={setPrecioDescuento} style={styles.input} keyboardType="numeric" />
            <TextInput label="Video (URL)" value={video} onChangeText={setVideo} style={styles.input} />
            <TextInput label="Slug" value={slug} onChangeText={setSlug} style={styles.input} />
            <TextInput label="Cantidad" value={cantidad} onChangeText={setCantidad} style={styles.input} keyboardType="numeric" />
            <Button mode="contained" onPress={handleUpdate} style={styles.button}>
              Actualizar Producto
            </Button>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
