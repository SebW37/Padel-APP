import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { getPlayerLigues, getLigues, getLeagueStats } from '@/lib/supabase-rn';
import { useRouter } from 'expo-router';

export default function LeaguesScreen() {
  const { joueur } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('mes-ligues');
  const [myLeagues, setMyLeagues] = useState<any[]>([]);
  const [availableLeagues, setAvailableLeagues] = useState<any[]>([]);
  const [leagueStats, setLeagueStats] = useState({
    totalWins: 0,
    totalMatches: 0,
    winRate: 0,
    bestPosition: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (joueur?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [joueur?.id]);

  React.useEffect(() => {
    if (!joueur?.id) return;

    const { supabase } = require('@/lib/supabase-rn');

    const channel = supabase
      .channel('ligues-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ligues_joueurs',
          filter: `joueur_id=eq.${joueur.id}`
        },
        (payload: any) => {
          console.log('🔔 Ligues updated in real-time:', payload);
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ligues'
        },
        (payload: any) => {
          console.log('🔔 Ligues list updated in real-time:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [joueur?.id]);

  const loadData = async () => {
    setLoading(true);

    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Leagues loading timeout - forcing loading to false');
      setLoading(false);
    }, 5000);

    try {
      const playerLigues = await getPlayerLigues(joueur!.id).catch(err => {
        console.error('Error loading player leagues:', err);
        return [];
      });

      const allLigues = await getLigues().catch(err => {
        console.error('Error loading all leagues:', err);
        return [];
      });

      const stats = await getLeagueStats(joueur!.id).catch(err => {
        console.error('Error loading league stats:', err);
        return {
          totalWins: 0,
          totalMatches: 0,
          winRate: 0,
          bestPosition: 0,
          totalPoints: 0
        };
      });

      const formattedMyLeagues = playerLigues?.map((pl: any) => ({
        id: pl.ligue.id,
        name: pl.ligue.nom,
        players: pl.ligue.nombre_joueurs,
        position: pl.position || 0,
        matches: pl.matchs_joues || 0,
        points: pl.points || 0,
        status: pl.ligue.statut,
        format: pl.ligue.format,
      })) || [];

      const myLeagueIds = formattedMyLeagues.map((l: any) => l.id);
      const formattedAvailableLeagues = allLigues
        ?.filter((ligue: any) => !myLeagueIds.includes(ligue.id) && ligue.statut === 'active')
        .map((ligue: any) => ({
          id: ligue.id,
          name: ligue.nom,
          players: ligue.nombre_joueurs,
          format: ligue.format,
          description: ligue.description,
          status: ligue.statut,
        })) || [];

      setMyLeagues(formattedMyLeagues);
      setAvailableLeagues(formattedAvailableLeagues);
      setLeagueStats(stats);
    } catch (error) {
      console.error('❌ Erreur chargement ligues:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mes Ligues</Text>
          <TouchableOpacity style={styles.createButton}>
            <Ionicons name="add" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mes-ligues' && styles.tabActive]}
            onPress={() => setActiveTab('mes-ligues')}
          >
            <Text style={[styles.tabText, activeTab === 'mes-ligues' && styles.tabTextActive]}>
              Mes Ligues
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'statistiques' && styles.tabActive]}
            onPress={() => setActiveTab('statistiques')}
          >
            <Text style={[styles.tabText, activeTab === 'statistiques' && styles.tabTextActive]}>
              Statistiques
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'disponibles' && styles.tabActive]}
            onPress={() => setActiveTab('disponibles')}
          >
            <Text style={[styles.tabText, activeTab === 'disponibles' && styles.tabTextActive]}>
              Disponibles
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'mes-ligues' && (
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
            ) : (
              <>
                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="trophy" size={20} color="#f59e0b" />
                    <Text style={styles.statNumber}>{myLeagues.filter(l => l.status === 'active').length}</Text>
                    <Text style={styles.statLabel}>Ligues actives</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="medal" size={20} color="#10b981" />
                    <Text style={styles.statNumber}>{leagueStats.bestPosition || '-'}</Text>
                    <Text style={styles.statLabel}>Meilleure place</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="analytics" size={20} color="#3b82f6" />
                    <Text style={styles.statNumber}>{leagueStats.winRate}%</Text>
                    <Text style={styles.statLabel}>Taux victoire</Text>
                  </View>
                </View>

                {/* Leagues List */}
                <View style={styles.leaguesContainer}>
                  {myLeagues.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
                      <Text style={styles.emptyText}>Aucune ligue pour le moment</Text>
                    </View>
                  ) : (
                    myLeagues.map((league) => (
                <TouchableOpacity
                  key={league.id}
                  style={styles.leagueCard}
                  onPress={() => router.push({
                    pathname: '/(tabs)/league-details',
                    params: { id: league.id, name: league.name }
                  })}
                >
                  <View style={styles.leagueHeader}>
                    <View style={styles.leagueInfo}>
                      <View style={styles.leagueNameRow}>
                        <Text style={styles.leagueName}>{league.name}</Text>
                        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                      </View>
                      <View style={styles.leagueDetails}>
                        <Ionicons name="people" size={14} color="#6b7280" />
                        <Text style={styles.leagueDetailText}>{league.players} joueurs</Text>
                        <Text style={styles.leagueFormat}>• {league.format}</Text>
                      </View>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      league.status === 'active' ? styles.statusActive : styles.statusCompleted
                    ]}>
                      <Text style={[
                        styles.statusText,
                        league.status === 'active' ? styles.statusTextActive : styles.statusTextCompleted
                      ]}>
                        {league.status === 'active' ? 'En cours' : 'Terminée'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.leagueStats}>
                    <View style={styles.positionContainer}>
                      <Text style={styles.positionLabel}>Position</Text>
                      <Text style={[
                        styles.positionNumber,
                        league.position === 1 && styles.positionWinner
                      ]}>
                        #{league.position}
                      </Text>
                    </View>
                    <View style={styles.matchesContainer}>
                      <Text style={styles.matchesNumber}>{league.matches}</Text>
                      <Text style={styles.matchesLabel}>matchs</Text>
                    </View>
                    <View style={styles.pointsContainer}>
                      <Text style={styles.pointsNumber}>{league.points}</Text>
                      <Text style={styles.pointsLabel}>points</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'statistiques' && (
          <View style={styles.content}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={24} color="#10b981" />
                <Text style={styles.statCardNumber}>{leagueStats.totalWins}</Text>
                <Text style={styles.statCardLabel}>Victoires totales</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="analytics" size={24} color="#f97316" />
                <Text style={styles.statCardNumber}>{leagueStats.winRate}%</Text>
                <Text style={styles.statCardLabel}>Taux de victoire</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="medal" size={24} color="#f59e0b" />
                <Text style={styles.statCardNumber}>#{leagueStats.bestPosition}</Text>
                <Text style={styles.statCardLabel}>Meilleure position</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color="#8b5cf6" />
                <Text style={styles.statCardNumber}>{leagueStats.totalPoints}</Text>
                <Text style={styles.statCardLabel}>Points totaux</Text>
              </View>
            </View>

            {/* Performance Chart Placeholder */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Évolution des performances</Text>
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderText}>Graphique d'évolution</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'disponibles' && (
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
            ) : (
              <>
                <Text style={styles.availableTitle}>Ligues disponibles à rejoindre</Text>
                {availableLeagues.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>Aucune ligue disponible</Text>
                  </View>
                ) : (
                  availableLeagues.map((league) => (
                    <TouchableOpacity key={league.id} style={styles.availableLeague}>
                      <View style={styles.availableInfo}>
                        <Text style={styles.availableName}>{league.name}</Text>
                        <Text style={styles.availableDetails}>
                          {league.players} joueurs • Format {league.format === 'americano' ? 'Americano' : 'Paires fixes'}
                        </Text>
                        {league.description ? (
                          <Text style={styles.availableClub}>{league.description}</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity style={styles.joinButton}>
                        <Text style={styles.joinButtonText}>Rejoindre</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  createButton: {
    backgroundColor: '#f97316',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
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
    paddingHorizontal: 24,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  leaguesContainer: {
    marginBottom: 24,
  },
  leagueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  leagueDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueDetailText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  leagueFormat: {
    fontSize: 13,
    color: '#9ca3af',
    marginLeft: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusCompleted: {
    backgroundColor: '#e0e7ff',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextCompleted: {
    color: '#4338ca',
  },
  leagueStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  positionContainer: {
    alignItems: 'center',
  },
  positionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  positionNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  positionWinner: {
    color: '#f59e0b',
  },
  matchesContainer: {
    alignItems: 'center',
  },
  matchesNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  matchesLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  pointsContainer: {
    alignItems: 'center',
  },
  pointsNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f97316',
    marginBottom: 2,
  },
  pointsLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholderText: {
    color: '#6b7280',
    fontSize: 14,
  },
  availableTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  availableLeague: {
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
  availableInfo: {
    flex: 1,
  },
  availableName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  availableDetails: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  availableClub: {
    fontSize: 13,
    color: '#9ca3af',
  },
  joinButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});