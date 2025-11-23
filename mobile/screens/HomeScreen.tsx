import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getRails, Rail } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen() {
  const [rails, setRails] = useState<Rail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const { logout, user } = useAuth();

  useEffect(() => {
    loadRails();
  }, []);

  const loadRails = async () => {
    setLoading(true);
    try {
      const data = await getRails();
      setRails(data);
    } catch (error) {
      console.error('Failed to load rails:', error);
      Alert.alert('Chyba', 'Nepodařilo se načíst kolejnice');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getRails();
      setRails(data);
    } catch (error) {
      console.error('Failed to load rails:', error);
      Alert.alert('Chyba', 'Nepodařilo se načíst kolejnice');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Odhlásit se',
      `Opravdu se chcete odhlásit jako ${user?.name}?`,
      [
        { text: 'Zrušit', style: 'cancel' },
        { text: 'Odhlásit', onPress: logout, style: 'destructive' }
      ]
    );
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
              rail && rail.rollCount > 0 && styles.gridCellOccupied
            ]}
            onPress={() => rail && navigation.navigate('RailDetail', { railCode: rail.code })}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Mapa skladu</Text>
          <Text style={styles.subtitle}>Přehled kolejnic</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.userText}>👤 {user?.name} • Odhlásit</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('ReceiveRoll')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
          <Text style={styles.legendText}>Prázdná</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.gridCellOccupied]} />
          <Text style={styles.legendText}>Obsazená</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  userText: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
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
    backgroundColor: '#fff',
    borderColor: '#007AFF',
  },
  gridCellOccupied: {
    backgroundColor: '#4CAF50',
    borderColor: '#45a049',
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
