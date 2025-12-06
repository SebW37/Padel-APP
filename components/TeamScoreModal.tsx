import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getJoueurs, completeDefiWithMatch, supabase } from '@/lib/supabase-rn';
import type { Joueur } from '@/lib/supabase-rn';

interface TeamScoreModalProps {
  visible: boolean;
  defiId: number;
  expediteurId?: string;
  destinataireId?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function TeamScoreModal({ visible, defiId, expediteurId, destinataireId, onClose, onSave }: TeamScoreModalProps) {
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defiType, setDefiType] = useState<string>('Simple');
  const [isPaireFixe, setIsPaireFixe] = useState(false);

  const [equipe1Joueur1, setEquipe1Joueur1] = useState<string>('');
  const [equipe1Joueur2, setEquipe1Joueur2] = useState<string>('');
  const [equipe2Joueur1, setEquipe2Joueur1] = useState<string>('');
  const [equipe2Joueur2, setEquipe2Joueur2] = useState<string>('');
  const [set1Equipe1, setSet1Equipe1] = useState('');
  const [set1Equipe2, setSet1Equipe2] = useState('');
  const [set2Equipe1, setSet2Equipe1] = useState('');
  const [set2Equipe2, setSet2Equipe2] = useState('');
  const [set3Equipe1, setSet3Equipe1] = useState('');
  const [set3Equipe2, setSet3Equipe2] = useState('');

  const [showEquipe1Joueur1Picker, setShowEquipe1Joueur1Picker] = useState(false);
  const [showEquipe1Joueur2Picker, setShowEquipe1Joueur2Picker] = useState(false);
  const [showEquipe2Joueur1Picker, setShowEquipe2Joueur1Picker] = useState(false);
  const [showEquipe2Joueur2Picker, setShowEquipe2Joueur2Picker] = useState(false);

  useEffect(() => {
    if (visible) {
      loadJoueurs();
      loadDefiInfo();
      if (expediteurId && destinataireId) {
        setEquipe1Joueur1(expediteurId);
        setEquipe2Joueur1(destinataireId);
      }
    } else {
      // Réinitialiser la recherche quand le modal se ferme
      setPickerSearch('');
      setDefiType('Simple');
      setIsPaireFixe(false);
    }
  }, [visible, expediteurId, destinataireId, defiId]);

  const loadDefiInfo = async () => {
    try {
      // Récupérer le défi avec son ligue_id
      const { data: defiData, error: defiError } = await supabase
        .from('defis')
        .select('id, ligue_id')
        .eq('id', defiId)
        .maybeSingle();

      if (defiError) {
        console.error('Erreur chargement défi:', defiError);
        setDefiType('Simple');
        setIsPaireFixe(false);
        return;
      }

      // Si le défi est lié à une ligue, récupérer les infos de la ligue
      if (defiData?.ligue_id) {
        const { data: ligueData, error: ligueError } = await supabase
          .from('ligues')
          .select('id, nom, format')
          .eq('id', defiData.ligue_id)
          .maybeSingle();

        if (ligueError) {
          console.error('Erreur chargement ligue:', ligueError);
          setDefiType('Simple');
          setIsPaireFixe(false);
          return;
        }

        if (ligueData) {
          if (ligueData.format === 'paires_fixes') {
            setDefiType('Ligue par paire');
            setIsPaireFixe(true);
          } else if (ligueData.format === 'americano') {
            setDefiType('Ligue Americano');
            setIsPaireFixe(false);
          } else {
            setDefiType('Ligue');
            setIsPaireFixe(false);
          }
        } else {
          setDefiType('Simple');
          setIsPaireFixe(false);
        }
      } else {
        setDefiType('Simple');
        setIsPaireFixe(false);
      }
    } catch (error) {
      console.error('Erreur chargement info défi:', error);
      setDefiType('Simple');
      setIsPaireFixe(false);
    }
  };

  const loadJoueurs = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement des joueurs...');
      
