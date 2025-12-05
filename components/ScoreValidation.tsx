import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScoreValidationProps {
  visible: boolean;
  onClose: () => void;
  matchData: {
    players: string[];
    score: string;
    date: string;
  };
}

export default function ScoreValidation({ visible, onClose, matchData }: ScoreValidationProps) {
  const [playerValidations, setPlayerValidations] = useState<{ [key: string]: boolean }>({});
  const [reportIssue, setReportIssue] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');

  const handleValidation = (playerId: string, isValid: boolean) => {
    setPlayerValidations(prev => ({
      ...prev,
      [playerId]: isValid
    }));
  };

  const submitReport = () => {
    Alert.alert(
      'Signalement envoyé',
      'Votre signalement a été transmis aux administrateurs. Le match est en cours de révision.',
      [{ text: 'OK', onPress: () => setReportIssue(false) }]
    );
  };

  const validationCount = Object.values(playerValidations).filter(Boolean).length;
  const totalPlayers = matchData.players.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Validation du Score</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Match Info */}
          <View style={styles.matchCard}>
            <Text style={styles.matchTitle}>Résultat du Match</Text>
            <Text style={styles.matchScore}>{matchData.score}</Text>
            <Text style={styles.matchDate}>{matchData.date}</Text>
          </View>

          {/* Validation Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Ionicons name="people" size={20} color="#f97316" />
              <Text style={styles.progressTitle}>Validation des Joueurs</Text>
            </View>
            <Text style={styles.progressText}>
              {validationCount}/{totalPlayers} joueurs ont validé
            </Text>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${(validationCount / totalPlayers) * 100}%` }
              ]} />
            </View>
          </View>

          {/* Players Validation */}
          <View style={styles.playersContainer}>
            <Text style={styles.playersTitle}>Statut par Joueur</Text>
            {matchData.players.map((player, index) => (
              <View key={index} style={styles.playerRow}>
                <Text style={styles.playerName}>{player}</Text>
                <View style={styles.validationStatus}>
                  {playerValidations[player] === true && (
                    <View style={styles.statusValidated}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.statusText}>Validé</Text>
                    </View>
                  )}
                  {playerValidations[player] === false && (
                    <View style={styles.statusRejected}>
                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                      <Text style={styles.statusTextRed}>Contesté</Text>
                    </View>
                  )}
                  {playerValidations[player] === undefined && (
                    <View style={styles.statusPending}>
                      <Ionicons name="time" size={16} color="#f59e0b" />
                      <Text style={styles.statusTextOrange}>En attente</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* User Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.validateButton}
              onPress={() => handleValidation('current-user', true)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.validateText}>Valider le Score</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contestButton}
              onPress={() => setReportIssue(true)}
            >
              <AlertTriangle size={20} color="#ef4444" />
              <Text style={styles.contestText}>Contester le Score</Text>
            </TouchableOpacity>
          </View>

          {/* Deadline Warning */}
          <View style={styles.warningCard}>
            <AlertTriangle size={16} color="#f59e0b" />
            <Text style={styles.warningText}>
              Validation automatique dans 46h si aucune contestation
            </Text>
          </View>
        </View>

        {/* Report Issue Modal */}
        <Modal visible={reportIssue} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.reportModal}>
              <Text style={styles.reportTitle}>Signaler un Problème</Text>
              <TextInput
                style={styles.reportInput}
                placeholder="Décrivez le problème avec ce match..."
                multiline
                numberOfLines={4}
                value={issueDescription}
                onChangeText={setIssueDescription}
              />
              <View style={styles.reportActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setReportIssue(false)}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitReport}
                >
                  <Text style={styles.submitText}>Signaler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
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
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  matchScore: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  matchDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 3,
  },
  playersContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  validationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusValidated: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRejected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPending: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
    fontWeight: '600',
  },
  statusTextRed: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 4,
    fontWeight: '600',
  },
  statusTextOrange: {
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 4,
    fontWeight: '600',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  validateButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  validateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  contestButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  contestText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  warningText: {
    color: '#92400e',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 100,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  cancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});