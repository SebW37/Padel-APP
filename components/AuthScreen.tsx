import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase-rn';
import { AuthError } from '@supabase/supabase-js';

// Mock clubs data for when Supabase is not configured
const MOCK_CLUBS = [
  { id: 1, nom: 'Club Padel Barcelona', pays: 'Espagne', ville: 'Barcelona', statut: 'valide' as const, date_creation: '2024-01-01', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 2, nom: 'Madrid Padel Center', pays: 'Espagne', ville: 'Madrid', statut: 'valide' as const, date_creation: '2024-01-01', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 3, nom: 'Paris Padel Club', pays: 'France', ville: 'Paris', statut: 'valide' as const, date_creation: '2024-01-01', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 4, nom: 'Club Padel Valencia', pays: 'Espagne', ville: 'Valencia', statut: 'valide' as const, date_creation: '2024-01-01', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 5, nom: 'Padel Club Milano', pays: 'Italie', ville: 'Milano', statut: 'valide' as const, date_creation: '2024-01-01', created_at: '2024-01-01', updated_at: '2024-01-01' },
];

type Club = {
  id: number;
  nom: string;
  pays: string;
  ville: string;
  statut: 'valide' | 'en_attente' | 'rejete';
  date_creation: string;
  created_at: string;
  updated_at: string;
};

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nomComplet, setNomComplet] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F'>('M');
  const [clubId, setClubId] = useState<number>(1);
  const [langue, setLanguue] = useState('fr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [clubs, setClubs] = useState<Club[]>(MOCK_CLUBS);

  const { signIn, signUp } = useAuth();

  React.useEffect(() => {
    // Always use mock clubs data for now
    console.log('Using mock clubs data');
  }, []);

  const loadClubs = async () => {
    try {
      const { getClubs } = await import('@/lib/supabase');
      const clubsData = await getClubs();
      setClubs(clubsData);
    } catch (error) {
      console.error('Erreur lors du chargement des clubs:', error);
      // Keep using mock data if fetch fails
      console.log('Using mock clubs data due to fetch error');
    }
  };

  const handleAuth = async () => {
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Nettoyer les espaces en début/fin
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!isLogin && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(cleanEmail, cleanPassword);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError(`L'email ou le mot de passe est incorrect. Vérifiez vos identifiants ou créez un nouveau compte.`);
          } else if (error.message.includes('Email not confirmed')) {
            setError('Veuillez vérifier votre boîte email et cliquer sur le lien de confirmation.');
          } else {
            setError(`Erreur de connexion: ${error.message}`);
          }
          return;
        }
        setSuccess('Connexion réussie!');
      } else {
        if (!nomComplet || !dateNaissance) {
          setError('Veuillez remplir tous les champs obligatoires');
          return;
        }

        const { error } = await signUp(cleanEmail, cleanPassword, {
          nom_complet: nomComplet,
          date_naissance: dateNaissance,
          sexe,
          club_id: clubId,
          preference_langue: langue,
        });

        if (error) {
          if (error instanceof AuthError && error.status === 422 && error.message === 'User already registered') {
            setError('Un compte avec cet email existe déjà. Essayez de vous connecter ou utilisez un autre email.');
          } else if (error.message.includes('Password should be at least')) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
          } else {
            setError(`Erreur d'inscription: ${error.message}`);
          }
          return;
        } else {
          setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
          setIsLogin(true);
          return;
        }
      }
    } catch (error) {
      if (error instanceof Error && !error.message.includes('Invalid login credentials')) {
        console.error('Auth error:', error);
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Padel Master</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte joueur'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success Message */}
          {success ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Mot de passe */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {!isLogin && (
            <>
              {/* Confirmation mot de passe */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              {/* Nom complet */}
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Nom complet"
                  value={nomComplet}
                  onChangeText={setNomComplet}
                />
              </View>

              {/* Date de naissance */}
              <View style={styles.inputContainer}>
                <Ionicons name="calendar" size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Date de naissance (YYYY-MM-DD)"
                  value={dateNaissance}
                  onChangeText={setDateNaissance}
                />
              </View>

              {/* Sexe */}
              <View style={styles.radioContainer}>
                <Text style={styles.radioLabel}>Sexe:</Text>
                <TouchableOpacity
                  style={[styles.radioButton, sexe === 'M' && styles.radioButtonActive]}
                  onPress={() => setSexe('M')}
                >
                  <Text style={[styles.radioText, sexe === 'M' && styles.radioTextActive]}>
                    Homme
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, sexe === 'F' && styles.radioButtonActive]}
                  onPress={() => setSexe('F')}
                >
                  <Text style={[styles.radioText, sexe === 'F' && styles.radioTextActive]}>
                    Femme
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Club */}
              <View style={styles.inputContainer}>
                <Ionicons name="location" size={20} color="#6b7280" />
                <View style={styles.selectContainer}>
                  <Text style={styles.selectLabel}>Club:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {clubs.slice(0, 5).map((club) => (
                      <TouchableOpacity
                        key={club.id}
                        style={[
                          styles.clubButton,
                          clubId === club.id && styles.clubButtonActive
                        ]}
                        onPress={() => setClubId(club.id)}
                      >
                        <Text style={[
                          styles.clubButtonText,
                          clubId === club.id && styles.clubButtonTextActive
                        ]}>
                          {club.nom}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Langue */}
              <View style={styles.inputContainer}>
                <Ionicons name="globe" size={20} color="#6b7280" />
                <View style={styles.selectContainer}>
                  <Text style={styles.selectLabel}>Langue:</Text>
                  <View style={styles.languageContainer}>
                    {[
                      { code: 'fr', name: 'Français' },
                      { code: 'es', name: 'Español' },
                      { code: 'en', name: 'English' },
                      { code: 'it', name: 'Italiano' }
                    ].map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        style={[
                          styles.languageButton,
                          langue === lang.code && styles.languageButtonActive
                        ]}
                        onPress={() => setLanguue(lang.code)}
                      >
                        <Text style={[
                          styles.languageButtonText,
                          langue === lang.code && styles.languageButtonTextActive
                        ]}>
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Bouton principal */}
          <TouchableOpacity
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            </Text>
          </TouchableOpacity>

          {/* Basculer entre connexion et inscription */}
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f97316',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  radioLabel: {
    fontSize: 16,
    color: '#374151',
    marginRight: 16,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  radioButtonActive: {
    backgroundColor: '#f97316',
  },
  radioText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  radioTextActive: {
    color: '#ffffff',
  },
  selectContainer: {
    flex: 1,
    marginLeft: 12,
  },
  selectLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  clubButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  clubButtonActive: {
    backgroundColor: '#f97316',
  },
  clubButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  clubButtonTextActive: {
    color: '#ffffff',
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 4,
  },
  languageButtonActive: {
    backgroundColor: '#f97316',
  },
  languageButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: '#ffffff',
  },
  authButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  switchButtonText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
});