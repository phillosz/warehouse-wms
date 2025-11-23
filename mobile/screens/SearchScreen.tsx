import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchRolls, Roll } from '../services/api';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [results, setResults] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const rolls = await searchRolls({ query, status, limit: 50 });
      setResults(rolls);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Chyba', 'Vyhledávání selhalo');
    } finally {
      setLoading(false);
    }
  };

  const renderRoll = ({ item }: { item: Roll }) => (
    <TouchableOpacity
      style={styles.rollCard}
      onPress={() => navigation.navigate('RollDetail', { rollId: item.id })}
    >
      <View style={styles.rollHeader}>
        <Text style={styles.rollMaterial}>{item.materialName}</Text>
        <Text style={[
          styles.rollStatus,
          item.status === 'active' ? styles.statusActive : styles.statusRemoved
        ]}>
          {item.status === 'active' ? 'Aktivní' : 'Odebraná'}
        </Text>
      </View>
      
      <Text style={styles.rollEAN}>EAN: {item.ean}</Text>
      
      {item.description && (
        <Text style={styles.rollDescription}>{item.description}</Text>
      )}
      
      <View style={styles.rollDetails}>
        {item.widthMm && (
          <Text style={styles.rollDetail}>Šířka: {item.widthMm}mm</Text>
        )}
        {item.grammageGm2 && (
          <Text style={styles.rollDetail}>Gramáž: {item.grammageGm2}g/m²</Text>
        )}
      </View>
      
      {item.location?.rail && (
        <View style={styles.locationBadge}>
          <Text style={styles.locationText}>📍 {item.location.rail.code}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vyhledávání</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Hledat podle EAN, názvu..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          autoCapitalize="none"
        />
        
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, status === 'active' && styles.filterButtonActive]}
            onPress={() => setStatus('active')}
          >
            <Text style={[styles.filterText, status === 'active' && styles.filterTextActive]}>
              Aktivní
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, status === 'removed' && styles.filterButtonActive]}
            onPress={() => setStatus('removed')}
          >
            <Text style={[styles.filterText, status === 'removed' && styles.filterTextActive]}>
              Odebrané
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, !status && styles.filterButtonActive]}
            onPress={() => setStatus('')}
          >
            <Text style={[styles.filterText, !status && styles.filterTextActive]}>
              Vše
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? 'Hledám...' : 'Hledat'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        renderItem={renderRoll}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query ? 'Žádné výsledky' : 'Zadejte hledaný výraz'}
          </Text>
        }
      />
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsList: {
    padding: 16,
  },
  rollCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rollMaterial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  rollStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  statusRemoved: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
  },
  rollEAN: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rollDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rollDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rollDetail: {
    fontSize: 12,
    color: '#999',
    marginRight: 12,
  },
  locationBadge: {
    marginTop: 8,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
  },
});
