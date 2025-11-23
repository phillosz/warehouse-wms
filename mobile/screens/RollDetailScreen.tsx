import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRoll, moveRoll, removeRoll, Roll, Movement } from '../services/api';

export default function RollDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { rollId } = route.params;

  const [roll, setRoll] = useState<(Roll & { movements: Movement[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoll();
  }, [rollId]);

  const loadRoll = async () => {
    setLoading(true);
    try {
      const data = await getRoll(rollId);
      setRoll(data);
    } catch (error) {
      console.error('Failed to load roll:', error);
      Alert.alert('Chyba', 'Nepodařilo se načíst roli');
    } finally {
      setLoading(false);
    }
  };

  const handleMove = () => {
    navigation.navigate('SelectRail', {
      rollId: roll?.id,
      onSelect: async (railCode: string) => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          const deviceId = await AsyncStorage.getItem('deviceId');
          
          if (!userId) {
            Alert.alert('Chyba', 'Uživatel není přihlášen');
            return;
          }

          await moveRoll(roll!.id, {
            toRailCode: railCode,
            userId,
            deviceId: deviceId || undefined
          });

          Alert.alert('Úspěch', 'Role úspěšně přesunuta');
          navigation.goBack();
          loadRoll();
        } catch (error: any) {
          console.error('Move error:', error);
          Alert.alert('Chyba', error.response?.data?.error || 'Přesun selhal');
        }
      }
    });
  };

  const handleRemove = () => {
    Alert.alert(
      'Odebrat roli',
      'Opravdu chcete odebrat tuto roli ze skladu?',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Odebrat',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              const deviceId = await AsyncStorage.getItem('deviceId');
              
              if (!userId) {
                Alert.alert('Chyba', 'Uživatel není přihlášen');
                return;
              }

              await removeRoll(roll!.id, {
                userId,
                deviceId: deviceId || undefined
              });

              Alert.alert('Úspěch', 'Role odebrána');
              navigation.goBack();
            } catch (error: any) {
              console.error('Remove error:', error);
              Alert.alert('Chyba', error.response?.data?.error || 'Odebrání selhalo');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!roll) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Role nenalezena</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {roll.photo && (
        <Image 
          source={{ uri: roll.photo }} 
          style={styles.heroImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.card}>
        <Text style={styles.title}>{roll.materialName}</Text>
        <Text style={[
          styles.status,
          roll.status === 'active' ? styles.statusActive : styles.statusRemoved
        ]}>
          {roll.status === 'active' ? '✓ Aktivní' : '✗ Odebraná'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informace</Text>
        <InfoRow label="EAN" value={roll.ean} />
        {roll.description && <InfoRow label="Popis" value={roll.description} />}
        {roll.widthMm && <InfoRow label="Šířka" value={`${roll.widthMm} mm`} />}
        {roll.grammageGm2 && <InfoRow label="Gramáž" value={`${roll.grammageGm2} g/m²`} />}
        {roll.color && <InfoRow label="Barva" value={roll.color} />}
        {roll.supplier && <InfoRow label="Dodavatel" value={roll.supplier} />}
        {roll.batchNo && <InfoRow label="Šarže" value={roll.batchNo} />}
        <InfoRow label="Přijato" value={new Date(roll.receivedAt).toLocaleString('cs-CZ')} />
      </View>

      {roll.location && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Aktuální umístění</Text>
          {roll.location.rail ? (
            <>
              <InfoRow label="Kolejnice" value={roll.location.rail.code} />
              <InfoRow label="Umístěno" value={new Date(roll.location.placedAt).toLocaleString('cs-CZ')} />
              <InfoRow label="Poslední pohyb" value={new Date(roll.location.lastMovedAt).toLocaleString('cs-CZ')} />
            </>
          ) : (
            <Text style={styles.notLocated}>Role není umístěna na kolejnici</Text>
          )}
        </View>
      )}

      {roll.status === 'active' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.moveButton} onPress={handleMove}>
            <Text style={styles.buttonText}>Přesunout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Text style={styles.buttonText}>Odebrat</Text>
          </TouchableOpacity>
        </View>
      )}

      {roll.movements && roll.movements.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Historie pohybů</Text>
          {roll.movements.map((movement, index) => (
            <View key={movement.id} style={styles.movementItem}>
              <View style={styles.movementHeader}>
                <Text style={styles.movementType}>
                  {movement.type === 'RECEIVE' && '📥 Příjem'}
                  {movement.type === 'MOVE' && '🔄 Přesun'}
                  {movement.type === 'REMOVE' && '📤 Odebrání'}
                </Text>
                <Text style={styles.movementDate}>
                  {new Date(movement.at).toLocaleString('cs-CZ')}
                </Text>
              </View>
              
              {movement.fromRail && (
                <Text style={styles.movementDetail}>Z: {movement.fromRail.code}</Text>
              )}
              {movement.toRail && (
                <Text style={styles.movementDetail}>Na: {movement.toRail.code}</Text>
              )}
              {movement.user && (
                <Text style={styles.movementUser}>Provedl: {movement.user.name}</Text>
              )}
              
              {index < roll.movements.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  statusRemoved: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  notLocated: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
    gap: 12,
  },
  moveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  movementItem: {
    marginBottom: 12,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  movementType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  movementDate: {
    fontSize: 12,
    color: '#999',
  },
  movementDetail: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
  },
  movementUser: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 12,
  },
});
