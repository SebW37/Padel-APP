import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured, getPlayerStats, getRecentActivity, getPlayerRankingInAllDivisions, getPlayerRankingGlobal, getPlayerRankingInClub } from '@/lib/supabase-rn';
import { useFocusEffect } from '@react-navigation/native';

// Mock division data for when Supabase is not configured
const MOCK_DIVISION = {
  id: 6,
  nom: { fr: 'Court Warrior', en: 'Court Warrior', es: 'Guerrero de la Cancha', it: 'Guerriero del Campo' },
  description: { fr: 'Division intermédiaire', en: 'Intermediate division', es: 'División intermedia', it: 'Divisione intermedia' },
  niveau: 6,
  points_minimum: 1200,
  points_maximum: 1699,
  created_at: '2024-01-01',
  updated_at: '2024-01-01'
};

type Division = {
  id: number;
  nom: { [key: string]: string };
  description: { [key: string]: string };
  niveau: number;
  points_minimum: number;
  points_maximum: number;
  created_at: string;
  updated_at: string;
};

export default function HomeScreen() {
  const { joueur, refreshJoueur } = useAuth();
  const [division, setDivision] = React.useState<Division | null>(MOCK_DIVISION);
  const [stats, setStats] = React.useState({ victoires: 12, defisActifs: 8, ligues: 3 });
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ranking, setRanking] = React.useState<{ position: number; total: number } | null>(null);
  const [divisionRankings, setDivisionRankings] = React.useState<any[]>([]);
  const [globalRanking, setGlobalRanking] = React.useState<{ position: number; total: number } | null>(null);
  const [clubRanking, setClubRanking] = React.useState<{ position: number; total: number; club_id: number } | null>(null);

  React.useEffect(() => {
    console.log('🏠 Home useEffect triggered:', {
      hasJoueur: !!joueur?.id,
      nom: joueur?.nom_complet,
      victoires: joueur?.victoires,
      points: joueur?.points_classement
    });
    if (joueur?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [joueur?.id, joueur?.victoires, joueur?.points_classement]);

  React.useEffect(() => {
    if (!joueur?.id) return;

    const { supabase } = require('@/lib/supabase-rn');

    const channel = supabase
      .channel('joueur-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'joueurs',
          filter: `id=eq.${joueur.id}`
        },
        (payload: any) => {
          console.log('🔔 Joueur updated in real-time:', payload.new);
          refreshJoueur();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [joueur?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (joueur?.id) {
        console.log('🔄 Home screen focused, refreshing data...');
        refreshJoueur();
      }
    }, [joueur?.id])
  );

  const loadData = async () => {
    if (!joueur?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Loading timeout - forcing loading to false');
      setLoading(false);
    }, 5000);

    try {
      if (isSupabaseConfigured()) {
        console.log('📊 Loading division...');
        await loadDivision();

        console.log('📊 Loading stats...');
        const statsData = await getPlayerStats(joueur.id).catch(err => {
          console.error('Error loading stats:', err);
          return { victoires: 0, defisActifs: 0, ligues: 0 };
        });

        console.log('📊 Loading activity...');
        const activityData = await getRecentActivity(joueur.id).catch(err => {
          console.error('Error loading activity:', err);
          return { matches: [], defis: [] };
        });

        console.log('📊 Loading ranking...');
        await loadRanking();

        console.log('✅ Data loaded successfully');
        setStats(statsData);
        setRecentActivity(formatActivity(activityData));
      }
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const loadDivision = async () => {
    try {
      const { getDivisions } = await import('@/lib/supabase-rn');
      const divisions = await getDivisions();
      const currentDivision = divisions.find(d => d.id === joueur?.division_id);
      if (currentDivision) {
        setDivision(currentDivision);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la division:', error);
    }
  };

  const loadRanking = async () => {
    try {
      const { getJoueurs } = await import('@/lib/supabase-rn');
      const allPlayers = await getJoueurs({});
      const sortedPlayers = allPlayers.sort((a: any, b: any) => b.points_classement - a.points_classement);
      const position = sortedPlayers.findIndex((p: any) => p.id === joueur?.id) + 1;
      setRanking({ position, total: sortedPlayers.length });
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    }
  };

  const formatActivity = (data: any) => {
    const activities = [];

    data.matches?.forEach((match: any) => {
      const isEquipe1 = match.joueur1_id === joueur?.id || match.joueur2_id === joueur?.id;
      const isWinner = (isEquipe1 && match.equipe1_gagnante) || (!isEquipe1 && !match.equipe1_gagnante);

      const opponent1 = isEquipe1
        ? (match.joueur3?.nom_complet || 'Joueur')
        : (match.joueur1?.nom_complet || 'Joueur');
      const opponent2 = isEquipe1
        ? (match.joueur4?.nom_complet || 'Joueur')
        : (match.joueur2?.nom_complet || 'Joueur');

      activities.push({
        type: isWinner ? 'victory' : 'defeat',
        title: `${isWinner ? 'Victoire' : 'Défaite'} contre ${opponent1} & ${opponent2}`,
        subtitle: `${match.score || 'Score non renseigné'}`,
        time: match.created_at,
        icon: isWinner ? 'medal' : 'close-circle',
        color: isWinner ? '#f59e0b' : '#ef4444',
      });
    });

    data.defis?.forEach((defi: any) => {
      const sender = defi.expediteur?.nom_complet || 'Joueur inconnu';
      activities.push({
        type: 'challenge',
        title: 'Nouveau défi reçu',
        subtitle: `${sender} vous défie`,
        time: defi.created_at,
        icon: 'star',
        color: '#3b82f6',
      });
    });

    return activities.sort((a, b) =>
      new Date(b.time).getTime() - new Date(a.time).getTime()
    ).slice(0, 3);
  };

  const getDivisionName = (division: Division | null, langue: string = 'fr') => {
    if (!division) return 'Court Warrior';
    return division.nom[langue] || division.nom['fr'] || 'Court Warrior';
  };

  const getProgressToNextDivision = () => {
    if (!joueur || !division) return { progress: 68, pointsNeeded: 320 };

    const currentPoints = joueur.points_classement;
    const maxPoints = division.points_maximum;
    const minPoints = division.points_minimum;

    const progress = ((currentPoints - minPoints) / (maxPoints - minPoints)) * 100;
    const pointsNeeded = maxPoints - currentPoints;

    return { progress: Math.min(progress, 100), pointsNeeded: Math.max(pointsNeeded, 0) };
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    return 'À l\'instant';
  };

  const { progress, pointsNeeded } = getProgressToNextDivision();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Padel Master</Text>
          <Text style={styles.subtitle}>
            Bonjour {joueur?.nom_complet?.split(' ')[0] || 'Joueur'} !
          </Text>
        </View>

        {/* Current Ranking Card */}
        <View style={styles.rankingCard}>
          <View style={styles.rankingHeader}>
            <Ionicons name="trophy" size={24} color="#f97316" />
            <Text style={styles.rankingTitle}>Votre Classement</Text>
          </View>
          <View style={styles.rankingContent}>
            <Text style={styles.divisionName}>
              {getDivisionName(division, joueur?.preference_langue)}
            </Text>
            <Text style={styles.divisionLevel}>
              Division {division?.niveau || 6} • {joueur?.points_classement?.toLocaleString() || '1,247'} points
            </Text>
            {ranking && (
              <Text style={styles.rankingPosition}>
                Position: {ranking.position} / {ranking.total}
              </Text>
            )}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {pointsNeeded > 0 ? `${pointsNeeded} points avant la prochaine division` : 'Division maximale atteinte !'}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        {loading ? (
          <View style={styles.statsContainer}>
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={20} color="#10b981" />
              <Text style={styles.statNumber}>{joueur?.victoires || 0}</Text>
              <Text style={styles.statLabel}>Victoires</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={20} color="#3b82f6" />
              <Text style={styles.statNumber}>{stats.defisActifs}</Text>
              <Text style={styles.statLabel}>Défis actifs</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={20} color="#8b5cf6" />
              <Text style={styles.statNumber}>{stats.ligues}</Text>
              <Text style={styles.statLabel}>Ligues</Text>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activité Récente</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 20 }} />
          ) : recentActivity.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Aucune activité récente</Text>
            </View>
          ) : (
            recentActivity.map((activity, index) => (
              <TouchableOpacity key={index} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Ionicons name={activity.icon as any} size={18} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  <Text style={styles.activityTime}>{getTimeAgo(activity.time)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="search" size={20} color="#ffffff" />
              <Text style={styles.actionText}>Chercher Joueurs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
              <Ionicons name="people" size={20} color="#f97316" />
              <Text style={[styles.actionText, styles.actionTextSecondary]}>Créer Ligue</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  rankingCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  rankingContent: {
    alignItems: 'center',
  },
  divisionName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f97316',
    marginBottom: 4,
  },
  divisionLevel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  rankingPosition: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#f97316',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#f97316',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionTextSecondary: {
    color: '#f97316',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});