import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { getDefis, updateDefiStatut, getJoueurs } from '@/lib/supabase-rn';
import type { Defi } from '@/lib/supabase-rn';
import TeamScoreModal from '@/components/TeamScoreModal';
import { useFocusEffect } from '@react-navigation/native';

export default function PlayersScreen() {
  const { joueur: currentJoueur, refreshJoueur } = useAuth();
  const [activeTab, setActiveTab] = useState('defis');
  const [defis, setDefis] = useState<Defi[]>([]);
  const [loading, setLoading] = useState(true);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedDefiId, setSelectedDefiId] = useState<number | null>(null);
  const [selectedDefi, setSelectedDefi] = useState<Defi | null>(null);
  const [myRanking, setMyRanking] = useState<number | null>(null);

  useEffect(() => {
    console.log('👤 Players useEffect triggered:', {
      hasJoueur: !!currentJoueur?.id,
      nom: currentJoueur?.nom_complet,
      victoires: currentJoueur?.victoires,
      points: currentJoueur?.points_classement
    });
    if (currentJoueur?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentJoueur?.id, currentJoueur?.victoires, currentJoueur?.points_classement, currentJoueur?.defaites, currentJoueur?.matchs_joues]);

  useEffect(() => {
    if (!currentJoueur?.id) return;

    const { supabase } = require('@/lib/supabase-rn');

    const channel = supabase
      .channel('defis-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'defis',
          filter: `destinataire_id=eq.${currentJoueur.id}`
        },
        (payload: any) => {
          console.log('🔔 Defis updated in real-time:', payload);
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'defis',
          filter: `expediteur_id=eq.${currentJoueur.id}`
        },
        (payload: any) => {
          console.log('🔔 Defis updated in real-time:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentJoueur?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (currentJoueur?.id) {
        loadData();
      }
    }, [currentJoueur?.id])
  );

  const loadData = async () => {
    if (!currentJoueur?.id) {
      console.log('❌ Pas de joueur actuel');
      setLoading(false);
      return;
    }

    console.log('🔄 Début chargement données pour:', currentJoueur.nom_complet);
    setLoading(true);

    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Players loading timeout - forcing loading to false');
      setLoading(false);
    }, 5000);

    try {
      console.log('📡 Appel getDefis...');
      const defisData = await getDefis(currentJoueur.id).catch(err => {
        console.error('Error loading defis:', err);
        return [];
      });
      console.log('✅ Défis reçus:', defisData?.length || 0);

      console.log('📡 Appel getJoueurs...');
      const joueursData = await getJoueurs({}).catch(err => {
        console.error('Error loading joueurs:', err);
        return [];
      });
      console.log('✅ Joueurs reçus:', joueursData?.length || 0);

      const sortedJoueurs = (joueursData || []).sort((a: any, b: any) => b.points_classement - a.points_classement);
      const myPosition = sortedJoueurs.findIndex((j: any) => j.id === currentJoueur.id) + 1;

      setDefis(defisData || []);
      setTopPlayers(sortedJoueurs.slice(0, 10));
      setMyRanking(myPosition > 0 ? myPosition : null);
      console.log('✅ Données chargées avec succès');
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      console.log('✅ Chargement terminé');
    }
  };

  const handleAcceptDefi = async (defiId: number) => {
    console.log('=== BOUTON ACCEPTER CLIQUÉ ===');
    console.log('Défi ID:', defiId);
    console.log('Joueur actuel:', currentJoueur);

    try {
      await updateDefiStatut(defiId, 'accepte');
      console.log('Défi accepté avec succès');
      await loadData();
    } catch (error) {
      console.error('Erreur acceptation défi:', error);
    }
  };

  const handleDeclineDefi = async (defiId: number) => {
    console.log('=== BOUTON DÉCLINER CLIQUÉ ===');
    console.log('Défi ID:', defiId);

    try {
      await updateDefiStatut(defiId, 'refuse');
      console.log('Défi refusé avec succès');
      await loadData();
    } catch (error) {
      console.error('Erreur refus défi:', error);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}j`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Communauté</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'classement' && styles.tabActive]}
            onPress={() => setActiveTab('classement')}
          >
            <Text style={[styles.tabText, activeTab === 'classement' && styles.tabTextActive]}>
              Classement
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'defis' && styles.tabActive]}
            onPress={() => setActiveTab('defis')}
          >
            <Text style={[styles.tabText, activeTab === 'defis' && styles.tabTextActive]}>
              Défis
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : null}

        {activeTab === 'classement' && !loading ? (
          <View style={styles.content}>
            <View style={styles.myPositionCard}>
              <View style={styles.positionHeader}>
                <Ionicons name="trophy" size={20} color="#f97316" />
                <Text style={styles.positionTitle}>Ma Position</Text>
              </View>
              <View style={styles.positionContent}>
                <Text style={styles.myPosition}>#{myRanking || '-'}</Text>
                <Text style={styles.myDivision}>
                  {currentJoueur?.division?.nom?.fr || 'Division'} • {currentJoueur?.points_classement || 0} points
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Top Joueurs</Text>
            {topPlayers.map((player, index) => (
              <View key={player.id} style={styles.playerCard}>
                <View style={styles.positionBadge}>
                  <Text style={[
                    styles.positionText,
                    index < 3 && styles.topThreePosition
                  ]}>
                    #{index + 1}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.nom_complet}</Text>
                  <View style={styles.playerDetails}>
                    <Ionicons name="trophy" size={12} color="#f97316" />
                    <Text style={styles.playerDivision}>{player.division?.nom?.fr || ''}</Text>
                  </View>
                  <View style={styles.playerLocation}>
                    <Ionicons name="location" size={12} color="#6b7280" />
                    <Text style={styles.playerClub}>{player.club?.nom || 'Club'}</Text>
                  </View>
                  <View style={styles.playerStats}>
                    <Text style={styles.playerStatsText}>
                      {player.victoires || 0}V - {player.defaites || 0}D • {player.matchs_joues || 0} matchs
                    </Text>
                  </View>
                </View>
                <View style={styles.playerPoints}>
                  <Text style={styles.pointsValue}>{player.points_classement || 0}</Text>
                  <Text style={styles.pointsLabel}>points</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === 'defis' && !loading ? (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Défis ({defis.length})</Text>

            {defis.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>Aucun défi pour le moment</Text>
              </View>
            ) : null}

            {defis.map((defi) => {
              const isReceived = defi.destinataire_id === currentJoueur?.id;
              const otherPlayer = isReceived ? defi.expediteur : defi.destinataire;

              return (
                <View key={defi.id} style={styles.challengeCard}>
                  <View style={styles.challengeHeader}>
                    <View style={styles.challengeInfo}>
                      <Text style={styles.challengePlayer}>
                        {otherPlayer?.nom_complet || 'Joueur inconnu'}
                      </Text>
                      <Text style={styles.challengeType}>
                        {isReceived ? 'Défi reçu' : 'Défi envoyé'}
                      </Text>
                    </View>
                    <Text style={styles.challengeTime}>{getTimeAgo(defi.created_at)}</Text>
                  </View>

                  {defi.message ? (
                    <Text style={styles.challengeMessage}>{defi.message}</Text>
                  ) : null}

                  {defi.statut === 'en_attente' && isReceived ? (
                    <View style={styles.challengeActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptDefi(defi.id)}
                      >
                        <Text style={styles.acceptButtonText}>Accepter</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => handleDeclineDefi(defi.id)}
                      >
                        <Text style={styles.declineButtonText}>Décliner</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {defi.statut === 'accepte' ? (
                    <>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusAccepted}>✓ Accepté</Text>
                      </View>

                      {defi.equipe1_joueur1_id && defi.equipe1_joueur2_id &&
                       defi.equipe2_joueur1_id && defi.equipe2_joueur2_id ? (
                        <View style={styles.teamsContainer}>
                          <View style={styles.team}>
                            <Text style={styles.teamTitle}>Équipe 1</Text>
                            <Text style={styles.teamPlayer}>
                              {defi.equipe1_joueur1?.nom_complet || 'Joueur 1'}
                            </Text>
                            <Text style={styles.teamPlayer}>
                              {defi.equipe1_joueur2?.nom_complet || 'Joueur 2'}
                            </Text>
                            {defi.score_equipe1 !== undefined && (
                              <Text style={styles.teamScore}>{defi.score_equipe1}</Text>
                            )}
                          </View>
                          <View style={styles.teamSeparator}>
                            <Text style={styles.teamVs}>VS</Text>
                          </View>
                          <View style={styles.team}>
                            <Text style={styles.teamTitle}>Équipe 2</Text>
                            <Text style={styles.teamPlayer}>
                              {defi.equipe2_joueur1?.nom_complet || 'Joueur 1'}
                            </Text>
                            <Text style={styles.teamPlayer}>
                              {defi.equipe2_joueur2?.nom_complet || 'Joueur 2'}
                            </Text>
                            {defi.score_equipe2 !== undefined && (
                              <Text style={styles.teamScore}>{defi.score_equipe2}</Text>
                            )}
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.configureButton}
                          onPress={() => {
                            setSelectedDefiId(defi.id);
                            setSelectedDefi(defi);
                            setShowTeamModal(true);
                          }}
                        >
                          <Ionicons name="people" size={20} color="#ffffff" />
                          <Text style={styles.configureButtonText}>
                            Configurer le match
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : null}

                  {defi.statut === 'refuse' ? (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusDeclined}>✗ Décliné</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {selectedDefiId && selectedDefi && (
        <TeamScoreModal
          visible={showTeamModal}
          defiId={selectedDefiId}
          expediteurId={selectedDefi.expediteur_id}
          destinataireId={selectedDefi.destinataire_id}
          onClose={() => {
            setShowTeamModal(false);
            setSelectedDefiId(null);
            setSelectedDefi(null);
          }}
          onSave={async () => {
            console.log('💾 Match saved, starting refresh...');
            setShowTeamModal(false);
            setSelectedDefiId(null);
            setSelectedDefi(null);
            console.log('⏳ Waiting for database trigger to complete...');
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('⏳ Calling refreshJoueur...');
            await refreshJoueur();
            console.log('✅ refreshJoueur completed');
            console.log('⏳ Calling loadData...');
            await loadData();
            console.log('✅ loadData completed');
          }}
        />
      )}
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  myPositionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  positionContent: {
    alignItems: 'center',
  },
  myPosition: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f97316',
    marginBottom: 4,
  },
  myDivision: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 20,
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
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  positionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  topThreePosition: {
    color: '#f59e0b',
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
    marginBottom: 2,
  },
  playerDivision: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f97316',
    marginLeft: 4,
  },
  playerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerClub: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  playerStats: {
    marginTop: 4,
  },
  playerStatsText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  playerPoints: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  challengeCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  challengeInfo: {
    flex: 1,
  },
  challengePlayer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  challengeType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  challengeTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  challengeMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  challengeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acceptButton: {
    backgroundColor: '#10b981',
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#ef4444',
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  declineButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    alignItems: 'center',
    paddingTop: 8,
  },
  statusAccepted: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  statusDeclined: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9ca3af',
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  configureButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  teamsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  teamPlayer: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  teamScore: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f97316',
    marginTop: 8,
  },
  teamSeparator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamVs: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
  },
});