      // Charger directement depuis Supabase (plus rapide, pas besoin de clubs/divisions pour le picker)
      const { supabase } = require('@/lib/supabase-rn');
      const { data: joueursData, error: supabaseError } = await supabase
        .from('joueurs')
        .select('id, nom_complet')
        .order('nom_complet')
        .limit(200); // Limiter à 200 joueurs max
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      if (joueursData) {
        console.log(`✅ ${joueursData.length} joueur(s) chargé(s)`);
        // Formater pour correspondre à l'interface Joueur attendue
        setJoueurs(joueursData.map((j: any) => ({
          id: j.id,
          nom_complet: j.nom_complet,
          date_naissance: '',
          sexe: 'M' as const,
          club_id: 0,
          points_classement: 0,
          division_id: 0,
          preference_langue: 'fr',
          confidentialite: { masquer_position: false, masquer_profil: false, statut_en_ligne: true },
          badges: [],
          created_at: '',
          updated_at: '',
          club: null,
          division: null
        })));
      } else {
        setJoueurs([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement joueurs:', error);
      alert('Erreur lors du chargement des joueurs. Vérifiez votre connexion.');
      setJoueurs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!equipe1Joueur1 || !equipe1Joueur2 || !equipe2Joueur1 || !equipe2Joueur2) {
      alert('Veuillez sélectionner tous les joueurs');
      return;
    }

    if (!set1Equipe1 || !set1Equipe2) {
      alert('Veuillez renseigner au moins le score du set 1');
      return;
    }

    let setsEquipe1 = 0;
    let setsEquipe2 = 0;
    const scoreParts: string[] = [];

    if (set1Equipe1 && set1Equipe2) {
      const s1e1 = parseInt(set1Equipe1);
      const s1e2 = parseInt(set1Equipe2);
      scoreParts.push(`${s1e1}-${s1e2}`);
      if (s1e1 > s1e2) setsEquipe1++;
      else if (s1e2 > s1e1) setsEquipe2++;
    }

    if (set2Equipe1 && set2Equipe2) {
      const s2e1 = parseInt(set2Equipe1);
      const s2e2 = parseInt(set2Equipe2);
      scoreParts.push(`${s2e1}-${s2e2}`);
      if (s2e1 > s2e2) setsEquipe1++;
      else if (s2e2 > s2e1) setsEquipe2++;
    }

    if (set3Equipe1 && set3Equipe2) {
      const s3e1 = parseInt(set3Equipe1);
      const s3e2 = parseInt(set3Equipe2);
      scoreParts.push(`${s3e1}-${s3e2}`);
      if (s3e1 > s3e2) setsEquipe1++;
      else if (s3e2 > s3e1) setsEquipe2++;
    }

    const scoreString = scoreParts.join(', ');
    const equipe1Gagnante = setsEquipe1 > setsEquipe2;

    setSaving(true);
    try {
      console.log('💾 Début de la sauvegarde du match...');
      console.log('📋 Données:', {
        defiId,
        equipe1: [equipe1Joueur1, equipe1Joueur2],
        equipe2: [equipe2Joueur1, equipe2Joueur2],
        score: scoreString,
        equipe1Gagnante: equipe1Gagnante
      });
      
      const result = await completeDefiWithMatch(defiId, {
        equipe1_joueur1_id: equipe1Joueur1,
        equipe1_joueur2_id: equipe1Joueur2,
        equipe2_joueur1_id: equipe2Joueur1,
        equipe2_joueur2_id: equipe2Joueur2,
        score: scoreString,
        equipe1_gagnante: equipe1Gagnante,
      });
      
      console.log('✅ Match enregistré avec succès:', result);
      alert(`Match enregistré! ${equipe1Gagnante ? 'Équipe 1' : 'Équipe 2'} gagne`);
      onSave();
      resetForm();
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      console.error('❌ Détails erreur:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      alert(`Erreur lors de la sauvegarde: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEquipe1Joueur1('');
    setEquipe1Joueur2('');
    setEquipe2Joueur1('');
    setEquipe2Joueur2('');
    setSet1Equipe1('');
    setSet1Equipe2('');
    setSet2Equipe1('');
    setSet2Equipe2('');
    setSet3Equipe1('');
    setSet3Equipe2('');
    setPickerSearch('');
    setShowEquipe1Joueur1Picker(false);
    setShowEquipe1Joueur2Picker(false);
    setShowEquipe2Joueur1Picker(false);
    setShowEquipe2Joueur2Picker(false);
  };

  const getJoueurName = (id: string) => {
    const joueur = joueurs.find((j) => j.id === id);
    return joueur?.nom_complet || 'Sélectionner';
  };

  const [pickerSearch, setPickerSearch] = useState('');

  const renderPlayerPicker = (
    visible: boolean,
    onClose: () => void,
    onSelect: (id: string) => void,
    selectedId: string
  ) => {
    if (!visible) return null;

    const filteredJoueurs = pickerSearch
      ? joueurs.filter(j => 
          j.nom_complet.toLowerCase().includes(pickerSearch.toLowerCase())
        )
      : joueurs;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Sélectionner un joueur</Text>
            <TouchableOpacity onPress={() => {
              setPickerSearch('');
              onClose();
            }}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.pickerSearchContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.pickerSearchIcon} />
            <TextInput
              style={styles.pickerSearchInput}
              placeholder="Rechercher un joueur..."
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoFocus
            />
            {pickerSearch.length > 0 && (
              <TouchableOpacity onPress={() => setPickerSearch('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={styles.pickerList}>
            {filteredJoueurs.length > 0 ? (
              filteredJoueurs.map((joueur) => (
                <TouchableOpacity
                  key={joueur.id}
                  style={[
                    styles.pickerItem,
                    joueur.id === selectedId && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(joueur.id);
                    setPickerSearch('');
                    onClose();
                  }}
                >
                  <Text style={styles.pickerItemText}>{joueur.nom_complet}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.pickerEmpty}>
                <Text style={styles.pickerEmptyText}>Aucun joueur trouvé</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>Configuration du match</Text>
              <View style={styles.defiTypeBadge}>
                <Ionicons 
                  name={isPaireFixe ? "lock-closed" : "trophy"} 
                  size={14} 
                  color={isPaireFixe ? "#ef4444" : "#f97316"} 
                  style={styles.defiTypeIcon}
                />
                <Text style={styles.defiTypeText}>{defiType}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#f97316" style={styles.loader} />
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {isPaireFixe && (
                <View style={styles.paireFixeWarning}>
                  <Ionicons name="information-circle" size={18} color="#ef4444" />
                  <Text style={styles.paireFixeWarningText}>
                    Les joueurs sont bloqués pour les ligues par paire. Les équipes sont prédéfinies.
                  </Text>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Équipe 1</Text>
                <TouchableOpacity
                  style={[styles.input, isPaireFixe && styles.inputDisabled]}
                  onPress={() => !isPaireFixe && setShowEquipe1Joueur1Picker(true)}
                  disabled={isPaireFixe}
                >
                  <Text style={[styles.inputText, isPaireFixe && styles.inputTextDisabled]}>
                    {getJoueurName(equipe1Joueur1)}
                  </Text>
                  {!isPaireFixe && <Ionicons name="chevron-down" size={20} color="#9ca3af" />}
                  {isPaireFixe && <Ionicons name="lock-closed" size={18} color="#9ca3af" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.input, isPaireFixe && styles.inputDisabled]}
                  onPress={() => !isPaireFixe && setShowEquipe1Joueur2Picker(true)}
                  disabled={isPaireFixe}
                >
                  <Text style={[styles.inputText, isPaireFixe && styles.inputTextDisabled]}>
                    {getJoueurName(equipe1Joueur2)}
                  </Text>
                  {!isPaireFixe && <Ionicons name="chevron-down" size={20} color="#9ca3af" />}
                  {isPaireFixe && <Ionicons name="lock-closed" size={18} color="#9ca3af" />}
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Équipe 2</Text>
                <TouchableOpacity
                  style={[styles.input, isPaireFixe && styles.inputDisabled]}
                  onPress={() => !isPaireFixe && setShowEquipe2Joueur1Picker(true)}
                  disabled={isPaireFixe}
                >
                  <Text style={[styles.inputText, isPaireFixe && styles.inputTextDisabled]}>
                    {getJoueurName(equipe2Joueur1)}
                  </Text>
                  {!isPaireFixe && <Ionicons name="chevron-down" size={20} color="#9ca3af" />}
                  {isPaireFixe && <Ionicons name="lock-closed" size={18} color="#9ca3af" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.input, isPaireFixe && styles.inputDisabled]}
                  onPress={() => !isPaireFixe && setShowEquipe2Joueur2Picker(true)}
                  disabled={isPaireFixe}
                >
                  <Text style={[styles.inputText, isPaireFixe && styles.inputTextDisabled]}>
                    {getJoueurName(equipe2Joueur2)}
                  </Text>
                  {!isPaireFixe && <Ionicons name="chevron-down" size={20} color="#9ca3af" />}
                  {isPaireFixe && <Ionicons name="lock-closed" size={18} color="#9ca3af" />}
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Score (optionnel)</Text>
                <Text style={styles.scoreHint}>
                  Format padel: meilleur des 3 sets, chaque set se joue en 6 jeux
                </Text>

                <Text style={styles.setLabel}>Set 1</Text>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreInputSmall}>
                    <Text style={styles.scoreLabel}>Équipe 1</Text>
                    <TextInput
                      style={styles.scoreFieldSmall}
                      value={set1Equipe1}
                      onChangeText={setSet1Equipe1}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      maxLength={1}
                    />
                  </View>
                  <Text style={styles.scoreSeparator}>-</Text>
                  <View style={styles.scoreInputSmall}>
                    <Text style={styles.scoreLabel}>Équipe 2</Text>
                    <TextInput
                      style={styles.scoreFieldSmall}
                      value={set1Equipe2}
                      onChangeText={setSet1Equipe2}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      maxLength={1}
                    />
                  </View>
                </View>

                <Text style={styles.setLabel}>Set 2</Text>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreInputSmall}>
                    <Text style={styles.scoreLabel}>Équipe 1</Text>
                    <TextInput
                      style={styles.scoreFieldSmall}
                      value={set2Equipe1}
                      onChangeText={setSet2Equipe1}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      maxLength={1}
                    />
                  </View>
                  <Text style={styles.scoreSeparator}>-</Text>
                  <View style={styles.scoreInputSmall}>
                    <Text style={styles.scoreLabel}>Équipe 2</Text>
                    <TextInput
                      style={styles.scoreFieldSmall}
                      value={set2Equipe2}
                      onChangeText={setSet2Equipe2}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      maxLength={1}
                    />
                  </View>
                </View>

                <Text style={styles.setLabel}>Set 3 (si nécessaire)</Text>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreInputSmall}>
                    <Text style={styles.scoreLabel}>Équipe 1</Text>
                    <TextInput
                      style={styles.scoreFieldSmall}
                      value={set3Equipe1}
                      onChangeText={setSet3Equipe1}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      maxLength={1}
                    />
                  </View>
                  <Text style={styles.scoreSeparator}>-</Text>
                  <View style={styles.scoreInputSmall}>
                    <Text style={styles.scoreLabel}>Équipe 2</Text>
                    <TextInput
                      style={styles.scoreFieldSmall}
                      value={set3Equipe2}
                      onChangeText={setSet3Equipe2}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      maxLength={1}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}

          {renderPlayerPicker(
            showEquipe1Joueur1Picker,
            () => setShowEquipe1Joueur1Picker(false),
            setEquipe1Joueur1,
            equipe1Joueur1
          )}
          {renderPlayerPicker(
            showEquipe1Joueur2Picker,
            () => setShowEquipe1Joueur2Picker(false),
            setEquipe1Joueur2,
            equipe1Joueur2
          )}
          {renderPlayerPicker(
            showEquipe2Joueur1Picker,
            () => setShowEquipe2Joueur1Picker(false),
            setEquipe2Joueur1,
            equipe2Joueur1
          )}
          {renderPlayerPicker(
            showEquipe2Joueur2Picker,
            () => setShowEquipe2Joueur2Picker(false),
            setEquipe2Joueur2,
            equipe2Joueur2
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  defiTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  defiTypeIcon: {
    marginRight: 4,
  },
  defiTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  paireFixeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  paireFixeWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.7,
  },
  inputTextDisabled: {
    color: '#6b7280',
  },
  content: {
    padding: 24,
  },
  loader: {
    padding: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInput: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  scoreField: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  scoreSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9ca3af',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '80%',
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  pickerSearchIcon: {
    marginRight: 8,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 8,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemSelected: {
    backgroundColor: '#fef3c7',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerEmpty: {
    padding: 32,
    alignItems: 'center',
  },
  pickerEmptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  scoreHint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  scoreInputSmall: {
    alignItems: 'center',
    flex: 1,
  },
  scoreFieldSmall: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    width: 60,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
