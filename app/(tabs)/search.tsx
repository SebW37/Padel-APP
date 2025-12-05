import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { getJoueurs, getDivisions, createDefi } from '@/lib/supabase-rn';
import type { Joueur, Division } from '@/lib/supabase-rn';

export default function SearchScreen() {
  const { joueur: currentJoueur } = useAuth();
  const [searchRadius, setSearchRadius] = useState(20);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [joueurs, setJoueurs] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    loadDivisions();
    searchJoueurs();
  }, []);

  const loadDivisions = async () => {
    try {
      const divisionsData = await getDivisions();
      setDivisions(divisionsData);
    } catch (error) {
      console.error('Erreur lors du chargement des divisions:', error);
    }
  };

  const searchJoueurs = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      
      if (selectedDivision) {
        const division = divisions.find(d => 
          d.nom.fr === selectedDivision || 
          d.nom.es === selectedDivision || 
          d.nom.en === selectedDivision
        );
        if (division) {
          filters.division_id = division.id;
        }
      }

      const joueursData = await getJoueurs(filters);
      
      // Filtrer pour exclure le joueur actuel
      const filteredJoueurs = joueursData?.filter(j => j.id !== currentJoueur?.id) || [];
      
      // Simuler la distance (en réalité, il faudrait calculer avec la géolocalisation)
      const joueursWithDistance = filteredJoueurs.map(joueur => ({
        ...joueur,
        distance: Math.random() * 10 + 1 // Distance simulée entre 1 et 11 km
      }));
      
      setJoueurs(joueursWithDistance);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = async (joueurId: string, joueurName: string) => {
    if (!currentJoueur) return;

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await createDefi({
        expediteur_id: currentJoueur.id,
        destinataire_id: joueurId,
        message: `${currentJoueur.nom_complet} vous défie pour un match !`
      });

      setSuccessMessage(`Votre défi a été envoyé à ${joueurName}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du défi:', error);
      setErrorMessage('Impossible d\'envoyer le défi. Veuillez réessayer.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const getDivisionName = (division: any, langue: string = 'fr') => {
    if (!division) return '';
    return division.nom?.[langue] || division.nom?.['fr'] || '';
  };

  React.useEffect(() => {
    searchJoueurs();
  }, [selectedDivision]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Recherche Joueurs</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={20} color="#f97316" />
          </TouchableOpacity>
        </View>

        {/* Success/Error Messages */}
        {successMessage ? (
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}
        {errorMessage ? (
          <View style={styles.errorMessage}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom..."
              placeholderTextColor="#9ca3af"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Filters */}
        {showFilters ? (
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Rayon de recherche: {searchRadius} km</Text>
              <View style={styles.radiusSelector}>
                {[10, 20, 50, 100].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    style={[
                      styles.radiusButton,
                      searchRadius === radius && styles.radiusButtonActive
                    ]}
                    onPress={() => setSearchRadius(radius)}
                  >
                    <Text style={[
                      styles.radiusButtonText,
                      searchRadius === radius && styles.radiusButtonTextActive
                    ]}>
                      {radius}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Division</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.divisionSelector}>
                  <TouchableOpacity
                    style={[
                      styles.divisionButton,
                      selectedDivision === '' && styles.divisionButtonActive
                    ]}
                    onPress={() => setSelectedDivision('')}
                  >
                    <Text style={[
                      styles.divisionButtonText,
                      selectedDivision === '' && styles.divisionButtonTextActive
                    ]}>
                      Toutes
                    </Text>
                  </TouchableOpacity>
                  {divisions.slice(0, 8).map((division) => {
                    const divisionName = getDivisionName(division, currentJoueur?.preference_langue);
                    return (
                    <TouchableOpacity
                      key={division.id}
                      style={[
                        styles.divisionButton,
                        selectedDivision === divisionName && styles.divisionButtonActive
                      ]}
                      onPress={() => setSelectedDivision(divisionName)}
                    >
                      <Text style={[
                        styles.divisionButtonText,
                        selectedDivision === divisionName && styles.divisionButtonTextActive
                      ]}>
                        {divisionName}
                      </Text>
                    </TouchableOpacity>
                  )})}
                </View>
              </ScrollView>
            </View>
          </View>
        ) : null}

        {/* Results */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            Joueurs trouvés ({joueurs.length})
            {loading && ' - Chargement...'}
          </Text>
          
          {joueurs
            .filter(joueur => 
              searchText === '' || 
              joueur.nom_complet.toLowerCase().includes(searchText.toLowerCase())
            )
            .map((joueur) => (
            <View key={joueur.id} style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{joueur.nom_complet}</Text>
                <View style={styles.playerDetails}>
                  <Ionicons name="trophy" size={14} color="#f97316" />
                  <Text style={styles.playerDivision}>
                    {getDivisionName(joueur.division, currentJoueur?.preference_langue)}
                  </Text>
                  <Text style={styles.playerPoints}>• {joueur.points_classement} pts</Text>
                </View>
                <View style={styles.playerLocation}>
                  <Ionicons name="location" size={14} color="#6b7280" />
                  <Text style={styles.playerClub}>{joueur.club?.nom || 'Club non spécifié'}</Text>
                  <Text style={styles.playerDistance}>• {joueur.distance?.toFixed(1)} km</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.challengeButton}
                onPress={() => handleChallenge(joueur.id, joueur.nom_complet)}
              >
                <Ionicons name="send" size={16} color="#ffffff" />
                <Text style={styles.challengeButtonText}>Défier</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Map View Toggle */}
        <TouchableOpacity style={styles.mapButton}>
          <Ionicons name="location" size={20} color="#f97316" />
          <Text style={styles.mapButtonText}>Voir sur la carte</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  radiusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: '#f97316',
  },
  radiusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  radiusButtonTextActive: {
    color: '#ffffff',
  },
  divisionSelector: {
    flexDirection: 'row',
  },
  divisionButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  divisionButtonActive: {
    backgroundColor: '#f97316',
  },
  divisionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  divisionButtonTextActive: {
    color: '#ffffff',
  },
  resultsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  playerCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerDivision: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f97316',
    marginLeft: 4,
  },
  playerPoints: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  playerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerClub: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  playerDistance: {
    fontSize: 13,
    color: '#9ca3af',
    marginLeft: 4,
  },
  challengeButton: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  challengeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  mapButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f97316',
  },
  mapButtonText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  successMessage: {
    backgroundColor: '#d1fae5',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  successText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '500',
  },
});