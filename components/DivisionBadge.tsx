import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DivisionBadgeProps {
  divisionName: string;
  level: number;
  points: number;
  size?: 'small' | 'medium' | 'large';
}

export default function DivisionBadge({ divisionName, level, points, size = 'medium' }: DivisionBadgeProps) {
  const getDivisionColor = (level: number) => {
    if (level <= 3) return '#ef4444'; // Rouge pour débutants
    if (level <= 6) return '#f59e0b'; // Orange pour intermédiaires
    if (level <= 9) return '#10b981'; // Vert pour confirmés
    if (level <= 12) return '#3b82f6'; // Bleu pour avancés
    return '#8b5cf6'; // Violet pour experts
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          title: styles.titleSmall,
          subtitle: styles.subtitleSmall,
          icon: 14,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          title: styles.titleLarge,
          subtitle: styles.subtitleLarge,
          icon: 24,
        };
      default:
        return {
          container: styles.containerMedium,
          title: styles.titleMedium,
          subtitle: styles.subtitleMedium,
          icon: 18,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const divisionColor = getDivisionColor(level);

  return (
    <View style={[styles.container, sizeStyles.container, { borderColor: divisionColor }]}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={sizeStyles.icon} color={divisionColor} />
        <Text style={[sizeStyles.title, { color: divisionColor }]}>{divisionName}</Text>
      </View>
      <Text style={sizeStyles.subtitle}>
        Division {level} • {points.toLocaleString()} pts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
  },
  containerSmall: {
    padding: 8,
    borderRadius: 8,
  },
  containerMedium: {
    padding: 12,
    borderRadius: 12,
  },
  containerLarge: {
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleSmall: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  titleMedium: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  titleLarge: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  subtitleSmall: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  subtitleMedium: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  subtitleLarge: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});