import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getRail, getRailInventory, Rail, Roll } from '../services/api';

export default function RailDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { railCode } = route.params;

  const [rail, setRail] = useState<Rail | null>(null);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRailData();
  }, [railCode]);

  const loadRailData = async () => {
    setLoading(true);
    try {
      const [railData, inventoryData] = await Promise.all([
        getRail(railCode),
        getRailInventory(railCode)
      ]);
      
      setRail(railData);
      setRolls(inventoryData.rolls);
    } catch (error) {
      console.error('Failed to load rail:', error);
      Alert.alert('Chyba', 'Nepodařilo se načíst data kolejnice');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!rail) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Kolejnice nenalezena</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadRailData} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.code}>{rail.code}</Text>
        <Text style={styles.name}>{rail.name}</Text>
        {rail.zone && (
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneText}>Zóna {rail.zone}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pozice</Text>
        <InfoRow label="Řada" value={`${rail.rowIndex + 1}`} />
        <InfoRow label="Sloupec" value={`${rail.colIndex + 1}`} />
        {rail.zone && <InfoRow label="Zóna" value={rail.zone} />}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Obsazenost</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{rolls.length}</Text>
            <Text style={styles.statLabel}>Rolí</Text>
          </View>
        </View>
      </View>

      {rolls.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Role na kolejnici</Text>
          {rolls.map((roll, index) => (
            <TouchableOpacity 
              key={roll.id}
              onPress={() => navigation.navigate('RollDetail', { rollId: roll.id })}
              activeOpacity={0.7}
            >
              <View style={styles.rollItem}>
                <View>
                  <Text style={styles.rollMaterial}>{roll.materialName}</Text>
                  <Text style={styles.rollEAN}>EAN: {roll.ean}</Text>
                  {roll.widthMm && roll.grammageGm2 && (
                    <Text style={styles.rollSpecs}>
                      {roll.widthMm}mm × {roll.grammageGm2}g/m²
                    </Text>
                  )}
                </View>
                {index < rolls.length - 1 && <View style={styles.separator} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {rolls.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Kolejnice je prázdná</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  name: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  zoneBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  zoneText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
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
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  rollItem: {
    paddingVertical: 12,
  },
  rollMaterial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rollEAN: {
    fontSize: 13,
    color: '#666',
  },
  rollSpecs: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
