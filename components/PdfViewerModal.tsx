
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert, Platform, Dimensions } from 'react-native';
import { Modal, Card, Title, Button, useTheme } from 'react-native-paper';
import Pdf from 'react-native-pdf';
import {
  readAsStringAsync,
  EncodingType,
  downloadAsync as legacyDownloadAsync,
  cacheDirectory as legacyCacheDirectory,
  deleteAsync,
  getInfoAsync,
  readDirectoryAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  pdfUrl: string | null;
  fileName?: string; // This is the base name, e.g., "20608097164-03-B001-00000052"
}

export default function PdfViewerModal({ visible, onDismiss, pdfUrl, fileName }: Props) {
  const theme = useTheme();
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);

  // This ensures the filename always ends with exactly one ".pdf"
  const finalFileName = useMemo(() => {
    if (!fileName) {
        return `vista-previa-${Date.now()}.pdf`;
    }
    // If fileName already has .pdf, use it. Otherwise, add it.
    return fileName.toLowerCase().endsWith('.pdf') 
        ? fileName 
        : `${fileName}.pdf`;
  }, [fileName]);


  useEffect(() => {
    const loadPdfForViewing = async () => {
      if (!pdfUrl) return;

      setIsLoading(true);
      setLocalFileUri(null);

      try {
        if (!fileName) {
          console.warn("No fileName provided for caching. PDF will be re-downloaded each time.");
        }
        const localUri = (legacyCacheDirectory || '') + finalFileName;

        const fileInfo = await getInfoAsync(localUri);
        let targetUri = '';

        if (fileInfo.exists) {
          console.log(`File ${finalFileName} found in cache. Using local version.`);
          targetUri = localUri;
        } else {
          console.log(`File ${finalFileName} not in cache. Downloading from ${pdfUrl}...`);
          const { uri: downloadedUri } = await legacyDownloadAsync(pdfUrl, localUri);
          targetUri = downloadedUri;
        }

        setLocalFileUri(targetUri);

      } catch (error) {
        console.error("Failed to load PDF:", error);
        Alert.alert("Error", "No se pudo cargar el documento.");
        if (fileName) {
            const localUri = (legacyCacheDirectory || '') + finalFileName;
            try {
                const fileInfo = await getInfoAsync(localUri);
                if(fileInfo.exists) await deleteAsync(localUri, { idempotent: true });
            } catch (cleanupError) {
                console.error("Failed to cleanup broken file:", cleanupError);
            }
        }
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
    }
  }, [pdfUrl, visible, fileName, finalFileName]);

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
      await Sharing.shareAsync(localFileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Compartir ${finalFileName}`,
          UTI: 'com.adobe.pdf'
      });
    } catch (error: any) {
      console.error('Error sharing PDF:', error);
      if (error.message && !error.message.includes("cancelled")) {
          Alert.alert("Error", "Hubo un problema al intentar compartir el archivo.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Limpiar Caché",
      "¿Está seguro de que desea borrar todos los comprobantes guardados? Esto liberará espacio, pero deberán descargarse de nuevo la próxima vez que los vea.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar Todo",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const cacheDir = legacyCacheDirectory || '';
              const files = await readDirectoryAsync(cacheDir);
              const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
              
              let deletedCount = 0;
              for (const file of pdfFiles) {
                await deleteAsync(cacheDir + file, { idempotent: true });
                deletedCount++;
              }

              console.log(`Cleared ${deletedCount} PDF files from cache.`);
              Alert.alert("Éxito", `Se han eliminado ${deletedCount} comprobantes guardados.`);
              
              onDismiss();
            } catch (error) {
              console.error("Failed to clear cache:", error);
              Alert.alert("Error", "No se pudo limpiar el caché de documentos.");
            } finally {
                setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    modal: { alignSelf: 'center', width: '90%', height: '85%' },
    card: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { flex: 1 },
    content: { flex: 1, margin: 16, borderWidth: 1, borderColor: theme.colors.outline, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    pdf: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
    loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)' }
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
          {localFileUri ? (
            <Pdf
                source={{ uri: localFileUri, cache: true }}
                trustAllCerts={Platform.OS === 'android'} // Required for Android viewing local files
                onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`Number of pages: ${numberOfPages}`);
                }}
                onError={(error) => {
                    console.log(error);
                    Alert.alert("Error", "No se pudo mostrar el PDF. El archivo podría estar dañado.");
                }}
                style={styles.pdf}
            />
          ) : !isLoading && (
             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Title>Sin documento</Title></View>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </View>

        <Card.Actions style={styles.actions}>
          <Button 
            onPress={handleClearCache}
            icon="delete-sweep-outline"
            compact
            mode="text"
            labelStyle={{fontSize: 12}}
            disabled={isLoading}
          >
            Limpiar
          </Button>
          <Button onPress={onDismiss} disabled={isLoading}>Cerrar</Button>
        </Card.Actions>
      </Card>
    </Modal>
  );
}
