import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { getPlayerLigues, getLigues, getLeagueStats, getPlayerPerformanceHistory } from '@/lib/supabase-rn';
import { useRouter } from 'expo-router';

// Import conditionnel de react-native-chart-kit (ne fonctionne pas sur le web)
let LineChart: any = null;
if (Platform.OS !== 'web') {
  try {
    const chartKit = require('react-native-chart-kit');
    LineChart = chartKit.LineChart;
  } catch (error) {
    console.warn('react-native-chart-kit not available:', error);
  }
}

// Composant scatter plot XY (victoires vs matchs par semaine)
const ScatterPlotChart = ({ data, width, height }: { data: any[]; width: number; height: number }) => {
  if (data.length === 0) return null;

  const maxVictories = Math.max(...data.map(d => d.victories), 1);
  const maxMatches = Math.max(...data.map(d => d.matches), 1);

  const chartHeight = height - 80;
  const chartWidth = width - 80;

  return (
    <View style={styles.simpleChartContainer}>
      <View style={styles.simpleChart}>
        <Text style={styles.chartSubtitle}>Victoires vs Matchs joués (par semaine)</Text>
        <View style={styles.chartArea}>
          {/* Lignes de grille */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <View
              key={`h-${i}`}
              style={[
                styles.gridLine,
                {
                  top: ratio * chartHeight,
                }
              ]}
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.gridLineVertical,
                {
                  left: 40 + ratio * chartWidth,
                }
              ]}
            />
          ))}

          {/* Points du scatter plot */}
          {data.map((d, i) => {
            const x = 40 + (d.matches / maxMatches) * chartWidth;
            const y = chartHeight - (d.victories / maxVictories) * chartHeight;
            return (
              <View
                key={i}
                style={[
                  styles.scatterPoint,
                  {
                    left: x - 6,
                    top: y - 6,
                  }
                ]}
              >
                <View style={styles.scatterPointInner} />
              </View>
            );
          })}

          {/* Labels Y (victoires) */}
          <View style={styles.yLabels}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Text key={i} style={[styles.yLabel, { top: ratio * chartHeight - 8 }]}>
                {Math.round(maxVictories * (1 - ratio))}
              </Text>
            ))}
          </View>

          {/* Labels X (matchs) */}
          <View style={styles.xLabels}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Text key={i} style={[styles.xLabel, { left: 40 + ratio * chartWidth - 15 }]}>
                {Math.round(maxMatches * ratio)}
              </Text>
            ))}
          </View>

          {/* Labels des axes */}
          <Text style={styles.yAxisLabel}>Victoires</Text>
          <Text style={styles.xAxisLabel}>Matchs joués</Text>
        </View>
      </View>
    </View>
  );
};

