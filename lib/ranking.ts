// Système de classement personnalisé pour Padel Master

export const DIVISIONS = [
  { id: 1, nom: 'Padelino Starter', niveau: 1, points_min: 0, points_max: 99 },
  { id: 2, nom: 'Rookie Padel', niveau: 2, points_min: 100, points_max: 249 },
  { id: 3, nom: 'Court Beginner', niveau: 3, points_min: 250, points_max: 499 },
  { id: 4, nom: 'Rising Star', niveau: 4, points_min: 500, points_max: 799 },
  { id: 5, nom: 'Fast Breaker', niveau: 5, points_min: 800, points_max: 1199 },
  { id: 6, nom: 'Court Warrior', niveau: 6, points_min: 1200, points_max: 1699 },
  { id: 7, nom: 'Baseline Master', niveau: 7, points_min: 1700, points_max: 2299 },
  { id: 8, nom: 'Net Strategist', niveau: 8, points_min: 2300, points_max: 2999 },
  { id: 9, nom: 'Smash Specialist', niveau: 9, points_min: 3000, points_max: 3799 },
  { id: 10, nom: 'Elite Padel', niveau: 10, points_min: 3800, points_max: 4699 },
  { id: 11, nom: 'Challenger Pro', niveau: 11, points_min: 4700, points_max: 5699 },
  { id: 12, nom: 'Padel Ace', niveau: 12, points_min: 5700, points_max: 6799 },
  { id: 13, nom: 'Pro Circuit', niveau: 13, points_min: 6800, points_max: 7999 },
  { id: 14, nom: 'Master Padel', niveau: 14, points_min: 8000, points_max: 9499 },
  { id: 15, nom: 'Grand Slam Legend', niveau: 15, points_min: 9500, points_max: 99999 },
];

export interface ScoreDetails {
  sets: number[];
  jeux_total: number;
  victoire_nette: boolean;
}

export interface JoueurRanking {
  id: string;
  points_actuels: number;
  division_actuelle: number;
}

/**
 * Calcule les nouveaux points après un match basé sur un système Elo modifié
 */
export function calculerNouveauxPoints(
  joueur1: JoueurRanking,
  joueur2: JoueurRanking,
  joueur3: JoueurRanking,
  joueur4: JoueurRanking,
  score: ScoreDetails,
  equipe1_gagnante: boolean
): { nouveaux_points: Record<string, number>, changements: Record<string, number> } {
  
  // Équipes
  const equipe1 = [joueur1, joueur2];
  const equipe2 = [joueur3, joueur4];
  
  // Points moyens par équipe
  const points_equipe1 = (joueur1.points_actuels + joueur2.points_actuels) / 2;
  const points_equipe2 = (joueur3.points_actuels + joueur4.points_actuels) / 2;
  
  // Différence de niveau
  const difference_points = points_equipe1 - points_equipe2;
  
  // Probabilité de victoire équipe 1 (formule Elo)
  const probabilite_victoire_equipe1 = 1 / (1 + Math.pow(10, -difference_points / 400));
  
  // Facteur K adaptatif selon le niveau
  const niveau_moyen = (joueur1.division_actuelle + joueur2.division_actuelle + 
                       joueur3.division_actuelle + joueur4.division_actuelle) / 4;
  const facteur_k = niveau_moyen <= 5 ? 40 : niveau_moyen <= 10 ? 30 : 20;
  
  // Facteur bonus/malus selon la domination du score
  let facteur_score = 1;
  if (score.victoire_nette) {
    facteur_score = 1.2; // Bonus pour victoire nette
  } else if (score.jeux_total >= 24) {
    facteur_score = 1.1; // Bonus pour match serré
  }
  
  // Calcul des points gagnés/perdus
  const resultat_equipe1 = equipe1_gagnante ? 1 : 0;
  const changement_base = facteur_k * (resultat_equipe1 - probabilite_victoire_equipe1) * facteur_score;
  
  // Application des changements
  const nouveaux_points: Record<string, number> = {};
  const changements: Record<string, number> = {};
  
  // Équipe 1
  [joueur1, joueur2].forEach(joueur => {
    const changement = Math.round(changement_base);
    nouveaux_points[joueur.id] = Math.max(0, joueur.points_actuels + changement);
    changements[joueur.id] = changement;
  });
  
  // Équipe 2
  [joueur3, joueur4].forEach(joueur => {
    const changement = Math.round(-changement_base);
    nouveaux_points[joueur.id] = Math.max(0, joueur.points_actuels + changement);
    changements[joueur.id] = changement;
  });
  
  return { nouveaux_points, changements };
}

/**
 * Détermine la division basée sur les points
 */
export function determinerDivision(points: number): typeof DIVISIONS[0] {
  for (const division of DIVISIONS) {
    if (points >= division.points_min && points <= division.points_max) {
      return division;
    }
  }
  // Par défaut, retourner la dernière division si points très élevés
  return DIVISIONS[DIVISIONS.length - 1];
}

/**
 * Vérifie si un joueur a changé de division
 */
export function verifierChangementDivision(
  anciens_points: number,
  nouveaux_points: number
): { changement: boolean; promotion: boolean; nouvelle_division: typeof DIVISIONS[0] } {
  const ancienne_division = determinerDivision(anciens_points);
  const nouvelle_division = determinerDivision(nouveaux_points);
  
  const changement = ancienne_division.id !== nouvelle_division.id;
  const promotion = nouvelle_division.niveau > ancienne_division.niveau;
  
  return {
    changement,
    promotion,
    nouvelle_division
  };
}

/**
 * Génère un message de notification pour changement de division
 */
export function genererMessageDivision(
  nom_joueur: string,
  promotion: boolean,
  nouvelle_division: typeof DIVISIONS[0],
  langue: string = 'fr'
): string {
  const messages = {
    fr: {
      promotion: `🎉 Félicitations ${nom_joueur} ! Vous êtes maintenant ${nouvelle_division.nom} !`,
      retrogradation: `⚠️ ${nom_joueur}, vous êtes descendu en ${nouvelle_division.nom}. Continuez vos efforts !`
    },
    es: {
      promotion: `🎉 ¡Felicidades ${nom_joueur}! ¡Ahora eres ${nouvelle_division.nom}!`,
      retrogradation: `⚠️ ${nom_joueur}, has bajado a ${nouvelle_division.nom}. ¡Sigue esforzándote!`
    },
    en: {
      promotion: `🎉 Congratulations ${nom_joueur}! You are now ${nouvelle_division.nom}!`,
      retrogradation: `⚠️ ${nom_joueur}, you dropped to ${nouvelle_division.nom}. Keep fighting!`
    }
  };
  
  const lang = langue in messages ? langue as keyof typeof messages : 'fr';
  return promotion ? messages[lang].promotion : messages[lang].retrogradation;
}