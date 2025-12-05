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
import { getJoueurs, completeDefiWithMatch } from '@/lib/supabase-rn';
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
      if (expediteurId && destinataireId) {
        setEquipe1Joueur1(expediteurId);
        setEquipe2Joueur1(destinataireId);
      }
    }
  }, [visible, expediteurId, destinataireId]);

  const loadJoueurs = async () => {
    setLoading(true);
    try {
      const data = await getJoueurs({});
      setJoueurs(data || []);
    } catch (error) {
      console.error('Erreur chargement joueurs:', error);
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
      await completeDefiWithMatch(defiId, {
        equipe1_joueur1_id: equipe1Joueur1,
        equipe1_joueur2_id: equipe1Joueur2,
        equipe2_joueur1_id: equipe2Joueur1,
        equipe2_joueur2_id: equipe2Joueur2,
        score: scoreString,
        equipe1_gagnante: equipe1Gagnante,
      });
      alert(`Match enregistré! ${equipe1Gagnante ? 'Équipe 1' : 'Équipe 2'} gagne`);
      onSave();
      resetForm();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
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
  };

  const getJoueurName = (id: string) => {
    const joueur = joueurs.find((j) => j.id === id);
    return joueur?.nom_complet || 'Sélectionner';
  };

  const renderPlayerPicker = (
    visible: boolean,
    onClose: () => void,
    onSelect: (id: string) => void,
    selectedId: string
  ) => {
    if (!visible) return null;

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Sélectionner un joueur</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {joueurs.map((joueur) => (
              <TouchableOpacity
                key={joueur.id}
                style={[
                  styles.pickerItem,
                  joueur.id === selectedId && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  onSelect(joueur.id);
                  onClose();
                }}
              >
                <Text style={styles.pickerItemText}>{joueur.nom_complet}</Text>
              </TouchableOpacity>
            ))}
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
            <Text style={styles.title}>Configuration du match</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#f97316" style={styles.loader} />
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Équipe 1</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowEquipe1Joueur1Picker(true)}
                >
                  <Text style={styles.inputText}>{getJoueurName(equipe1Joueur1)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowEquipe1Joueur2Picker(true)}
                >
                  <Text style={styles.inputText}>{getJoueurName(equipe1Joueur2)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Équipe 2</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowEquipe2Joueur1Picker(true)}
                >
                  <Text style={styles.inputText}>{getJoueurName(equipe2Joueur1)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowEquipe2Joueur2Picker(true)}
                >
                  <Text style={styles.inputText}>{getJoueurName(equipe2Joueur2)}</Text>
                  <Ionicons name="chevron-down" size={20} color="#9ca3af" />
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
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
