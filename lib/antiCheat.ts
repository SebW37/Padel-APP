// Système anti-triche pour Padel Master

export interface SuspicionMetrics {
  conflits_recents: number;
  modifications_score: number;
  validations_tardives: number;
  signalements_recus: number;
  comportement_anormal: boolean;
}

export interface SanctionHistory {
  joueur_id: string;
  type_sanction: 'avertissement' | 'suspension_temporaire' | 'suspension_longue' | 'bannissement';
  duree_heures?: number;
  raison: string;
  date_debut: string;
  date_fin?: string;
  admin_id?: string;
}

/**
 * Analyse les métriques de suspicion d'un joueur
 */
export function analyserComportement(metrics: SuspicionMetrics): {
  niveau_suspicion: 'faible' | 'modere' | 'eleve' | 'critique';
  score_suspicion: number;
  recommandation: string;
} {
  let score = 0;
  
  // Pondération des différents facteurs
  score += metrics.conflits_recents * 15;
  score += metrics.modifications_score * 20;
  score += metrics.validations_tardives * 5;
  score += metrics.signalements_recus * 25;
  score += metrics.comportement_anormal ? 30 : 0;
  
  let niveau_suspicion: 'faible' | 'modere' | 'eleve' | 'critique';
  let recommandation: string;
  
  if (score <= 20) {
    niveau_suspicion = 'faible';
    recommandation = 'Aucune action requise';
  } else if (score <= 50) {
    niveau_suspicion = 'modere';
    recommandation = 'Surveillance renforcée';
  } else if (score <= 80) {
    niveau_suspicion = 'eleve';
    recommandation = 'Avertissement automatique';
  } else {
    niveau_suspicion = 'critique';
    recommandation = 'Suspension temporaire immédiate';
  }
  
  return { niveau_suspicion, score_suspicion: score, recommandation };
}

/**
 * Calcule la durée de suspension progressive
 */
export function calculerDureeSuspension(historique: SanctionHistory[]): number {
  const suspensions_precedentes = historique.filter(s => 
    s.type_sanction.includes('suspension')
  ).length;
  
  // Progression: 24h, 72h, 168h (1 semaine), 720h (1 mois)
  const durees = [24, 72, 168, 720];
  const index = Math.min(suspensions_precedentes, durees.length - 1);
  
  return durees[index];
}

/**
 * Vérifie la cohérence d'un score de match
 */
export function verifierCoherenceScore(
  score: string,
  duree_match_minutes: number
): { coherent: boolean; raisons: string[] } {
  const raisons: string[] = [];
  
  try {
    const sets = score.split(' ').map(set => {
      const [jeux1, jeux2] = set.split('-').map(Number);
      return { jeux1, jeux2 };
    });
    
    // Vérifications basiques
    if (sets.length < 1 || sets.length > 3) {
      raisons.push('Nombre de sets incorrect');
    }
    
    sets.forEach((set, index) => {
      // Vérification format jeux
      if (set.jeux1 < 0 || set.jeux2 < 0 || set.jeux1 > 7 || set.jeux2 > 7) {
        raisons.push(`Set ${index + 1}: nombre de jeux invalide`);
      }
      
      // Vérification logique gagnant du set
      const diff = Math.abs(set.jeux1 - set.jeux2);
      const max_jeux = Math.max(set.jeux1, set.jeux2);
      
      if (max_jeux >= 6 && diff < 2) {
        raisons.push(`Set ${index + 1}: écart insuffisant`);
      }
      
      if (max_jeux === 7 && diff !== 1 && !(set.jeux1 === 7 && set.jeux2 === 5) && !(set.jeux1 === 5 && set.jeux2 === 7)) {
        raisons.push(`Set ${index + 1}: score 7-X incorrect`);
      }
    });
    
    // Vérification durée match
    const jeux_total = sets.reduce((total, set) => total + set.jeux1 + set.jeux2, 0);
    const duree_estimee = jeux_total * 8; // ~8 minutes par jeu en moyenne
    
    if (duree_match_minutes < duree_estimee * 0.5 || duree_match_minutes > duree_estimee * 2) {
      raisons.push('Durée de match incohérente avec le score');
    }
    
  } catch (error) {
    raisons.push('Format de score invalide');
  }
  
  return {
    coherent: raisons.length === 0,
    raisons
  };
}

/**
 * Génère un rapport d'activité suspecte
 */
export function genererRapportSuspicion(
  joueur_id: string,
  metrics: SuspicionMetrics
): {
  rapport: string;
  actions_recommandees: string[];
  priorite: 'basse' | 'moyenne' | 'haute' | 'urgente';
} {
  const analyse = analyserComportement(metrics);
  
  const rapport = `
Joueur ID: ${joueur_id}
Score de suspicion: ${analyse.score_suspicion}/100
Niveau: ${analyse.niveau_suspicion}

Détails:
- Conflits récents: ${metrics.conflits_recents}
- Modifications score: ${metrics.modifications_score}
- Validations tardives: ${metrics.validations_tardives}
- Signalements reçus: ${metrics.signalements_recus}
- Comportement anormal: ${metrics.comportement_anormal ? 'Oui' : 'Non'}
  `;
  
  const actions_recommandees: string[] = [];
  let priorite: 'basse' | 'moyenne' | 'haute' | 'urgente' = 'basse';
  
  switch (analyse.niveau_suspicion) {
    case 'critique':
      priorite = 'urgente';
      actions_recommandees.push('Suspension immédiate');
      actions_recommandees.push('Révision manuelle requise');
      break;
    case 'eleve':
      priorite = 'haute';
      actions_recommandees.push('Avertissement automatique');
      actions_recommandees.push('Surveillance renforcée');
      break;
    case 'modere':
      priorite = 'moyenne';
      actions_recommandees.push('Monitoring continu');
      break;
    default:
      priorite = 'basse';
      actions_recommandees.push('Aucune action immédiate');
  }
  
  return { rapport, actions_recommandees, priorite };
}

/**
 * Vérifie si un joueur peut jouer (pas suspendu)
 */
export function verifierEligibiliteJoueur(
  sanctions: SanctionHistory[]
): { eligible: boolean; raison?: string; fin_suspension?: string } {
  const suspension_active = sanctions.find(s => 
    s.type_sanction.includes('suspension') && 
    s.date_fin && 
    new Date(s.date_fin) > new Date()
  );
  
  if (suspension_active) {
    return {
      eligible: false,
      raison: suspension_active.raison,
      fin_suspension: suspension_active.date_fin
    };
  }
  
  return { eligible: true };
}