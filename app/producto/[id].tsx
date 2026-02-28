
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Image, Linking } from 'react-native';
import { Card, Title, Paragraph, Button, useTheme } from 'react-native-paper';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the type for a product based on the API response
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
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const router = useRouter();
  const theme = useTheme();

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_PRODUCT_DETAIL_API!}?id=${id}`);
      const data: Product[] = await response.json();
      if (data.length > 0) {
        setProduct(data[0]);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchProduct();
      }
    }, [id, fetchProduct])
  );

  const handleEdit = () => {
    if (product) {
      router.push({
        pathname: '/editar-producto-modal',
        params: { product: JSON.stringify(product) },
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
    galleryContainer: {
      marginTop: 16,
    },
    galleryImage: {
      width: 200,
      height: 200,
      marginRight: 8,
      borderRadius: 8,
    },
    specificationsContainer: {
        marginTop: 16,
    },
    title: {
        marginBottom: 15, 
        marginTop: 15
    }
  });

  if (!product) {
    return null; // Or a loading indicator
  }

  const galleryImages = product.galeria ? product.galeria.split(',') : [];

  return (
    <SafeAreaView style={styles.safeArea}>
        <ScrollView>
            {product && 
                <Stack.Screen 
                    options={{ 
                        title: product.nombre,
                        headerStyle: { backgroundColor: theme.colors.surface },
                        headerTintColor: theme.colors.onSurface,
                    }} 
                />
            }
            <View style={styles.container}>
                <Card>
                {product.foto && <Card.Cover source={{ uri: product.foto }} />}
                <Card.Content>
                    <Title>{product.nombre}</Title>
                    <Paragraph>Cantidad: {product.cantidad}</Paragraph>
                    <Paragraph>Precio: S/{product.precio_regular}</Paragraph>
                    {product.precio_descuento && <Paragraph>Descuento: S/{product.precio_descuento}</Paragraph>}
                </Card.Content>
                <Card.Actions>
                    <Button onPress={handleEdit}>Editar</Button>
                    {product.video && <Button onPress={() => Linking.openURL(product.video)}>Ver Video</Button>}
                </Card.Actions>
                </Card>

                {galleryImages.length > 0 && (
                    <View style={styles.galleryContainer}>
                        <Title style={styles.title}>Galería</Title>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {galleryImages.map((url, index) => (
                            <Image key={index} source={{ uri: url }} style={styles.galleryImage} />
                        ))}
                        </ScrollView>
                    </View>
                )}

                {product.especificaciones && (
                    <View style={styles.specificationsContainer}>
                    <Title style={styles.title}>Especificaciones</Title>
                    <Paragraph>{product.especificaciones}</Paragraph>
                    </View>
                )}
            </View>
        </ScrollView>
    </SafeAreaView>
  );
}
