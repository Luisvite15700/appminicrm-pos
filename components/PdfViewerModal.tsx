
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert, Platform } from 'react-native';
import { Modal, Card, Title, Button, useTheme } from 'react-native-paper';
import { WebView } from 'react-native-webview';
// FINAL, FINAL FIX: Consolidate all filesystem imports into the legacy module.
import {
  readAsStringAsync,
  EncodingType,
  downloadAsync as legacyDownloadAsync,
  cacheDirectory as legacyCacheDirectory
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  pdfUrl: string | null;
}

export default function PdfViewerModal({ visible, onDismiss, pdfUrl }: Props) {
  const theme = useTheme();
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);
  const [webViewSource, setWebViewSource] = useState<{ uri: string } | null>(null);

  useEffect(() => {
    const loadPdfForViewing = async () => {
      if (!pdfUrl) return;

      setIsLoading(true);
      setLocalFileUri(null);
      setWebViewSource(null);

      try {
        const fileName = `vista-previa-${Date.now()}.pdf`;
        const localUri = legacyCacheDirectory + fileName;
        const { uri: downloadedUri } = await legacyDownloadAsync(pdfUrl, localUri);

        setLocalFileUri(downloadedUri);

        if (Platform.OS === 'android') {
          // Now `readAsStringAsync` and `EncodingType` come from the same legacy module.
          const base64 = await readAsStringAsync(downloadedUri, {
            encoding: EncodingType.Base64,
          });
          setWebViewSource({ uri: `data:application/pdf;base64,${base64}` });
        } else {
          setWebViewSource({ uri: downloadedUri });
        }

      } catch (error) {
        console.error("Failed to load PDF for preview:", error);
        Alert.alert("Error", "No se pudo cargar la vista previa del documento.");
        onDismiss();
      } finally {
        setIsLoading(false);
      }
    };

    if (visible) {
      loadPdfForViewing();
    } else {
      setIsLoading(false);
      setLocalFileUri(null);
      setWebViewSource(null);
    }
  }, [pdfUrl, visible]);

  const handleShare = async () => {
    if (isSharing) return;
    if (!localFileUri) {
      Alert.alert("Por favor, espere", "El documento aún no está listo para ser compartido.");
      return;
    }

    try {
      setIsSharing(true);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "La función de compartir no está disponible en este dispositivo.");
        return;
      }
      await Sharing.shareAsync(localFileUri);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      if (!error.message.includes("Another share request")) {
        Alert.alert("Error", "Hubo un error al intentar compartir el archivo.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const styles = StyleSheet.create({
    modal: { alignSelf: 'center', width: '90%', height: '80%' },
    card: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { flex: 1 },
    content: { flex: 1, margin: 16, borderWidth: 1, borderColor: theme.colors.outline },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, paddingTop: 0 },
    loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' }
  });

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Title style={styles.title} numberOfLines={1}>Vista Previa</Title>
          <Button icon="share-variant" onPress={handleShare} disabled={isSharing || isLoading}>
            Compartir
          </Button>
        </View>
        
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : webViewSource && (
            <WebView
              originWhitelist={['*']}
              source={webViewSource}
              style={{ flex: 1 }}
              allowFileAccess
            />
          )}
        </View>

        <Card.Actions style={styles.actions}>
          <Button onPress={onDismiss}>Cerrar</Button>
        </Card.Actions>
      </Card>
    </Modal>
  );
}
