
import React from 'react';
import { StyleSheet, View, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PdfViewerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { pdfUrl, title } = useLocalSearchParams<{ pdfUrl?: string; title?: string }>();

  // Construimos la URL para el visor de Google Docs
  const googleViewerUrl = pdfUrl ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}` : null;

  const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: theme.colors.surface 
    },
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
        <Appbar.Header>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title={title || 'Visualizador PDF'} titleStyle={{ fontSize: 18 }} />
        </Appbar.Header>
        <View style={styles.container}>
            {googleViewerUrl ? (
                <WebView
                    source={{ uri: googleViewerUrl }}
                    style={styles.webview}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                    )}
                    // For debugging WebView issues
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error: ', nativeEvent);
                    }}
                />
            ) : null}
        </View>
    </SafeAreaView>
  );
}
