
import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Title, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function TabAboutScreen() {
    const theme = useTheme();

  const handleLinkPress = (url) => {
    Linking.openURL(url);
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    header: {
      paddingTop: 40,
    },
    card: {
      marginBottom: 24,
      backgroundColor: theme.colors.surface,
    },
    title: {
      marginBottom: 8,
      textAlign: 'center',
      color: theme.colors.primary,
    },
    paragraph: {
      textAlign: 'center',
      fontSize: 16,
    },
    button: {
      marginVertical: 4,
    },
    buttonLabel: {
      textTransform: 'none',
      fontSize: 16,
    },
    mainTitle: {
        marginBottom: 24,
        textAlign: 'center',
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
            <ThemedText
            type="title"
            style={styles.mainTitle}>
            Acerca de la Aplicación
            </ThemedText>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Desarrollado por</Title>
            <Paragraph style={styles.paragraph}>Brayan Developer Comunidad</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Contacto</Title>
            <Button 
              icon="email"
              mode="text" 
              onPress={() => handleLinkPress('mailto:b@brayan.es')} 
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              b@brayan.es
            </Button>
            <Button 
              icon="web"
              mode="text" 
              onPress={() => handleLinkPress('https://brayan.es')} 
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              brayan.es
            </Button>
            <Button 
              icon="phone"
              mode="text" 
              onPress={() => handleLinkPress('tel:+51975521788')} 
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              +51 975 521 788
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
