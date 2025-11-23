import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchRolls, batchMoveRolls, getRails, Roll, Rail } from '../services/api';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [results, setResults] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedRolls, setSelectedRolls] = useState<Set<string>>(new Set());
  const [rails, setRails] = useState<Rail[]>([]);
  const [showRailPicker, setShowRailPicker] = useState(false);
  const [selectedRailCode, setSelectedRailCode] = useState<string>('');
  const navigation = useNavigation<any>();

  // Advanced filters
  const [filters, setFilters] = useState({
    widthMin: '',
    widthMax: '',
    grammageMin: '',
    grammageMax: '',
    color: '',
    supplier: '',
  });

  useEffect(() => {
    loadRails();
  }, []);

  const loadRails = async () => {
    try {
      const allRails = await getRails();
      setRails(allRails);
    } catch (error) {
      console.error('Failed to load rails:', error);
    }
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const rolls = await searchRolls({ 
        query: query.trim() || undefined,
        status, 
        railCode: selectedRailCode || undefined,
        widthMin: filters.widthMin ? parseInt(filters.widthMin) : undefined,
        widthMax: filters.widthMax ? parseInt(filters.widthMax) : undefined,
        grammageMin: filters.grammageMin ? parseInt(filters.grammageMin) : undefined,
        grammageMax: filters.grammageMax ? parseInt(filters.grammageMax) : undefined,
        color: filters.color || undefined,
        supplier: filters.supplier || undefined,
        limit: 100 
      });
      setResults(rolls);
      if (!batchMode) {
        setSelectedRolls(new Set());
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Chyba', 'Vyhledávání selhalo');
    } finally {
      setLoading(false);
    }
  };

  const selectAllResults = () => {
    const allIds = new Set(results.map(r => r.id));
    setSelectedRolls(allIds);
  };

  const deselectAll = () => {
    setSelectedRolls(new Set());
  };

  const toggleRollSelection = (rollId: string) => {
    setSelectedRolls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rollId)) {
        newSet.delete(rollId);
      } else {
        newSet.add(rollId);
      }
      return newSet;
    });
  };

  const handleBatchMove = () => {
    if (selectedRolls.size === 0) {
      Alert.alert('Chyba', 'Nevybrali jste žádné role');
      return;
    }

    navigation.navigate('SelectRail', {
      onSelect: async (railCode: string) => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          const deviceId = await AsyncStorage.getItem('deviceId');
          
          if (!userId) {
            Alert.alert('Chyba', 'Uživatel není přihlášen');
            return;
          }

          await batchMoveRolls({
            rollIds: Array.from(selectedRolls),
            toRailCode: railCode,
            userId,
            deviceId: deviceId || undefined
          });

          Alert.alert('Úspěch', `Přesunuto ${selectedRolls.size} rolí`);
          setBatchMode(false);
          setSelectedRolls(new Set());
          handleSearch(); // Refresh results
        } catch (error: any) {
          console.error('Batch move error:', error);
          Alert.alert('Chyba', error.response?.data?.error || 'Hromadný přesun selhal');
        }
      }
    });
  };

  const renderRoll = ({ item }: { item: Roll }) => (
    <TouchableOpacity
      style={styles.rollCard}
      onPress={() => {
        if (batchMode) {
          toggleRollSelection(item.id);
        } else {
          navigation.navigate('RollDetail', { rollId: item.id });
        }
      }}
    >
      {batchMode && (
        <View style={styles.checkbox}>
          <Text style={styles.checkboxText}>
            {selectedRolls.has(item.id) ? '☑' : '☐'}
          </Text>
        </View>
      )}
      
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
        <View style={styles.headerTop}>
          <Text style={styles.title}>Vyhledávání</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.modeButton, batchMode && styles.modeButtonActive]}
              onPress={() => {
                setBatchMode(!batchMode);
                setSelectedRolls(new Set());
              }}
            >
              <Text style={styles.modeButtonText}>
                {batchMode ? `✓ Výběr (${selectedRolls.size})` : '☐ Výběr'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={styles.filterToggleText}>
                {showFilters ? '▲ Filtry' : '▼ Filtry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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

        {showFilters && (
          <View style={styles.advancedFilters}>
            <Text style={styles.filterSectionTitle}>Pokročilé filtry</Text>
            
            <View style={styles.rangeRow}>
              <TextInput
                style={[styles.filterInput, styles.halfInput]}
                placeholder="Šířka min (mm)"
                value={filters.widthMin}
                onChangeText={v => updateFilter('widthMin', v)}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.filterInput, styles.halfInput]}
                placeholder="Šířka max (mm)"
                value={filters.widthMax}
                onChangeText={v => updateFilter('widthMax', v)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.rangeRow}>
              <TextInput
                style={[styles.filterInput, styles.halfInput]}
                placeholder="Gramáž min (g/m²)"
                value={filters.grammageMin}
                onChangeText={v => updateFilter('grammageMin', v)}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.filterInput, styles.halfInput]}
                placeholder="Gramáž max (g/m²)"
                value={filters.grammageMax}
                onChangeText={v => updateFilter('grammageMax', v)}
                keyboardType="numeric"
              />
            </View>

            <TextInput
              style={styles.filterInput}
              placeholder="Barva"
              value={filters.color}
              onChangeText={v => updateFilter('color', v)}
            />

            <TextInput
              style={styles.filterInput}
              placeholder="Dodavatel"
              value={filters.supplier}
              onChangeText={v => updateFilter('supplier', v)}
            />

            <TouchableOpacity
              style={styles.railPickerButton}
              onPress={() => setShowRailPicker(true)}
            >
              <Text style={styles.railPickerText}>
                {selectedRailCode ? `📍 Kolejnice: ${selectedRailCode}` : '📍 Vybrat kolejnici'}
              </Text>
              {selectedRailCode && (
                <TouchableOpacity
                  style={styles.clearRailButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedRailCode('');
                  }}
                >
                  <Text style={styles.clearRailText}>✕</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        )}

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

      {batchMode && selectedRolls.size > 0 && (
        <View style={styles.batchActions}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={selectAllResults}
          >
            <Text style={styles.selectAllText}>Vybrat vše ({results.length})</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deselectButton}
            onPress={deselectAll}
          >
            <Text style={styles.deselectText}>Zrušit výběr</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.batchButton}
            onPress={handleBatchMove}
          >
            <Text style={styles.batchButtonText}>
              Přesunout ({selectedRolls.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={results}
        renderItem={renderRoll}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? '' : (results.length === 0 && query) ? 'Žádné výsledky' : 'Klikněte na Hledat pro zobrazení rolí'}
          </Text>
        }
      />

      <Modal
        visible={showRailPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRailPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vybrat kolejnici</Text>
              <TouchableOpacity onPress={() => setShowRailPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={rails}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.railItem,
                    selectedRailCode === item.code && styles.railItemSelected
                  ]}
                  onPress={() => {
                    setSelectedRailCode(item.code);
                    setShowRailPicker(false);
                  }}
                >
                  <Text style={styles.railCode}>{item.code}</Text>
                  {item.name && <Text style={styles.railName}>{item.name}</Text>}
                  {selectedRailCode === item.code && (
                    <Text style={styles.railCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  modeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  modeButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  filterToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  filterToggleText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
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
  advancedFilters: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  halfInput: {
    flex: 1,
  },
  railPickerButton: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  railPickerText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  clearRailButton: {
    marginLeft: 8,
    padding: 4,
  },
  clearRailText: {
    fontSize: 18,
    color: '#F44336',
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
  batchActions: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    gap: 8,
  },
  selectAllButton: {
    flex: 1,
    backgroundColor: '#6C5CE7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deselectButton: {
    flex: 1,
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deselectText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  batchButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  batchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkbox: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  checkboxText: {
    fontSize: 24,
    color: '#007AFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  railItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  railItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  railCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  railName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 12,
  },
  railCheckmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
