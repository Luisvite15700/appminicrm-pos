
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { Modal, Card, Title, Button, useTheme, Text } from 'react-native-paper';
import {
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
  fileName?: string; 
}

export default function PdfViewerModal({ visible, onDismiss, pdfUrl, fileName }: Props) {
  const theme = useTheme();
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);

  const finalFileName = useMemo(() => {
    if (!fileName) {
        return `vista-previa-${Date.now()}.pdf`;
    }
    return fileName.toLowerCase().endsWith('.pdf') 
        ? fileName 
        : `${fileName}.pdf`;
  }, [fileName]);


  useEffect(() => {
    // This effect now only downloads the file for sharing, it doesn't trigger a view
    const prepareFileForSharing = async () => {
      if (!pdfUrl) return;

      setIsLoading(true);
      setLocalFileUri(null);

      try {
        if (!fileName) {
          console.warn("No fileName provided for caching. PDF will be re-downloaded each time.");
        }
        const localUri = (legacyCacheDirectory || '') + finalFileName;

        const fileInfo = await getInfoAsync(localUri);

        if (fileInfo.exists) {
          console.log(`File ${finalFileName} found in cache. Using local version for sharing.`);
          setLocalFileUri(localUri);
        } else {
          console.log(`File ${finalFileName} not in cache. Downloading for sharing...`);
          const { uri: downloadedUri } = await legacyDownloadAsync(pdfUrl, localUri);
          setLocalFileUri(downloadedUri);
        }

      } catch (error) {
        console.error("Failed to prepare PDF for sharing:", error);
        // We don't alert here because the main action (browser) can still work.
        // We can show a specific alert if the user tries to share.
      } finally {
        setIsLoading(false);
      }
    };

    if (visible) {
      prepareFileForSharing();
    } else {
      // Cleanup when modal is closed
      setIsLoading(false);
      setLocalFileUri(null);
    }
  }, [pdfUrl, visible, fileName, finalFileName]);

  const handleShare = async () => {
    if (isSharing) return;
    
    // If the file is still downloading or failed, localFileUri will be null
    if (!localFileUri) {
      Alert.alert(
        "Archivo no listo", 
        "El documento no está listo para compartir. Por favor, espere a que termine la carga o revise su conexión."
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
      console.error('Error sharing PDF:', error);
      if (error.message && !error.message.includes("cancelled")) {
          Alert.alert("Error", "Hubo un problema al intentar compartir el archivo.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleOpenInBrowser = async () => {
    if (!pdfUrl) {
      Alert.alert("Error", "No hay una URL de PDF para abrir.");
      return;
    }
    try {
        const supported = await Linking.canOpenURL(pdfUrl);
        if (supported) {
            await Linking.openURL(pdfUrl);
        } else {
            Alert.alert("Error", `No se puede abrir esta URL: ${pdfUrl}`);
        }
    } catch (error) {
        console.error("Error opening URL in browser:", error);
        Alert.alert("Error", "No se pudo abrir el enlace en el navegador.");
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
    modal: { alignSelf: 'center', width: '90%', height: 'auto' }, // Auto height
    card: { flexGrow: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    title: { flex: 1, marginRight: 12 },
    content: { 
        flexGrow: 1, 
        padding: 16,
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 100, // Give it some space
    },
    actions: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 8,
        flexWrap: 'wrap', // Allow buttons to wrap on smaller screens
    },
    leftActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    rightActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingTop: 8 }, // Add padding top for wrapped state
    loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)' }
  });

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Title style={styles.title} numberOfLines={2}>Acciones para el documento</Title>
        </View>
        
        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <Text variant="bodyMedium" style={{textAlign: 'center'}}>
                La previsualización ya no está disponible. Utilice los botones para abrir, compartir o gestionar el documento.
            </Text>
          )}
        </View>

        <Card.Actions style={styles.actions}>
            <View style={styles.leftActions}>
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
            </View>
            <View style={styles.rightActions}>
                 <Button 
                    icon="open-in-new" 
                    onPress={handleOpenInBrowser} 
                    disabled={!pdfUrl || isLoading}
                    mode="outlined"
                    style={{marginRight: 8}}
                >
                    Navegador
                </Button>
                 <Button 
                    icon="share-variant" 
                    onPress={handleShare} 
                    disabled={isSharing || isLoading || !localFileUri}
                    mode="contained"
                    style={{marginRight: 8}}
                >
                    Compartir
                </Button>
                <Button onPress={onDismiss} disabled={isLoading}>Cerrar</Button>
            </View>
        </Card.Actions>
      </Card>
    </Modal>
  );
}
