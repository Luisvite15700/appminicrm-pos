
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, SafeAreaView, Linking, Alert } from 'react-native';
import { Appbar, useTheme, ActivityIndicator as PaperActivityIndicator } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  downloadAsync as legacyDownloadAsync,
  cacheDirectory as legacyCacheDirectory,
  getInfoAsync,
} from 'expo-file-system/legacy';

export default function PdfViewerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { pdfUrl, title } = useLocalSearchParams<{ pdfUrl?: string; title?: string }>();

  // State for caching and actions
  const [isSharing, setIsSharing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);

  // Helper to get a clean filename
  const finalFileName = useMemo(() => {
    if (!title) return `documento-${Date.now()}.pdf`;
    return title.toLowerCase().endsWith('.pdf') ? title : `${title}.pdf`;
  }, [title]);

  // URL for the webview
  const googleViewerUrl = pdfUrl ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}` : null;

  // Effect to download the file for sharing/caching
  useEffect(() => {
    const prepareFileForActions = async () => {
      if (!pdfUrl) return;

      setIsPreparing(true);
      setLocalFileUri(null);

      try {
        const localUri = (legacyCacheDirectory || '') + finalFileName;
        const fileInfo = await getInfoAsync(localUri);

        if (fileInfo.exists) {
          console.log(`File ${finalFileName} found in cache. Using local version.`);
          setLocalFileUri(localUri);
        } else {
          console.log(`File ${finalFileName} not in cache. Downloading...`);
          const { uri: downloadedUri } = await legacyDownloadAsync(pdfUrl, localUri);
          setLocalFileUri(downloadedUri);
        }
      } catch (error) {
        console.error("Failed to prepare PDF for actions:", error);
        // We don't alert here, as the webview can still work.
        // Actions will just be disabled.
      } finally {
        setIsPreparing(false);
      }
    };

    prepareFileForActions();
  }, [pdfUrl, finalFileName]);

  // Action Handlers
  const handleShare = async () => {
    if (isSharing || !localFileUri) {
      Alert.alert(
        "Archivo no listo", 
        "El documento aún no está disponible para compartir. Por favor, espere un momento."
      );
      return;
    }

    try {
      setIsSharing(true);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "La función de compartir no está disponible en este dispositivo.");
        return;
      }
      await Sharing.shareAsync(localFileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Compartir ${finalFileName}`,
          UTI: 'com.adobe.pdf'
      });
    } catch (error: any) {
      if (error.message && !error.message.includes("cancelled")) {
          Alert.alert("Error", "Hubo un problema al intentar compartir el archivo.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleOpenInBrowser = async () => {
    if (!pdfUrl) return;
    const urlToOpen = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
    try {
        const supported = await Linking.canOpenURL(urlToOpen);
        if (supported) {
            await Linking.openURL(urlToOpen);
        } else {
            Alert.alert("Error", `No se puede abrir esta URL en el navegador.`);
        }
    } catch (error) {
        Alert.alert("Error", "No se pudo abrir el enlace en el navegador.");
    }
  };

  // Styles
  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.surface },
    container: { flex: 1 },
    webview: { flex: 1 },
    loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    appbarAction: { marginRight: 8 },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
        <Appbar.Header>
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content title={title || 'Visualizador PDF'} titleStyle={{ fontSize: 18 }} />
            {isPreparing ? (
                <PaperActivityIndicator color={theme.colors.onPrimary} style={styles.appbarAction} />
            ) : (
                <>
                    <Appbar.Action icon="share-variant" onPress={handleShare} disabled={isSharing || !localFileUri} />
                    <Appbar.Action icon="open-in-new" onPress={handleOpenInBrowser} disabled={!pdfUrl} />
                </>
            )}
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
                    onError={(syntheticEvent) => console.warn('WebView error: ', syntheticEvent.nativeEvent)}
                />
            ) : null}
        </View>
    </SafeAreaView>
  );
}
