import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getRails, Rail } from '../services/api';

export default function SelectRailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { rollId, onSelect } = route.params;

  const [rails, setRails] = useState<Rail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRails();
  }, []);

  const loadRails = async () => {
    setLoading(true);
    try {
      const data = await getRails();
      setRails(data.filter(r => r.isActive));
    } catch (error) {
      console.error('Failed to load rails:', error);
      Alert.alert('Chyba', 'Nepodařilo se načíst kolejnice');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (rail: Rail) => {
    onSelect(rail.code);
    navigation.goBack();
  };

  const renderGrid = () => {
    const maxRow = Math.max(...rails.map(r => r.rowIndex));
    const maxCol = Math.max(...rails.map(r => r.colIndex));
    const rows = [];

    for (let row = 0; row <= maxRow; row++) {
      const cols = [];
      for (let col = 0; col <= maxCol; col++) {
        const rail = rails.find(r => r.rowIndex === row && r.colIndex === col);
        cols.push(
          <TouchableOpacity
            key={`${row}-${col}`}
            style={[
              styles.gridCell,
              rail && styles.gridCellActive,
              rail && rail.rollCount > 5 && styles.gridCellBusy
            ]}
            onPress={() => rail && handleSelect(rail)}
            disabled={!rail}
          >
            {rail && (
              <>
                <Text style={styles.gridCellCode}>{rail.code}</Text>
                <Text style={styles.gridCellCount}>{rail.rollCount}</Text>
              </>
            )}
          </TouchableOpacity>
        );
      }
      rows.push(
        <View key={row} style={styles.gridRow}>
          {cols}
        </View>
      );
    }

    return rows;
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vyberte kolejnici</Text>
        <Text style={styles.subtitle}>Klepněte na kolejnici pro výběr</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        horizontal
      >
        <ScrollView>
          <View style={styles.grid}>
            {renderGrid()}
          </View>
        </ScrollView>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.gridCellActive]} />
          <Text style={styles.legendText}>Málo obsazená</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.gridCellBusy]} />
          <Text style={styles.legendText}>Více obsazená</Text>
        </View>
      </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  grid: {
    alignSelf: 'flex-start',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    width: 80,
    height: 60,
    margin: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  gridCellActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  gridCellBusy: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  gridCellCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  gridCellCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
});
