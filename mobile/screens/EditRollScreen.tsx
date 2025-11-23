import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getRoll, updateRoll, Roll } from '../services/api';

export default function EditRollScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { rollId } = route.params;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    materialName: '',
    description: '',
    widthMm: '',
    grammageGm2: '',
    color: '',
    supplier: '',
    batchNo: '',
    photo: '',
  });

  useEffect(() => {
    loadRoll();
  }, [rollId]);

  const loadRoll = async () => {
    try {
      const roll = await getRoll(rollId);
      setFormData({
        materialName: roll.materialName,
        description: roll.description || '',
        widthMm: roll.widthMm?.toString() || '',
        grammageGm2: roll.grammageGm2?.toString() || '',
        color: roll.color || '',
        supplier: roll.supplier || '',
        batchNo: roll.batchNo || '',
        photo: roll.photo || '',
      });
    } catch (error) {
      console.error('Failed to load roll:', error);
      Alert.alert('Chyba', 'Nepodařilo se načíst roli');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePickImage = async () => {
    Alert.alert(
      'Změnit fotku',
      'Vyberte zdroj fotografie',
      [
        {
          text: 'Vyfotit',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            
            if (!permissionResult.granted) {
              Alert.alert('Oprávnění', 'Aplikace potřebuje přístup ke kameře');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.2,
              base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
              updateField('photo', `data:image/jpeg;base64,${result.assets[0].base64}`);
            }
          }
        },
        {
          text: 'Vybrat z galerie',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (!permissionResult.granted) {
              Alert.alert('Oprávnění', 'Aplikace potřebuje přístup k fotkám');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.2,
              base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
              updateField('photo', `data:image/jpeg;base64,${result.assets[0].base64}`);
            }
          }
        },
        {
          text: 'Odebrat fotku',
          style: 'destructive',
          onPress: () => updateField('photo', '')
        },
        {
          text: 'Zrušit',
          style: 'cancel'
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.materialName.trim()) {
      Alert.alert('Chyba', 'Vyplňte prosím název materiálu');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        materialName: formData.materialName.trim(),
      };

      if (formData.description.trim()) updateData.description = formData.description.trim();
      if (formData.widthMm.trim()) updateData.widthMm = parseInt(formData.widthMm);
      if (formData.grammageGm2.trim()) updateData.grammageGm2 = parseInt(formData.grammageGm2);
      if (formData.color.trim()) updateData.color = formData.color.trim();
      if (formData.supplier.trim()) updateData.supplier = formData.supplier.trim();
      if (formData.batchNo.trim()) updateData.batchNo = formData.batchNo.trim();
      if (formData.photo) updateData.photo = formData.photo;

      const result = await updateRoll(rollId, updateData);
      console.log('Roll updated successfully:', result);

      Alert.alert('Úspěch', 'Role úspěšně upravena', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error: any) {
      console.error('Update error:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Chyba', error.response?.data?.error || 'Úprava role selhala');
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
          <Text style={styles.sectionTitle}>Základní údaje</Text>
          
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

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Ukládám...' : 'Uložit změny'}
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
    fontSize: 18,
    fontWeight: 'bold',
  },
});
