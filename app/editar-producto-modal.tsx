
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Title, useTheme } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function EditarProductoModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { product: productString } = params;
  const theme = useTheme();

  interface Product {
    id: number;
    nombre: string;
    foto: string | null;
    galeria: string;
    especificaciones: string | null;
    precio_regular: number; // Expect number from API
    precio_descuento: number; // Expect number from API
    video: string | null;
    slug: string;
    cantidad: number;
    categoria: string;
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
  const [categoria, setCategoria] = useState('');

  useEffect(() => {
    if (productString && typeof productString === 'string') {
      try {
        const parsedProduct: Product = JSON.parse(productString);
        setProduct(parsedProduct);
        setNombre(parsedProduct.nombre || '');
        setFoto(parsedProduct.foto || '');
        setGaleria(parsedProduct.galeria || '');
        setEspecificaciones(parsedProduct.especificaciones || '');
        setVideo(parsedProduct.video || '');
        setSlug(parsedProduct.slug || '');
        setCategoria(parsedProduct.categoria || '');
        
        setCantidad(parsedProduct.cantidad != null ? parsedProduct.cantidad.toString() : '');
        setPrecioRegular(parsedProduct.precio_regular != null ? parsedProduct.precio_regular.toString() : '');
        setPrecioDescuento(parsedProduct.precio_descuento != null ? parsedProduct.precio_descuento.toString() : '');

      } catch (error) {
        Alert.alert("Error", "Hubo un problema al cargar los datos del producto.");
      }
    }
  }, [productString]);

  const handleUpdate = async () => {
    if (!product) return;

    const updatedProductData = {
      id: product.id, 
      nombre,
      foto,
      galeria,
      especificaciones,
      precio_regular: precioRegular ? parseFloat(precioRegular) : null,
      precio_descuento: precioDescuento ? parseFloat(precioDescuento) : null,
      video,
      slug,
      cantidad: parseInt(cantidad, 10) || 0,
      categoria,
      updatedAt: new Date().toISOString(),
    };

    const endpoint = process.env.EXPO_PUBLIC_UPDATE_PRODUCT_API!;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProductData),
      });

      if (response.ok) {
        console.log('Product updated successfully!');
        Alert.alert("Éxito", "El producto ha sido actualizado.");
        router.back();
      } else {
        const errorText = await response.text();
        Alert.alert("Error de Actualización", `No se pudo actualizar: ${errorText}`);
        console.error('Error updating product:', response.status, errorText);
      }
    } catch (error: any) {
      Alert.alert("Error de Conexión", `No se pudo conectar con el servidor: ${error.message}`);
      console.error("Error updating product:", error);
    }
  };
  
  const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    input: { marginBottom: 16 },
    button: { marginTop: 16, paddingVertical: 8 },
    // --- FIX: Reduced paddingTop to decrease top space --- //
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
                title: 'Editar Producto',
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.onSurface,
            }}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} style={{backgroundColor: theme.colors.background}}>
            <Title style={styles.title}>Editar Detalles del Producto</Title>
            <TextInput label="Nombre" value={nombre} onChangeText={setNombre} style={styles.input} />
            <TextInput label="Categoría" value={categoria} onChangeText={setCategoria} style={styles.input} />
            <TextInput label="Cantidad" value={cantidad} onChangeText={setCantidad} style={styles.input} keyboardType="numeric" />
            <TextInput label="Precio Regular" value={precioRegular} onChangeText={setPrecioRegular} style={styles.input} keyboardType="numeric" />
            <TextInput label="Precio Descuento" value={precioDescuento} onChangeText={setPrecioDescuento} style={styles.input} keyboardType="numeric" />
            <TextInput label="Foto (URL)" value={foto} onChangeText={setFoto} style={styles.input} multiline numberOfLines={2} />
            <TextInput label="Galería (JSON o separado por comas)" value={galeria} onChangeText={setGaleria} style={styles.input} multiline numberOfLines={3} />
            <TextInput label="Especificaciones" value={especificaciones} onChangeText={setEspecificaciones} style={styles.input} multiline />
            <TextInput label="Video (URL)" value={video} onChangeText={setVideo} style={styles.input} multiline numberOfLines={2} />
            <TextInput label="Slug" value={slug} onChangeText={setSlug} style={styles.input} />
            <Button mode="contained" onPress={handleUpdate} style={styles.button}>
              Actualizar Producto
            </Button>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
