import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase-rn';
import { useAuth } from '@/hooks/useAuth';

interface LeaguePlayer {
  id: number;
  joueur_id: string;
  position: number;
  points: number;
  matchs_joues: number;
  victoires: number;
  defaites: number;
  joueur: {
    nom_complet: string;
    points_classement: number;
    division_id: number;
  };
}

interface LeagueMatch {
  id: number;
  date_match: string;
  score: string;
  equipe1_gagnante: boolean;
  joueur1: { nom_complet: string };
  joueur2: { nom_complet: string };
  joueur3: { nom_complet: string };
  joueur4: { nom_complet: string };
}

export default function LeagueDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { joueur } = useAuth();
  const leagueId = params.id;
  const leagueName = params.name || 'Ligue';

  const [activeTab, setActiveTab] = useState('classement');
  const [league, setLeague] = useState<any>(null);
  const [players, setPlayers] = useState<LeaguePlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<LeaguePlayer[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'winrate' | 'matches'>('points');

  useEffect(() => {
    if (leagueId) {
      loadLeagueDetails();
    }
  }, [leagueId]);

  useEffect(() => {
    filterAndSortPlayers();
  }, [searchQuery, sortBy, players]);

  const filterAndSortPlayers = () => {
    let filtered = [...players];

    if (searchQuery.trim()) {
      filtered = filtered.filter(player =>
        player.joueur.nom_complet.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'winrate':
          const winRateA = a.matchs_joues > 0 ? (a.victoires / a.matchs_joues) * 100 : 0;
          const winRateB = b.matchs_joues > 0 ? (b.victoires / b.matchs_joues) * 100 : 0;
          return winRateB - winRateA;
        case 'matches':
          return b.matchs_joues - a.matchs_joues;
        case 'points':
        default:
          return b.points - a.points;
      }
    });

    const reranked = filtered.map((player, index) => ({
      ...player,
      position: index + 1
    }));

    setFilteredPlayers(reranked);
  };

  useEffect(() => {
    if (!leagueId) return;

    const channel = supabase
      .channel(`league-${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ligues_joueurs',
          filter: `ligue_id=eq.${leagueId}`
        },
        () => {
          console.log('🔔 League rankings updated');
          loadLeagueDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  const loadLeagueDetails = async () => {
    setLoading(true);
    try {
      const { data: leagueData, error: leagueError } = await supabase
        .from('ligues')
        .select('*')
        .eq('id', leagueId)
        .maybeSingle();

      if (leagueError) throw leagueError;
      setLeague(leagueData);

      const { data: playersData, error: playersError } = await supabase
        .from('ligues_joueurs')
        .select(`
          *,
          joueur:joueurs(nom_complet, points_classement, division_id)
        `)
        .eq('ligue_id', leagueId)
        .order('points', { ascending: false });

      if (playersError) throw playersError;

      const rankedPlayers = playersData.map((player, index) => ({
        ...player,
        position: index + 1
      }));

      setPlayers(rankedPlayers);
      setFilteredPlayers(rankedPlayers);

      if (leagueData?.joueurs_ids?.length > 0) {
        const { data: matchesData, error: matchesError } = await supabase
          .from('matchs')
          .select(`
            id,
            date_match,
            score,
            equipe1_gagnante,
            joueur1:joueur1_id(nom_complet),
            joueur2:joueur2_id(nom_complet),
            joueur3:joueur3_id(nom_complet),
            joueur4:joueur4_id(nom_complet)
          `)
          .in('joueur1_id', leagueData.joueurs_ids)
          .in('joueur2_id', leagueData.joueurs_ids)
          .in('joueur3_id', leagueData.joueurs_ids)
          .in('joueur4_id', leagueData.joueurs_ids)
          .eq('statut', 'valide')
          .order('date_match', { ascending: false })
          .limit(20);

        if (!matchesError && matchesData) {
          setMatches(matchesData as any);
        }
      }
    } catch (error) {
      console.error('Error loading league details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return '#f59e0b';
    if (position === 2) return '#9ca3af';
    if (position === 3) return '#cd7f32';
    return '#6b7280';
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return 'trophy';
    if (position === 2) return 'medal';
    if (position === 3) return 'medal-outline';
    return 'flag-outline';
  };

  const getDivisionColor = (divisionId: number) => {
    if (divisionId <= 3) return '#ef4444';
    if (divisionId <= 6) return '#f59e0b';
    if (divisionId <= 9) return '#10b981';
    if (divisionId <= 12) return '#3b82f6';
    return '#8b5cf6';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>{leagueName}</Text>
          {league && (
            <View style={styles.headerInfo}>
              <Ionicons name="people" size={14} color="#6b7280" />
              <Text style={styles.headerInfoText}>{league.nombre_joueurs} joueurs</Text>
              <Text style={styles.headerDivider}>•</Text>
              <Text style={styles.headerInfoText}>
                {league.format === 'americano' ? 'Americano' : 'Paires fixes'}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={20} color="#f97316" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'classement' && styles.tabActive]}
          onPress={() => setActiveTab('classement')}
        >
          <Ionicons
            name="podium"
            size={18}
            color={activeTab === 'classement' ? '#ffffff' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'classement' && styles.tabTextActive]}>
            Classement
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resultats' && styles.tabActive]}
          onPress={() => setActiveTab('resultats')}
        >
          <Ionicons
            name="list"
            size={18}
            color={activeTab === 'resultats' ? '#ffffff' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'resultats' && styles.tabTextActive]}>
            Résultats
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'classement' && (
              <View style={styles.content}>
                <View style={styles.searchContainer}>
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#9ca3af" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Rechercher un joueur..."
                      placeholderTextColor="#9ca3af"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.sortContainer}
                  >
                    <TouchableOpacity
                      style={[styles.sortButton, sortBy === 'points' && styles.sortButtonActive]}
                      onPress={() => setSortBy('points')}
                    >
                      <Ionicons
                        name="trophy"
                        size={14}
                        color={sortBy === 'points' ? '#ffffff' : '#6b7280'}
                      />
                      <Text style={[styles.sortText, sortBy === 'points' && styles.sortTextActive]}>
                        Points
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sortButton, sortBy === 'winrate' && styles.sortButtonActive]}
                      onPress={() => setSortBy('winrate')}
                    >
                      <Ionicons
                        name="trending-up"
                        size={14}
                        color={sortBy === 'winrate' ? '#ffffff' : '#6b7280'}
                      />
                      <Text style={[styles.sortText, sortBy === 'winrate' && styles.sortTextActive]}>
                        Taux victoire
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sortButton, sortBy === 'matches' && styles.sortButtonActive]}
                      onPress={() => setSortBy('matches')}
                    >
                      <Ionicons
                        name="tennisball"
                        size={14}
                        color={sortBy === 'matches' ? '#ffffff' : '#6b7280'}
                      />
                      <Text style={[styles.sortText, sortBy === 'matches' && styles.sortTextActive]}>
                        Matchs joués
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {filteredPlayers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name={searchQuery ? "search-outline" : "people-outline"} size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>
                      {searchQuery ? 'Aucun joueur trouvé' : 'Aucun joueur dans cette ligue'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.rankingContainer}>
                    <Text style={styles.resultsCount}>
                      {filteredPlayers.length} joueur{filteredPlayers.length > 1 ? 's' : ''}
                    </Text>
                    {filteredPlayers.map((player, index) => {
                      const isCurrentPlayer = player.joueur_id === joueur?.id;
                      return (
                        <View
                          key={player.id}
                          style={[
                            styles.playerCard,
                            isCurrentPlayer && styles.playerCardHighlight
                          ]}
                        >
                          <View style={styles.playerRank}>
                            <Ionicons
                              name={getPositionIcon(player.position)}
                              size={20}
                              color={getPositionColor(player.position)}
                            />
                            <Text style={[
                              styles.rankNumber,
                              { color: getPositionColor(player.position) }
                            ]}>
                              {player.position}
                            </Text>
                          </View>

                          <View style={styles.playerInfo}>
                            <View style={styles.playerNameRow}>
                              <Text style={styles.playerName}>
                                {player.joueur.nom_complet}
                              </Text>
                              {isCurrentPlayer && (
                                <View style={styles.youBadge}>
                                  <Text style={styles.youBadgeText}>Vous</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.playerDivision}>
                              <View style={[styles.divisionBadge, { backgroundColor: getDivisionColor(player.joueur.division_id) }]}>
                                <Text style={styles.divisionText}>D{player.joueur.division_id}</Text>
                              </View>
                              <Text style={styles.playerRating}>
                                {player.joueur.points_classement} pts ELO
                              </Text>
                            </View>
                          </View>

                          <View style={styles.playerStats}>
                            <View style={styles.statColumn}>
                              <Text style={styles.statValue}>{player.points}</Text>
                              <Text style={styles.statLabel}>Points</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statColumn}>
                              <Text style={styles.statValue}>{player.victoires}</Text>
                              <Text style={styles.statLabel}>V</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statColumn}>
                              <Text style={styles.statValue}>{player.defaites}</Text>
                              <Text style={styles.statLabel}>D</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'resultats' && (
              <View style={styles.content}>
                {matches.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="tennisball-outline" size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>Aucun match joué</Text>
                  </View>
                ) : (
                  <View style={styles.matchesContainer}>
                    <Text style={styles.sectionTitle}>Derniers matchs</Text>
                    {matches.map((match) => (
                      <View key={match.id} style={styles.matchCard}>
                        <View style={styles.matchHeader}>
                          <Text style={styles.matchDate}>{formatDate(match.date_match)}</Text>
                          <View style={styles.matchScore}>
                            <Text style={styles.matchScoreText}>{match.score}</Text>
                          </View>
                        </View>

                        <View style={styles.teamsContainer}>
                          <View style={[
                            styles.teamSection,
                            match.equipe1_gagnante && styles.teamWinner
                          ]}>
                            {match.equipe1_gagnante && (
                              <Ionicons name="trophy" size={14} color="#f59e0b" style={styles.winnerIcon} />
                            )}
                            <Text style={styles.teamLabel}>Équipe 1</Text>
                            <Text style={styles.playerNameSmall}>{match.joueur1.nom_complet}</Text>
                            <Text style={styles.playerNameSmall}>{match.joueur2.nom_complet}</Text>
                          </View>

                          <View style={styles.vs}>
                            <Text style={styles.vsText}>VS</Text>
                          </View>

                          <View style={[
                            styles.teamSection,
                            !match.equipe1_gagnante && styles.teamWinner
                          ]}>
                            {!match.equipe1_gagnante && (
                              <Ionicons name="trophy" size={14} color="#f59e0b" style={styles.winnerIcon} />
                            )}
                            <Text style={styles.teamLabel}>Équipe 2</Text>
                            <Text style={styles.playerNameSmall}>{match.joueur3.nom_complet}</Text>
                            <Text style={styles.playerNameSmall}>{match.joueur4.nom_complet}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  headerDivider: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  shareButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#f97316',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sortButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  sortTextActive: {
    color: '#ffffff',
  },
  rankingContainer: {
    gap: 12,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    paddingLeft: 4,
  },
  playerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  playerCardHighlight: {
    borderWidth: 2,
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  playerRank: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  youBadge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  playerDivision: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerRating: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  divisionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  divisionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statColumn: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  matchesContainer: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  matchDate: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  matchScore: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamSection: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  teamWinner: {
    backgroundColor: '#fef3c7',
  },
  teamLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  playerNameSmall: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 2,
  },
  vs: {
    backgroundColor: '#f3f4f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
  },
  winnerIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    fontWeight: '500',
  },
});