// Composant graphique d'évolution des points
const PointsEvolutionChart = ({ data, width, height }: { data: any[]; width: number; height: number }) => {
  if (data.length === 0) return null;

  const minPoints = Math.min(...data.map(d => d.points));
  const maxPoints = Math.max(...data.map(d => d.points));
  const range = maxPoints - minPoints || 1;

  const chartHeight = height - 80;
  const chartWidth = width - 80;
  const pointSpacing = chartWidth / (data.length - 1 || 1);

  return (
    <View style={styles.simpleChartContainer}>
      <View style={styles.simpleChart}>
        <Text style={styles.chartSubtitle}>Évolution des points ELO</Text>
        <View style={styles.chartArea}>
          {/* Lignes de grille horizontales */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <View
              key={i}
              style={[
                styles.gridLine,
                {
                  top: ratio * chartHeight,
                }
              ]}
            />
          ))}

          {/* Points et lignes */}
          {data.map((d, i) => {
            const x = 40 + i * pointSpacing;
            const y = chartHeight - ((d.points - minPoints) / range) * chartHeight;
            
            return (
              <React.Fragment key={i}>
                {/* Point */}
                <View
                  style={[
                    styles.pointMarker,
                    {
                      left: x - 4,
                      top: y - 4,
                    }
                  ]}
                />
                {/* Ligne vers le point suivant */}
                {i < data.length - 1 && (
                  <View
                    style={[
                      styles.lineConnector,
                      {
                        left: x + 4,
                        top: y,
                        width: pointSpacing - 8,
                        height: 2,
                        backgroundColor: '#f97316',
                      }
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
          
          {/* Lignes diagonales entre points (approximation) */}
          {data.map((d, i) => {
            if (i === 0) return null;
            const x1 = 40 + (i - 1) * pointSpacing;
            const y1 = chartHeight - ((data[i - 1].points - minPoints) / range) * chartHeight;
            const x2 = 40 + i * pointSpacing;
            const y2 = chartHeight - ((d.points - minPoints) / range) * chartHeight;
            
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            return (
              <View
                key={`line-${i}`}
                style={[
                  styles.lineSegment,
                  {
                    left: x1 + 4,
                    top: y1,
                    width: length - 8,
                    height: 2,
                    transform: [{ rotate: `${angle}deg` }],
                  }
                ]}
              />
            );
          })}

          {/* Labels Y (points) */}
          <View style={styles.yLabels}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Text key={i} style={[styles.yLabel, { top: ratio * chartHeight - 8 }]}>
                {Math.round(minPoints + range * (1 - ratio))}
              </Text>
            ))}
          </View>

          {/* Labels X (dates) */}
          <View style={styles.xLabels}>
            {data.map((d, i) => {
              if (data.length <= 5 || i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) {
                return (
                  <Text key={i} style={[styles.xLabel, { left: 40 + i * pointSpacing - 20 }]}>
                    {d.date.substring(5)}
                  </Text>
                );
              }
              return null;
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

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
  const [performanceHistory, setPerformanceHistory] = useState<{ weekly: any[]; points: any[] }>({ weekly: [], points: [] });
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;

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

      const history = await getPlayerPerformanceHistory(joueur!.id).catch(err => {
        console.error('Error loading performance history:', err);
        return { weekly: [], points: [] };
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
      setPerformanceHistory(history);
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

            {/* Performance Charts */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Évolution des performances</Text>
              
              {/* Scatter Plot XY : Victoires vs Matchs par semaine */}
              {performanceHistory.weekly.length > 0 ? (
                <View style={styles.chartWrapper}>
                  {LineChart && Platform.OS !== 'web' ? (
                    // Graphique natif scatter pour iOS/Android (si disponible)
                    <View style={styles.chartPlaceholder}>
                      <Text style={styles.chartPlaceholderText}>Graphique XY disponible sur web</Text>
                    </View>
                  ) : (
                    <ScatterPlotChart 
                      data={performanceHistory.weekly} 
                      width={screenWidth - 88} 
                      height={220} 
                    />
                  )}
                </View>
              ) : (
                <View style={styles.chartPlaceholder}>
                  <Ionicons name="trending-up-outline" size={48} color="#9ca3af" />
                  <Text style={styles.chartPlaceholderText}>
                    Aucune donnée hebdomadaire disponible
                  </Text>
                </View>
              )}

              {/* Graphique d'évolution des points */}
              {performanceHistory.points.length > 0 ? (
                <View style={[styles.chartWrapper, { marginTop: 24 }]}>
                  {LineChart && Platform.OS !== 'web' ? (
                    // Graphique natif pour iOS/Android
                    <LineChart
                      data={{
                        labels: performanceHistory.points.map((h, i) => {
                          if (performanceHistory.points.length <= 5) return h.date.substring(5);
                          if (i === 0 || i === Math.floor(performanceHistory.points.length / 2) || i === performanceHistory.points.length - 1) {
                            return h.date.substring(5);
                          }
                          return '';
                        }),
                        datasets: [
                          {
                            data: performanceHistory.points.map(h => h.points),
                            color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                            strokeWidth: 2
                          }
                        ],
                        legend: ['Points ELO']
                      }}
                      width={screenWidth - 88}
                      height={220}
                      chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(111, 111, 111, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                        style: {
                          borderRadius: 16
                        },
                        propsForDots: {
                          r: '4',
                          strokeWidth: '2',
                          stroke: '#f97316'
                        },
                        propsForBackgroundLines: {
                          strokeDasharray: '',
                          stroke: '#e5e7eb',
                          strokeWidth: 1
                        }
                      }}
                      bezier
                      style={styles.chart}
                      withInnerLines={true}
                      withOuterLines={false}
                      withVerticalLabels={true}
                      withHorizontalLabels={true}
                      withDots={true}
                      withShadow={false}
                    />
                  ) : (
                    <PointsEvolutionChart 
                      data={performanceHistory.points} 
                      width={screenWidth - 88} 
                      height={220} 
                    />
                  )}
                </View>
              ) : (
                <View style={[styles.chartPlaceholder, { marginTop: 24 }]}>
                  <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
                  <Text style={styles.chartPlaceholderText}>
                    Aucune donnée de points disponible
                  </Text>
                  <Text style={styles.chartPlaceholderSubtext}>
                    Jouez des matchs pour voir l'évolution de vos points
                  </Text>
                </View>
              )}
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
  chartWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  chartPlaceholderText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  chartPlaceholderSubtext: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  simpleChartContainer: {
    width: '100%',
    alignItems: 'center',
  },
  simpleChart: {
    width: '100%',
    height: 220,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  chartArea: {
    height: 140,
    position: 'relative',
    marginBottom: 40,
  },
  gridLine: {
    position: 'absolute',
    left: 40,
    right: 0,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 40,
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  scatterPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  scatterPointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    alignSelf: 'center',
    marginTop: 1,
  },
  pointMarker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  lineSegment: {
    position: 'absolute',
    backgroundColor: '#f97316',
    height: 2,
    transformOrigin: '0 0',
  },
  lineConnector: {
    position: 'absolute',
  },
  yLabels: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 140,
    width: 40,
  },
  yLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
    width: 40,
  },
  xLabels: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 0,
    height: 40,
  },
  xLabel: {
    position: 'absolute',
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    width: 40,
  },
  yAxisLabel: {
    position: 'absolute',
    left: 0,
    top: 60,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    transform: [{ rotate: '-90deg' }],
  },
  xAxisLabel: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    marginLeft: -50,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    width: 100,
    textAlign: 'center',
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