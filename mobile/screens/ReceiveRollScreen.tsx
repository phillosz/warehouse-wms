import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { receiveRoll } from '../services/api';

export default function ReceiveRollScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { ean } = route.params || {};

  const [formData, setFormData] = useState({
    ean: ean || '',
    materialName: '',
    description: '',
    widthMm: '',
    grammageGm2: '',
    color: '',
    supplier: '',
    batchNo: '',
    photo: '',
  });

  const [selectedRailCode, setSelectedRailCode] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectRail = () => {
    navigation.navigate('SelectRail', {
      onSelect: (railCode: string) => {
        setSelectedRailCode(railCode);
      }
    });
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Oprávnění', 'Aplikace potřebuje přístup k fotkám');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      updateField('photo', `data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!formData.ean || !formData.materialName || !selectedRailCode) {
      Alert.alert('Chyba', 'Vyplňte prosím EAN, název materiálu a vyberte kolejnici');
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const deviceId = await AsyncStorage.getItem('deviceId');

      if (!userId) {
        Alert.alert('Chyba', 'Uživatel není přihlášen');
        return;
      }

      await receiveRoll({
        ean: formData.ean,
        materialName: formData.materialName,
        description: formData.description || undefined,
        widthMm: formData.widthMm ? parseInt(formData.widthMm) : undefined,
        grammageGm2: formData.grammageGm2 ? parseInt(formData.grammageGm2) : undefined,
        color: formData.color || undefined,
        supplier: formData.supplier || undefined,
        batchNo: formData.batchNo || undefined,
        photo: formData.photo || undefined,
        toRailCode: selectedRailCode,
        userId,
        deviceId: deviceId || undefined
      });

      Alert.alert('Úspěch', 'Role úspěšně přijata');
      navigation.goBack();
    } catch (error: any) {
      console.error('Receive error:', error);
      Alert.alert('Chyba', error.response?.data?.error || 'Příjem role selhal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Základní údaje *</Text>
          
          <Text style={styles.label}>EAN kód *</Text>
          <TextInput
            style={styles.input}
            value={formData.ean}
            onChangeText={v => updateField('ean', v)}
            placeholder="859500000001"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Název materiálu *</Text>
          <TextInput
            style={styles.input}
            value={formData.materialName}
            onChangeText={v => updateField('materialName', v)}
            placeholder="Papír lesklý"
          />

          <Text style={styles.label}>Popis</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={v => updateField('description', v)}
            placeholder="Doplňující informace"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.sectionTitle}>Specifikace</Text>

          <Text style={styles.label}>Šířka (mm)</Text>
          <TextInput
            style={styles.input}
            value={formData.widthMm}
            onChangeText={v => updateField('widthMm', v)}
            placeholder="1200"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Gramáž (g/m²)</Text>
          <TextInput
            style={styles.input}
            value={formData.grammageGm2}
            onChangeText={v => updateField('grammageGm2', v)}
            placeholder="80"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Barva</Text>
          <TextInput
            style={styles.input}
            value={formData.color}
            onChangeText={v => updateField('color', v)}
            placeholder="bílá"
          />

          <Text style={styles.sectionTitle}>Dodavatel</Text>

          <Text style={styles.label}>Název dodavatele</Text>
          <TextInput
            style={styles.input}
            value={formData.supplier}
            onChangeText={v => updateField('supplier', v)}
            placeholder="Papírny s.r.o."
          />

          <Text style={styles.label}>Číslo šarže</Text>
          <TextInput
            style={styles.input}
            value={formData.batchNo}
            onChangeText={v => updateField('batchNo', v)}
            placeholder="20231101-A"
          />

          <Text style={styles.sectionTitle}>Fotografie</Text>
          
          <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
            <Text style={styles.photoButtonText}>
              {formData.photo ? '📷 Změnit fotografii' : '📷 Přidat fotografii'}
            </Text>
          </TouchableOpacity>

          {formData.photo && (
            <Image 
              source={{ uri: formData.photo }} 
              style={styles.photoPreview}
              resizeMode="cover"
            />
          )}

          <Text style={styles.sectionTitle}>Umístění *</Text>

          <TouchableOpacity style={styles.railButton} onPress={handleSelectRail}>
            <Text style={styles.railButtonText}>
              {selectedRailCode ? `📍 ${selectedRailCode}` : 'Vybrat kolejnici'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Ukládám...' : 'Přijmout roli'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  railButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  railButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoButton: {
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
