import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Linking, Platform } from 'react-native';

// Import conditionnel de react-native-maps (ne fonctionne pas sur le web)
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (error) {
    console.warn('react-native-maps not available:', error);
  }
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { getJoueurs, getDivisions, getClubs, getLigues, createDefi, supabase } from '@/lib/supabase-rn';
import type { Joueur, Division, Club, Ligue } from '@/lib/supabase-rn';

type SearchType = 'nom' | 'club' | 'ligue' | 'localisation';

export default function SearchScreen() {
  const { joueur: currentJoueur } = useAuth();
  const [searchType, setSearchType] = useState<SearchType>('nom');
  const [searchRadius, setSearchRadius] = useState(20);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedClub, setSelectedClub] = useState<number | null>(null);
  const [selectedLigue, setSelectedLigue] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [joueurs, setJoueurs] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [ligues, setLigues] = useState<Ligue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showMap, setShowMap] = useState(false);

  React.useEffect(() => {
    loadDivisions();
    loadClubs();
    loadLigues();
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

  const loadClubs = async () => {
    try {
      const clubsData = await getClubs();
      setClubs(clubsData);
    } catch (error) {
      console.error('Erreur lors du chargement des clubs:', error);
    }
  };

  const loadLigues = async () => {
    try {
      const liguesData = await getLigues();
      setLigues(liguesData.filter(l => l.statut === 'active'));
    } catch (error) {
      console.error('Erreur lors du chargement des ligues:', error);
    }
  };

  const searchJoueurs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('joueurs')
        .select(`
          *,
          club:clubs(*),
          division:divisions(*)
        `);

      // Exclure le joueur actuel
      if (currentJoueur?.id) {
        query = query.neq('id', currentJoueur.id);
      }

      // Recherche par type
      switch (searchType) {
        case 'nom':
          if (searchText.trim()) {
            query = query.ilike('nom_complet', `%${searchText.trim()}%`);
          }
          break;

        case 'club':
          if (selectedClub) {
            query = query.eq('club_id', selectedClub);
          } else if (currentJoueur?.club_id) {
            // Rechercher les joueurs du même club
            query = query.eq('club_id', currentJoueur.club_id);
          }
          break;

        case 'ligue':
          if (selectedLigue) {
            // Récupérer les joueurs de la ligue
            const { data: ligueJoueurs, error: ljError } = await supabase
              .from('ligues_joueurs')
              .select('joueur_id')
              .eq('ligue_id', selectedLigue);

            if (ljError) throw ljError;

            const joueurIds = ligueJoueurs?.map((lj: any) => lj.joueur_id) || [];
            if (joueurIds.length > 0) {
              query = query.in('id', joueurIds);
            } else {
              // Aucun joueur dans la ligue
              setJoueurs([]);
              setLoading(false);
              return;
            }
          } else {
            // Aucune ligue sélectionnée, ne rien afficher
            setJoueurs([]);
            setLoading(false);
            return;
          }
          break;

        case 'localisation':
          // Pour la localisation, on filtre par rayon
          // Note: Cette fonctionnalité nécessite des coordonnées GPS réelles
          // Pour l'instant, on simule avec un filtre basique
          if (currentJoueur?.club_id) {
            query = query.eq('club_id', currentJoueur.club_id);
          }
          break;
      }

      // Filtre par division si sélectionné
      if (selectedDivision) {
        const division = divisions.find(d => 
          d.nom.fr === selectedDivision || 
          d.nom.es === selectedDivision || 
          d.nom.en === selectedDivision
        );
        if (division) {
          query = query.eq('division_id', division.id);
        }
      }

      const { data: joueursData, error } = await query.order('points_classement', { ascending: false });

      if (error) throw error;

      // Filtrer pour exclure le joueur actuel (double vérification)
      const filteredJoueurs = joueursData?.filter(j => j.id !== currentJoueur?.id) || [];
      
      // Calculer la distance (simulée pour l'instant)
      const joueursWithDistance = filteredJoueurs.map(joueur => ({
        ...joueur,
        distance: Math.random() * searchRadius + 1 // Distance simulée
      }));
      
      setJoueurs(joueursWithDistance);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setErrorMessage('Erreur lors de la recherche. Veuillez réessayer.');
      setTimeout(() => setErrorMessage(''), 5000);
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
  }, [selectedDivision, selectedClub, selectedLigue, searchType, searchRadius]);

  React.useEffect(() => {
    // Délai pour éviter trop de requêtes lors de la saisie
    const timeoutId = setTimeout(() => {
      if (searchType === 'nom' && searchText.trim()) {
        searchJoueurs();
      } else if (searchType !== 'nom') {
        searchJoueurs();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

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

        {/* Search Type Tabs */}
        <View style={styles.searchTypeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.searchTypeScroll}>
            <TouchableOpacity
              style={[styles.searchTypeButton, searchType === 'nom' && styles.searchTypeButtonActive]}
              onPress={() => {
                setSearchType('nom');
                setSelectedClub(null);
                setSelectedLigue(null);
              }}
            >
              <Ionicons 
                name="person" 
                size={18} 
                color={searchType === 'nom' ? '#ffffff' : '#6b7280'} 
              />
              <Text style={[styles.searchTypeText, searchType === 'nom' && styles.searchTypeTextActive]}>
                Nom
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.searchTypeButton, searchType === 'club' && styles.searchTypeButtonActive]}
              onPress={() => {
                setSearchType('club');
                setSearchText('');
                setSelectedLigue(null);
              }}
            >
              <Ionicons 
                name="business" 
                size={18} 
                color={searchType === 'club' ? '#ffffff' : '#6b7280'} 
              />
              <Text style={[styles.searchTypeText, searchType === 'club' && styles.searchTypeTextActive]}>
                Club
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.searchTypeButton, searchType === 'ligue' && styles.searchTypeButtonActive]}
              onPress={() => {
                setSearchType('ligue');
                setSearchText('');
                setSelectedClub(null);
              }}
            >
              <Ionicons 
                name="trophy" 
                size={18} 
                color={searchType === 'ligue' ? '#ffffff' : '#6b7280'} 
              />
              <Text style={[styles.searchTypeText, searchType === 'ligue' && styles.searchTypeTextActive]}>
                Ligue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.searchTypeButton, searchType === 'localisation' && styles.searchTypeButtonActive]}
              onPress={() => {
                setSearchType('localisation');
                setSearchText('');
                setSelectedClub(null);
                setSelectedLigue(null);
              }}
            >
              <Ionicons 
                name="location" 
                size={18} 
                color={searchType === 'localisation' ? '#ffffff' : '#6b7280'} 
              />
              <Text style={[styles.searchTypeText, searchType === 'localisation' && styles.searchTypeTextActive]}>
                Localisation
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          {searchType === 'nom' ? (
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher par nom..."
                placeholderTextColor="#9ca3af"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          ) : searchType === 'club' ? (
            <View style={styles.selectContainer}>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  if (selectedClub === null && currentJoueur?.club_id) {
                    setSelectedClub(currentJoueur.club_id);
                  } else {
                    setSelectedClub(null);
                  }
                }}
              >
                <Ionicons 
                  name={selectedClub === null && currentJoueur?.club_id ? "radio-button-off" : "radio-button-on"} 
                  size={20} 
                  color={selectedClub === null && currentJoueur?.club_id ? "#6b7280" : "#f97316"} 
                />
                <Text style={styles.selectButtonText}>
                  {currentJoueur?.club?.nom || 'Mon club'}
                </Text>
              </TouchableOpacity>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clubScroll}>
                {clubs.map((club) => (
                  <TouchableOpacity
                    key={club.id}
                    style={[
                      styles.clubButton,
                      selectedClub === club.id && styles.clubButtonActive
                    ]}
                    onPress={() => setSelectedClub(selectedClub === club.id ? null : club.id)}
                  >
                    <Text style={[
                      styles.clubButtonText,
                      selectedClub === club.id && styles.clubButtonTextActive
                    ]}>
                      {club.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : searchType === 'ligue' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ligueScroll}>
              {ligues.map((ligue) => (
                <TouchableOpacity
                  key={ligue.id}
                  style={[
                    styles.ligueButton,
                    selectedLigue === ligue.id && styles.ligueButtonActive
                  ]}
                  onPress={() => setSelectedLigue(selectedLigue === ligue.id ? null : ligue.id)}
                >
                  <Ionicons 
                    name="trophy" 
                    size={16} 
                    color={selectedLigue === ligue.id ? '#ffffff' : '#f97316'} 
                  />
                  <Text style={[
                    styles.ligueButtonText,
                    selectedLigue === ligue.id && styles.ligueButtonTextActive
                  ]}>
                    {ligue.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.locationContainer}>
              <Text style={styles.locationLabel}>Rayon de recherche: {searchRadius} km</Text>
              <View style={styles.radiusSelector}>
                {[5, 10, 20, 50, 100].map((radius) => (
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
          )}
        </View>

        {/* Filters - Division */}
        {showFilters ? (
          <View style={styles.filtersContainer}>
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
        {joueurs.length > 0 && (
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => setShowMap(true)}
          >
            <Ionicons name="location" size={20} color="#f97316" />
            <Text style={styles.mapButtonText}>Voir sur la carte</Text>
          </TouchableOpacity>
        )}

        {/* Map Modal */}
        <Modal
          visible={showMap}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMap(false)}
        >
          <View style={styles.mapModalOverlay}>
            <View style={styles.mapModalContainer}>
              <View style={styles.mapModalHeader}>
                <Text style={styles.mapModalTitle}>
                  Carte des joueurs ({joueurs.length})
                </Text>
                <TouchableOpacity onPress={() => setShowMap(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.mapContent}>
                {/* Carte intégrée */}
                {joueurs.some(j => j.club?.latitude && j.club?.longitude) ? (
                  <View style={styles.mapContainer}>
                    {Platform.OS === 'web' ? (
                      // Fallback pour le web : utiliser Google Maps embed
                      <View style={styles.mapWebContainer}>
                        <Text style={styles.mapWebTitle}>Carte des clubs</Text>
                        <Text style={styles.mapWebDescription}>
                          Sur mobile, la carte interactive sera disponible
                        </Text>
                        <TouchableOpacity
                          style={styles.openMapsWebButton}
                          onPress={() => {
                            const firstClub = joueurs.find(j => j.club?.latitude);
                            if (firstClub?.club?.latitude && firstClub.club.longitude) {
                              Linking.openURL(
                                `https://www.google.com/maps?q=${firstClub.club.latitude},${firstClub.club.longitude}`
                              );
                            }
                          }}
                        >
                          <Ionicons name="map" size={18} color="#ffffff" />
                          <Text style={styles.openMapsWebButtonText}>
                            Ouvrir sur Google Maps
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : MapView ? (
                      // Carte native pour iOS et Android
                      <MapView
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                        style={styles.map}
                        initialRegion={{
                          latitude: joueurs.find(j => j.club?.latitude)?.club?.latitude || 48.8566,
                          longitude: joueurs.find(j => j.club?.longitude)?.club?.longitude || 2.3522,
                          latitudeDelta: 0.1,
                          longitudeDelta: 0.1,
                        }}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                      >
                        {joueurs
                          .filter(j => j.club?.latitude && j.club?.longitude)
                          .map((joueur) => (
                            <Marker
                              key={joueur.id}
                              coordinate={{
                                latitude: joueur.club!.latitude!,
                                longitude: joueur.club!.longitude!,
                              }}
                              title={joueur.nom_complet}
                              description={`${joueur.club?.nom} • ${joueur.distance?.toFixed(1)} km`}
                            >
                              <View style={styles.markerContainer}>
                                <View style={styles.markerPin}>
                                  <Ionicons name="person" size={16} color="#ffffff" />
                                </View>
                              </View>
                            </Marker>
                          ))}
                      </MapView>
                    ) : (
                      // Fallback si react-native-maps n'est pas disponible
                      <View style={styles.mapWebContainer}>
                        <Ionicons name="map-outline" size={48} color="#f97316" />
                        <Text style={styles.mapWebTitle}>Carte des clubs</Text>
                        <Text style={styles.mapWebDescription}>
                          La carte interactive est disponible sur iOS et Android
                        </Text>
                        <TouchableOpacity
                          style={styles.openMapsWebButton}
                          onPress={() => {
                            const firstClub = joueurs.find(j => j.club?.latitude);
                            if (firstClub?.club?.latitude && firstClub.club.longitude) {
                              Linking.openURL(
                                `https://www.google.com/maps?q=${firstClub.club.latitude},${firstClub.club.longitude}`
                              );
                            }
                          }}
                        >
                          <Ionicons name="map" size={18} color="#ffffff" />
                          <Text style={styles.openMapsWebButtonText}>
                            Ouvrir sur Google Maps
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.mapPlaceholder}>
                    <Ionicons name="location-outline" size={48} color="#9ca3af" />
                    <Text style={styles.mapPlaceholderText}>
                      Aucune position GPS disponible pour les clubs
                    </Text>
                  </View>
                )}

                {/* Liste des joueurs avec leurs positions */}
                <ScrollView style={styles.mapPlayersList}>
                  {joueurs.map((joueur) => {
                    const clubLat = joueur.club?.latitude;
                    const clubLng = joueur.club?.longitude;
                    const hasLocation = clubLat && clubLng;
                    
                    return (
                      <TouchableOpacity
                        key={joueur.id}
                        style={styles.mapPlayerItem}
                        onPress={() => {
                          if (hasLocation) {
                            // Centrer la carte sur ce joueur
                            // Note: Pour une vraie interaction, il faudrait utiliser une ref sur MapView
                            const url = Platform.select({
                              ios: `maps://maps.apple.com/?q=${clubLat},${clubLng}`,
                              android: `geo:${clubLat},${clubLng}?q=${clubLat},${clubLng}`,
                              default: `https://www.google.com/maps?q=${clubLat},${clubLng}`,
                            });
                            
                            if (url) {
                              Linking.openURL(url).catch(err => {
                                console.error('Erreur ouverture carte:', err);
                                Linking.openURL(`https://www.google.com/maps?q=${clubLat},${clubLng}`);
                              });
                            }
                          }
                        }}
                      >
                        <View style={styles.mapPlayerInfo}>
                          <Text style={styles.mapPlayerName}>{joueur.nom_complet}</Text>
                          <Text style={styles.mapPlayerClub}>
                            {joueur.club?.nom || 'Club non spécifié'}
                            {hasLocation && ` • ${joueur.distance?.toFixed(1)} km`}
                          </Text>
                        </View>
                        {hasLocation ? (
                          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        ) : (
                          <Text style={styles.mapNoLocation}>Pas de position</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
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
  searchTypeContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchTypeScroll: {
    flexDirection: 'row',
  },
  searchTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  searchTypeButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  searchTypeTextActive: {
    color: '#ffffff',
  },
  selectContainer: {
    gap: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  clubScroll: {
    flexDirection: 'row',
  },
  clubButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  clubButtonActive: {
    backgroundColor: '#f97316',
  },
  clubButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  clubButtonTextActive: {
    color: '#ffffff',
  },
  ligueScroll: {
    flexDirection: 'row',
  },
  ligueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  ligueButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  ligueButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  ligueButtonTextActive: {
    color: '#ffffff',
  },
  locationContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  radiusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
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
  mapModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  mapModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mapModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  mapContent: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    width: '100%',
    marginBottom: 16,
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    backgroundColor: '#f97316',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapPlaceholder: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 16,
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  mapWebContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 20,
  },
  mapWebTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  mapWebDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  openMapsWebButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  openMapsWebButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  mapPlayersList: {
    maxHeight: 300,
    padding: 16,
  },
  mapPlayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  mapPlayerInfo: {
    flex: 1,
  },
  mapPlayerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  mapPlayerClub: {
    fontSize: 13,
    color: '#6b7280',
  },
  mapViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f97316',
    gap: 4,
  },
  mapViewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f97316',
  },
  mapNoLocation: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  mapEmbedContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  mapEmbedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  mapEmbedDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  openAllMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  openAllMapsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});