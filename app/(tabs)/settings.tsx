import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-rn';

export default function SettingsScreen() {
  const { joueur, refreshJoueur, signOut } = useAuth();
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    challenges: true,
    rankings: true,
    leagues: true,
  });

  const [privacy, setPrivacy] = useState({
    showLocation: true,
    showProfile: true,
    onlineStatus: true,
  });

  const [language, setLanguage] = useState('français');
  const [biometric, setBiometric] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const languages = ['Français', 'Español', 'English', 'Italiano'];

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Force refresh triggered by user');
      await refreshJoueur();
      Alert.alert('Succès', 'Données rafraîchies avec succès!');
    } catch (error) {
      console.error('Error refreshing:', error);
      Alert.alert('Erreur', 'Impossible de rafraîchir les données');
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Vider le cache',
      'Cela va vous déconnecter et effacer toutes les données locales. Continuer?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Clearing cache and signing out...');
              await signOut();
              if (typeof window !== 'undefined') {
                localStorage?.clear();
                sessionStorage?.clear();
              }
              Alert.alert('Succès', 'Cache vidé. Reconnectez-vous pour voir vos données à jour.');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Erreur', 'Impossible de vider le cache');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Paramètres</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="person" size={20} color="#f97316" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Informations personnelles</Text>
              <Text style={styles.settingSubtitle}>Nom, âge, club, division</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Langue</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="globe" size={20} color="#3b82f6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Langue de l'interface</Text>
              <Text style={styles.settingSubtitle}>{language}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications" size={20} color="#10b981" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications push</Text>
              <Text style={styles.settingSubtitle}>Alertes en temps réel</Text>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, push: value }))}
              trackColor={{ false: '#e5e7eb', true: '#f97316' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications email</Text>
              <Text style={styles.settingSubtitle}>Résumés et alertes importantes</Text>
            </View>
            <Switch
              value={notifications.email}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, email: value }))}
              trackColor={{ false: '#e5e7eb', true: '#f97316' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="trophy" size={20} color="#f59e0b" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Défis et classement</Text>
              <Text style={styles.settingSubtitle}>Nouveaux défis et promotions</Text>
            </View>
            <Switch
              value={notifications.challenges}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, challenges: value }))}
              trackColor={{ false: '#e5e7eb', true: '#f97316' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidentialité</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="location" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Partager ma localisation</Text>
              <Text style={styles.settingSubtitle}>Visible dans la recherche de joueurs</Text>
            </View>
            <Switch
              value={privacy.showLocation}
              onValueChange={(value) => setPrivacy(prev => ({ ...prev, showLocation: value }))}
              trackColor={{ false: '#e5e7eb', true: '#f97316' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              {privacy.showProfile ?
                <Ionicons name="eye" size={20} color="#10b981" /> :
                <Ionicons name="eye-off" size={20} color="#6b7280" />
              }
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Profil public</Text>
              <Text style={styles.settingSubtitle}>Autres joueurs peuvent voir votre profil</Text>
            </View>
            <Switch
              value={privacy.showProfile}
              onValueChange={(value) => setPrivacy(prev => ({ ...prev, showProfile: value }))}
              trackColor={{ false: '#e5e7eb', true: '#f97316' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="phone-portrait" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Authentification biométrique</Text>
              <Text style={styles.settingSubtitle}>Empreinte digitale ou Face ID</Text>
            </View>
            <Switch
              value={biometric}
              onValueChange={setBiometric}
              trackColor={{ false: '#e5e7eb', true: '#f97316' }}
              thumbColor="#ffffff"
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="shield" size={20} color="#10b981" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Authentification 2FA</Text>
              <Text style={styles.settingSubtitle}>SMS de sécurité activé</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle" size={20} color="#6b7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>FAQ & Support</Text>
              <Text style={styles.settingSubtitle}>Questions fréquentes et aide</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Debug Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug</Text>

          <TouchableOpacity
            style={[styles.settingItem, refreshing && styles.settingItemDisabled]}
            onPress={handleForceRefresh}
            disabled={refreshing}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="refresh" size={20} color="#3b82f6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Rafraîchir les données</Text>
              <Text style={styles.settingSubtitle}>
                {refreshing ? 'Rafraîchissement...' : 'Recharge les stats depuis la base'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
            <View style={styles.settingIcon}>
              <Ionicons name="trash" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Vider le cache</Text>
              <Text style={styles.settingSubtitle}>Déconnexion + effacement des données locales</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {joueur && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugTitle}>Infos actuelles:</Text>
              <Text style={styles.debugText}>Nom: {joueur.nom_complet}</Text>
              <Text style={styles.debugText}>Victoires: {joueur.victoires}</Text>
              <Text style={styles.debugText}>Points: {joueur.points_classement}</Text>
              <Text style={styles.debugText}>Division: {joueur.division_id}</Text>
              <Text style={styles.debugTextSmall}>
                Dernière MAJ: {new Date(joueur.updated_at).toLocaleString('fr-FR')}
              </Text>
            </View>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.logoutButton}>
            <Ionicons name="log-out" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.versionSubtext}>Padel Master • 2025</Text>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 24,
  },
  settingItem: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    marginBottom: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 2,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  debugInfo: {
    backgroundColor: '#f3f4f6',
    marginHorizontal: 24,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  debugTextSmall: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
});