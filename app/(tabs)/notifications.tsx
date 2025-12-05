import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { getDefis, updateDefiStatut, getNotifications, markNotificationAsRead } from '@/lib/supabase-rn';
import TeamScoreModal from '@/components/TeamScoreModal';

export default function NotificationsScreen() {
  const { joueur: currentJoueur } = useAuth();
  const [defis, setDefis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedDefi, setSelectedDefi] = useState<any>(null);

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, lu: true } : notif
        )
      );
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.lu).map(n => markNotificationAsRead(n.id))
      );
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, lu: true }))
      );
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  useEffect(() => {
    if (currentJoueur) {
      loadData();
    }
  }, [currentJoueur]);

  const loadData = async () => {
    if (!currentJoueur) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Notifications loading timeout - forcing loading to false');
      setLoading(false);
    }, 5000);

    try {
      const defisData = await getDefis(currentJoueur.id).catch(err => {
        console.error('Error loading defis:', err);
        return [];
      });

      const notificationsData = await getNotifications(currentJoueur.id).catch(err => {
        console.error('Error loading notifications:', err);
        return [];
      });

      setDefis(defisData || []);
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      setErrorMessage('Impossible de charger les données');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleDefiResponse = async (defiId: number, statut: 'accepte' | 'refuse') => {
    console.log('=== handleDefiResponse START ===');
    console.log('Paramètres reçus:', { defiId, statut, type: typeof defiId });
    console.log('Current joueur:', currentJoueur);

    try {
      console.log('Appel de updateDefiStatut avec:', { defiId, statut });
      const result = await updateDefiStatut(defiId, statut);
      console.log('✅ Résultat updateDefiStatut:', JSON.stringify(result, null, 2));

      setSuccessMessage(statut === 'accepte' ? 'Défi accepté!' : 'Défi refusé');
      setTimeout(() => setSuccessMessage(''), 3000);

      console.log('Rechargement des données...');
      await loadData();
      console.log('✅ Données rechargées');
    } catch (error: any) {
      console.error('❌ ERREUR dans handleDefiResponse:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setErrorMessage(`Impossible de répondre au défi: ${error?.message || 'Erreur inconnue'}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
    console.log('=== handleDefiResponse END ===');
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}j`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'challenge':
        return <Ionicons name="notifications" size={18} color="#3b82f6" />;
      case 'ranking':
        return <Ionicons name="trophy" size={18} color="#f59e0b" />;
      case 'league':
        return <Ionicons name="people" size={18} color="#8b5cf6" />;
      case 'security':
        return <Ionicons name="warning" size={18} color="#ef4444" />;
      case 'achievement':
        return <Ionicons name="star" size={18} color="#10b981" />;
      default:
        return <Ionicons name="notifications" size={18} color="#6b7280" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Notifications</Text>
            {(unreadCount > 0) && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Mark All Read */}
        {(unreadCount > 0) && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.markAllText}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : null}

        {/* Défis List */}
        {(!loading && defis.length > 0) && (
          <View style={styles.notificationsContainer}>
            <Text style={styles.sectionTitle}>Défis</Text>
            {defis.map((defi) => {
              const isReceived = defi.destinataire_id === currentJoueur?.id;
              const otherPlayer = isReceived ? defi.expediteur : defi.destinataire;
              const timeAgo = getTimeAgo(defi.created_at);

              const showButtons = isReceived && defi.statut === 'en_attente';
              const showScoreButton = defi.statut === 'accepte' && !defi.score_equipe1 && !defi.score_equipe2;

              return (
                <View key={defi.id} style={styles.defiCard}>
                  <View style={styles.defiIcon}>
                    <Ionicons
                      name={isReceived ? "arrow-down" : "arrow-up"}
                      size={18}
                      color={isReceived ? "#3b82f6" : "#10b981"}
                    />
                  </View>
                  <View style={styles.defiContent}>
                    <Text style={styles.defiTitle}>
                      {isReceived ? 'Défi reçu' : 'Défi envoyé'}
                    </Text>
                    <Text style={styles.defiMessage}>
                      {isReceived
                        ? `${otherPlayer?.nom_complet} vous défie!`
                        : `Envoyé à ${otherPlayer?.nom_complet}`
                      }
                    </Text>
                    <View style={styles.defiFooter}>
                      <Text style={styles.defiTime}>Il y a {timeAgo}</Text>
                      <View style={[
                        styles.defiStatusBadge,
                        defi.statut === 'accepte' && styles.defiStatusAccepte,
                        defi.statut === 'refuse' && styles.defiStatusRefuse,
                        defi.statut === 'expire' && styles.defiStatusExpire,
                        defi.statut === 'termine' && styles.defiStatusTermine,
                      ]}>
                        <Text style={styles.defiStatusText}>
                          {defi.statut === 'en_attente' ? 'En attente' :
                           defi.statut === 'accepte' ? 'Accepté' :
                           defi.statut === 'refuse' ? 'Refusé' :
                           defi.statut === 'expire' ? 'Expiré' :
                           defi.statut === 'termine' ? 'Terminé' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {showButtons ? (
                    <View style={styles.defiActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => {
                          console.log('=== BOUTON ACCEPTER CLIQUÉ ===');
                          console.log('Défi ID:', defi.id);
                          handleDefiResponse(defi.id, 'accepte');
                        }}
                      >
                        <Ionicons name="checkmark" size={20} color="#ffffff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.refuseButton}
                        onPress={() => {
                          console.log('=== BOUTON REFUSER CLIQUÉ ===');
                          console.log('Défi ID:', defi.id);
                          handleDefiResponse(defi.id, 'refuse');
                        }}
                      >
                        <Ionicons name="close" size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ) : showScoreButton ? (
                    <TouchableOpacity
                      style={styles.scoreButton}
                      onPress={() => {
                        setSelectedDefi(defi);
                        setShowScoreModal(true);
                      }}
                    >
                      <Ionicons name="stats-chart" size={16} color="#ffffff" />
                      <Text style={styles.scoreButtonText}>Score</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Notifications List */}
        <View style={styles.notificationsContainer}>
          {(notifications.length > 0) && (
            <Text style={styles.sectionTitle}>Autres notifications</Text>
          )}
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.lu && styles.unreadNotification
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </View>
              <View style={styles.notificationContent}>
                <Text style={[
                  styles.notificationTitle,
                  !notification.lu && styles.unreadTitle
                ]}>
                  {notification.titre}
                </Text>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>
                  {getTimeAgo(notification.created_at)}
                </Text>
              </View>
              {!notification.lu ? (
                <View style={styles.unreadDot} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {(!loading && defis.length === 0 && notifications.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyMessage}>
              Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
            </Text>
          </View>
        )}

        {/* Notification Settings */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity style={styles.settingsCard}>
            <View style={styles.settingsIcon}>
              <Ionicons name="settings" size={20} color="#f97316" />
            </View>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsTitle}>Paramètres des notifications</Text>
              <Text style={styles.settingsSubtitle}>
                Gérer vos préférences de notifications
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Team Score Modal */}
      {selectedDefi && (
        <TeamScoreModal
          visible={showScoreModal}
          defiId={selectedDefi.id}
          expediteurId={selectedDefi.expediteur_id}
          destinataireId={selectedDefi.destinataire_id}
          onClose={() => {
            setShowScoreModal(false);
            setSelectedDefi(null);
          }}
          onSave={() => {
            setShowScoreModal(false);
            setSelectedDefi(null);
            loadData();
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsButton: {
    padding: 8,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  markAllButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  markAllText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#111827',
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: '#f97316',
    borderRadius: 4,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#fef3e2',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  defiCard: {
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
  defiIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  defiContent: {
    flex: 1,
  },
  defiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  defiMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  defiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defiTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  defiStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
  },
  defiStatusAccepte: {
    backgroundColor: '#10b981',
  },
  defiStatusRefuse: {
    backgroundColor: '#ef4444',
  },
  defiStatusExpire: {
    backgroundColor: '#6b7280',
  },
  defiStatusTermine: {
    backgroundColor: '#8b5cf6',
  },
  defiStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  defiActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refuseButton: {
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreButton: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  scoreButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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