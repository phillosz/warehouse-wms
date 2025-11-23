import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getRoll } from '../services/api';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [processing, setProcessing] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Reset scanned state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      setProcessing(false);
      // Force camera remount by changing key
      setCameraKey(prev => prev + 1);
      return () => {
        // Cleanup when leaving screen
        setScanned(false);
        setProcessing(false);
      };
    }, [])
  );

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    // Prevent multiple scans
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);
    console.log('Scanned EAN:', data);

    try {
      // Try to find existing roll
      const rolls = await import('../services/api').then(m => m.searchRolls({ query: data, limit: 1 }));
      
      if (rolls.length > 0) {
        // Roll exists - show detail
        navigation.navigate('RollDetail', { rollId: rolls[0].id });
        // Reset after navigation with longer delay
        setTimeout(() => {
          setScanned(false);
          setProcessing(false);
        }, 1000);
      } else {
        // New roll - go to receive screen
        Alert.alert(
          'Nová role',
          'Tato role ještě není v systému. Chcete ji přijmout?',
          [
            {
              text: 'Zrušit',
              onPress: () => {
                setScanned(false);
                setProcessing(false);
              },
              style: 'cancel'
            },
            {
              text: 'Příjem',
              onPress: () => {
                navigation.navigate('ReceiveRoll', { ean: data });
                setTimeout(() => {
                  setScanned(false);
                  setProcessing(false);
                }, 1000);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Chyba', 'Nepodařilo se načíst informace o roli');
      setScanned(false);
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Žádám o přístup ke kameře...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPermissionText}>Aplikace nemá přístup ke kameře</Text>
        <Text style={styles.subtitle}>Povolte přístup v nastavení telefonu</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skenování EAN</Text>
        <Text style={styles.subtitle}>Namiřte kameru na čárový kód</Text>
      </View>

      <CameraView
        key={`camera-${cameraKey}`}
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'qr', 'code128'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
      </CameraView>

      {scanned && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.buttonText}>Skenovat znovu</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noPermissionText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
    marginHorizontal: 20,
  },
});
