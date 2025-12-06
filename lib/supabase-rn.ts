import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Only import polyfill for native platforms, not web
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL');
  console.error('- EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Current values:', {
    url: supabaseUrl || 'undefined',
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'undefined'
  });
} else {
  console.log('✅ Supabase configuration loaded:');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey?.substring(0, 20) + '...');
  console.log('Platform:', Platform.OS);
}

// Create client with fallback values to prevent crashes
const storage = Platform.OS === 'web' && typeof window !== 'undefined' 
  ? window.localStorage 
  : undefined;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web', // Enable URL detection for web
      debug: __DEV__,
      ...(storage && { storage }), // Only add storage for web
    },
    global: {
      headers: {
        'X-Client-Info': 'padel-master-app',
      },
    },
  }
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const isConfigured = !!(supabaseUrl && supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-key');

  console.log('🔧 isSupabaseConfigured check:', {
    isConfigured,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlIsValid: supabaseUrl !== 'https://placeholder.supabase.co',
    keyIsValid: supabaseAnonKey !== 'placeholder-key'
  });

  return isConfigured;
};

// Types générés automatiquement depuis la base de données
export interface Division {
  id: number;
  nom: { [key: string]: string };
  description: { [key: string]: string };
  niveau: number;
  points_minimum: number;
  points_maximum: number;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: number;
  nom: string;
  pays: string;
  ville: string;
  latitude?: number;
  longitude?: number;
  statut: 'valide' | 'en_attente' | 'rejete';
  date_creation: string;
  created_at: string;
  updated_at: string;
}

export interface Joueur {
  id: string;
  nom_complet: string;
  date_naissance: string;
  sexe: 'M' | 'F';
  club_id: number;
  points_classement: number;
  division_id: number;
  position_gps?: { latitude: number; longitude: number };
  preference_langue: string;
  confidentialite: {
    masquer_position: boolean;
    masquer_profil: boolean;
    statut_en_ligne: boolean;
  };
  badges: string[];
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  joueur1_id: string;
  joueur2_id: string;
  joueur3_id: string;
  joueur4_id: string;
  score: string;
  statut: 'en_attente' | 'valide' | 'conteste';
  date_match: string;
  validations: Record<string, boolean>;
  duree_minutes?: number;
  equipe1_gagnante?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ligue {
  id: number;
  nom: string;
  description?: string;
  format: 'americano' | 'paires_fixes';
  nombre_joueurs: number;
  joueurs_ids: string[];
  statut: 'active' | 'terminee' | 'en_attente';
  type_ligue?: 'manuelle' | 'automatique';
  createur_id: string;
  created_at: string;
  updated_at: string;
}

export interface Defi {
  id: number;
  expediteur_id: string;
  destinataire_id: string;
  expediteur?: any;
  destinataire?: any;
  message?: string;
  statut: 'en_attente' | 'accepte' | 'refuse' | 'expire' | 'termine';
  date_expiration: string;
  ligue_id?: number;
  equipe1_joueur1_id?: string;
  equipe1_joueur2_id?: string;
  equipe2_joueur1_id?: string;
  equipe2_joueur2_id?: string;
  score_equipe1?: number;
  score_equipe2?: number;
  equipe1_joueur1?: any;
  equipe1_joueur2?: any;
  equipe2_joueur1?: any;
  equipe2_joueur2?: any;
  created_at: string;
  updated_at: string;
}

export interface Sanction {
  id: number;
  joueur_id: string;
  type_sanction: 'avertissement' | 'suspension_temporaire' | 'suspension_longue' | 'bannissement';
  duree_heures?: number;
  raison: string;
  date_debut: string;
  date_fin?: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  destinataire_id: string;
  type: string;
  titre: string;
  message: string;
  donnees: Record<string, any>;
  lu: boolean;
  date_expiration?: string;
  created_at: string;
  updated_at: string;
}

// Fonctions utilitaires pour les requêtes
export const getDivisions = async () => {
  const { data, error } = await supabase
    .from('divisions')
    .select('*')
    .order('niveau');
  
  if (error) throw error;
  return data as Division[];
};

export const getClubs = async () => {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('statut', 'valide')
    .order('nom');
  
  if (error) throw error;
  return data as Club[];
};

export const getJoueurs = async (filters?: {
  rayon_km?: number;
  division_id?: number;
  langue?: string;
}) => {
  let query = supabase
    .from('joueurs')
    .select('*');

  if (filters?.division_id) {
    query = query.eq('division_id', filters.division_id);
  }

  if (filters?.langue) {
    query = query.eq('preference_langue', filters.langue);
  }

  const { data: joueurs, error } = await query.order('points_classement', { ascending: false });

  if (error) throw error;
  if (!joueurs || joueurs.length === 0) return [];

  const clubIds = [...new Set(joueurs.map((j: any) => j.club_id).filter(Boolean))];
  const divisionIds = [...new Set(joueurs.map((j: any) => j.division_id).filter(Boolean))];

  const [clubs, divisions] = await Promise.all([
    clubIds.length > 0
      ? supabase.from('clubs').select('*').in('id', clubIds).then(r => r.data || [])
      : Promise.resolve([]),
    divisionIds.length > 0
      ? supabase.from('divisions').select('*').in('id', divisionIds).then(r => r.data || [])
      : Promise.resolve([])
  ]);

  return joueurs.map((j: any) => ({
    ...j,
    club: clubs.find((c: any) => c.id === j.club_id) || null,
    division: divisions.find((d: any) => d.id === j.division_id) || null
  }));
};

export const createDefi = async (defi: {
  expediteur_id: string;
  destinataire_id: string;
  message?: string;
}) => {
  const { data, error } = await supabase
    .from('defis')
    .insert(defi)
    .select()
    .single();
  
  if (error) throw error;
  return data as Defi;
};

export const updateDefiStatut = async (defi_id: number, statut: 'accepte' | 'refuse') => {
  console.log('📡 updateDefiStatut DÉBUT - defi_id:', defi_id, 'statut:', statut);

  try {
    const { data, error } = await supabase
      .from('defis')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', defi_id)
      .select()
      .single();

    console.log('📡 updateDefiStatut RÉPONSE:');
    console.log('  - data:', JSON.stringify(data, null, 2));
    console.log('  - error:', JSON.stringify(error, null, 2));

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      throw error;
    }

    console.log('✅ updateDefiStatut SUCCESS');
    return data as Defi;
  } catch (e: any) {
    console.error('❌ Exception dans updateDefiStatut:', e);
    throw e;
  }
};

export const createMatch = async (match: {
  joueur1_id: string;
  joueur2_id: string;
  joueur3_id: string;
  joueur4_id: string;
  score: string;
  equipe1_gagnante: boolean;
  duree_minutes?: number;
}) => {
  const { data, error } = await supabase
    .from('matchs')
    .insert({
      ...match,
      statut: 'valide',
      date_match: new Date().toISOString(),
      validations: {}
    })
    .select()
    .single();

  if (error) throw error;
  return data as Match;
};

export const getNotifications = async (joueur_id: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('destinataire_id', joueur_id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Notification[];
};

export const markNotificationAsRead = async (notification_id: number) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ lu: true, updated_at: new Date().toISOString() })
    .eq('id', notification_id)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
};

export const getPlayerStats = async (joueur_id: string) => {
  const { data: joueur, error: joueurError } = await supabase
    .from('joueurs')
    .select('victoires, defaites, matchs_joues')
    .eq('id', joueur_id)
    .maybeSingle();

  if (joueurError) throw joueurError;

  const { data: defisActifs, error: defisError } = await supabase
    .from('defis')
    .select('*')
    .or(`expediteur_id.eq.${joueur_id},destinataire_id.eq.${joueur_id}`)
    .in('statut', ['en_attente', 'accepte']);

  if (defisError) throw defisError;

  const { data: ligues, error: liguesError } = await supabase
    .from('ligues_joueurs')
    .select('*')
    .eq('joueur_id', joueur_id);

  if (liguesError) throw liguesError;

  return {
    victoires: joueur?.victoires || 0,
    defisActifs: defisActifs?.length || 0,
    ligues: ligues?.length || 0,
  };
};

export const getRecentActivity = async (joueur_id: string) => {
  const { data: recentMatches, error: matchsError } = await supabase
    .from('matchs')
    .select('*')
    .or(`joueur1_id.eq.${joueur_id},joueur2_id.eq.${joueur_id},joueur3_id.eq.${joueur_id},joueur4_id.eq.${joueur_id}`)
    .order('created_at', { ascending: false })
    .limit(3);

  if (matchsError) {
    console.error('Error in getRecentActivity (matchs):', matchsError);
    return { matches: [], defis: [] };
  }

  const joueurIdsFromMatches = new Set<string>();
  (recentMatches || []).forEach((match: any) => {
    if (match.joueur1_id) joueurIdsFromMatches.add(match.joueur1_id);
    if (match.joueur2_id) joueurIdsFromMatches.add(match.joueur2_id);
    if (match.joueur3_id) joueurIdsFromMatches.add(match.joueur3_id);
    if (match.joueur4_id) joueurIdsFromMatches.add(match.joueur4_id);
  });

  const { data: recentDefis, error: defisError } = await supabase
    .from('defis')
    .select('*')
    .eq('destinataire_id', joueur_id)
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: false })
    .limit(2);

  if (defisError) {
    console.error('Error in getRecentActivity (defis):', defisError);
  }

  (recentDefis || []).forEach((defi: any) => {
    if (defi.expediteur_id) joueurIdsFromMatches.add(defi.expediteur_id);
    if (defi.destinataire_id) joueurIdsFromMatches.add(defi.destinataire_id);
  });

  const { data: joueurs } = joueurIdsFromMatches.size > 0
    ? await supabase
        .from('joueurs')
        .select('id, nom_complet')
        .in('id', Array.from(joueurIdsFromMatches))
    : { data: [] };

  const joueursMap = new Map(joueurs?.map((j: any) => [j.id, j]) || []);

  const matchesWithNames = (recentMatches || []).map((match: any) => ({
    ...match,
    joueur1: joueursMap.get(match.joueur1_id) || null,
    joueur2: joueursMap.get(match.joueur2_id) || null,
    joueur3: joueursMap.get(match.joueur3_id) || null,
    joueur4: joueursMap.get(match.joueur4_id) || null,
  }));

  const defisWithNames = (recentDefis || []).map((defi: any) => ({
    ...defi,
    expediteur: joueursMap.get(defi.expediteur_id) || null,
    destinataire: joueursMap.get(defi.destinataire_id) || null,
  }));

  return {
    matches: matchesWithNames,
    defis: defisWithNames,
  };
};

export const getLigues = async () => {
  const { data, error } = await supabase
    .from('ligues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Ligue[];
};

export const getPlayerLigues = async (joueur_id: string) => {
  const { data: liguesJoueurs, error: ljError } = await supabase
    .from('ligues_joueurs')
    .select('*')
    .eq('joueur_id', joueur_id);

  if (ljError) throw ljError;
  if (!liguesJoueurs || liguesJoueurs.length === 0) return [];

  const ligueIds = liguesJoueurs.map((lj: any) => lj.ligue_id);
  const { data: ligues, error: liguesError } = await supabase
    .from('ligues')
    .select('*')
    .in('id', ligueIds);

  if (liguesError) throw liguesError;

  return liguesJoueurs.map((lj: any) => ({
    ...lj,
    ligue: ligues?.find((l: any) => l.id === lj.ligue_id) || null
  }));
};

export const getLeagueStats = async (joueur_id: string) => {
  const playerLigues = await getPlayerLigues(joueur_id);

  const { data: allMatches, error: matchsError } = await supabase
    .from('matchs')
    .select('*')
    .or(`joueur1_id.eq.${joueur_id},joueur2_id.eq.${joueur_id},joueur3_id.eq.${joueur_id},joueur4_id.eq.${joueur_id}`);

  if (matchsError) throw matchsError;

  let totalWins = 0;
  allMatches?.forEach((match) => {
    const isEquipe1 = match.joueur1_id === joueur_id || match.joueur2_id === joueur_id;
    if ((isEquipe1 && match.equipe1_gagnante) || (!isEquipe1 && !match.equipe1_gagnante)) {
      totalWins++;
    }
  });

  const totalMatches = allMatches?.length || 0;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  const positions = playerLigues?.map((pl: any) => pl.position || 999).filter((p: number) => p !== 999);
  const bestPosition = positions && positions.length > 0 ? Math.min(...positions) : 0;

  const totalPoints = playerLigues?.reduce((sum: number, pl: any) => sum + (pl.points || 0), 0) || 0;

  return {
    totalWins,
    totalMatches,
    winRate,
    bestPosition,
    totalPoints,
  };
};

export const getPlayerPerformanceHistory = async (joueur_id: string) => {
  // Récupérer tous les matchs validés du joueur, triés par date
  const { data: matches, error } = await supabase
    .from('matchs')
    .select('id, date_match, equipe1_gagnante, joueur1_id, joueur2_id, joueur3_id, joueur4_id')
    .or(`joueur1_id.eq.${joueur_id},joueur2_id.eq.${joueur_id},joueur3_id.eq.${joueur_id},joueur4_id.eq.${joueur_id}`)
    .eq('statut', 'valide')
    .order('date_match', { ascending: true });

  if (error) throw error;
  if (!matches || matches.length === 0) return { weekly: [], points: [] };

  // Récupérer l'historique des points du joueur (via les matchs et les updates)
  // Pour les points, on va simuler en calculant l'évolution basée sur les victoires/défaites
  const pointsHistory: Array<{ date: string; points: number }> = [];
  const weeklyData: Array<{ date: string; victories: number; matches: number }> = [];

  // Grouper par semaine
  const weeklyStats: { [key: string]: { victories: number; matches: number } } = {};

  matches.forEach((match) => {
    const matchDate = new Date(match.date_match);
    // Créer une clé semaine (année-semaine)
    const year = matchDate.getFullYear();
    const weekNumber = Math.ceil((matchDate.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weekKey = `${year}-S${weekNumber}`;
    
    if (!weeklyStats[weekKey]) {
      weeklyStats[weekKey] = { victories: 0, matches: 0 };
    }

    const isEquipe1 = match.joueur1_id === joueur_id || match.joueur2_id === joueur_id;
    const isWin = (isEquipe1 && match.equipe1_gagnante) || (!isEquipe1 && !match.equipe1_gagnante);
    
    weeklyStats[weekKey].matches++;
    if (isWin) {
      weeklyStats[weekKey].victories++;
    }
  });

  // Convertir en tableau pour le scatter plot XY
  Object.keys(weeklyStats).sort().forEach((weekKey) => {
    weeklyData.push({
      date: weekKey,
      victories: weeklyStats[weekKey].victories,
      matches: weeklyStats[weekKey].matches,
    });
  });

  // Calculer l'évolution des points (approximation basée sur les victoires)
  let estimatedPoints = 1200; // Points de départ par défaut
  matches.forEach((match, index) => {
    const matchDate = new Date(match.date_match);
    const isEquipe1 = match.joueur1_id === joueur_id || match.joueur2_id === joueur_id;
    const isWin = (isEquipe1 && match.equipe1_gagnante) || (!isEquipe1 && !match.equipe1_gagnante);
    
    // Approximation simple : +25 pour victoire, -15 pour défaite
    estimatedPoints += isWin ? 25 : -15;
    
    // Ajouter un point de données tous les 5 matchs ou à la fin
    if (index % 5 === 0 || index === matches.length - 1) {
      const dateKey = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}-${String(matchDate.getDate()).padStart(2, '0')}`;
      pointsHistory.push({
        date: dateKey,
        points: estimatedPoints,
      });
    }
  });

  return {
    weekly: weeklyData, // Pour le scatter plot XY (victoires vs matchs par semaine)
    points: pointsHistory, // Pour le graphique d'évolution des points
  };
};

export const getDefis = async (joueur_id: string) => {
  const { data: defis, error } = await supabase
    .from('defis')
    .select('*')
    .or(`expediteur_id.eq.${joueur_id},destinataire_id.eq.${joueur_id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!defis || defis.length === 0) return [];

  const joueurIds = new Set<string>();
  defis.forEach((defi: any) => {
    if (defi.expediteur_id) joueurIds.add(defi.expediteur_id);
    if (defi.destinataire_id) joueurIds.add(defi.destinataire_id);
    if (defi.equipe1_joueur1_id) joueurIds.add(defi.equipe1_joueur1_id);
    if (defi.equipe1_joueur2_id) joueurIds.add(defi.equipe1_joueur2_id);
    if (defi.equipe2_joueur1_id) joueurIds.add(defi.equipe2_joueur1_id);
    if (defi.equipe2_joueur2_id) joueurIds.add(defi.equipe2_joueur2_id);
  });

  const { data: joueurs } = await supabase
    .from('joueurs')
    .select('id, nom_complet')
    .in('id', Array.from(joueurIds));

  const joueursMap = new Map(joueurs?.map((j: any) => [j.id, j]) || []);

  return defis.map((defi: any) => ({
    ...defi,
    expediteur: joueursMap.get(defi.expediteur_id) || null,
    destinataire: joueursMap.get(defi.destinataire_id) || null,
    equipe1_joueur1: joueursMap.get(defi.equipe1_joueur1_id) || null,
    equipe1_joueur2: joueursMap.get(defi.equipe1_joueur2_id) || null,
    equipe2_joueur1: joueursMap.get(defi.equipe2_joueur1_id) || null,
    equipe2_joueur2: joueursMap.get(defi.equipe2_joueur2_id) || null,
  }));
};

// Fonctions de classement
export const getPlayerRankingInDivision = async (joueur_id: string, division_id: number) => {
  // Récupérer tous les joueurs de la division triés par points
  const { data: joueurs, error } = await supabase
    .from('joueurs')
    .select('id, nom_complet, points_classement')
    .eq('division_id', division_id)
    .order('points_classement', { ascending: false });

  if (error) throw error;
  if (!joueurs || joueurs.length === 0) return null;

  const position = joueurs.findIndex(j => j.id === joueur_id) + 1;
  return {
    position,
    total: joueurs.length,
    division_id
  };
};

export const getPlayerRankingInAllDivisions = async (joueur_id: string) => {
  // Récupérer les points du joueur
  const { data: joueur, error: joueurError } = await supabase
    .from('joueurs')
    .select('points_classement, division_id')
    .eq('id', joueur_id)
    .maybeSingle();

  if (joueurError) throw joueurError;
  if (!joueur) return [];

  // Récupérer toutes les divisions
  const { data: divisions, error: divisionsError } = await supabase
    .from('divisions')
    .select('*')
    .order('niveau', { ascending: true });

  if (divisionsError) throw divisionsError;
  if (!divisions) return [];

  // Pour chaque division, calculer la position du joueur
  const rankings = await Promise.all(
    divisions.map(async (division) => {
      const { data: joueursInDivision, error } = await supabase
        .from('joueurs')
        .select('id, points_classement')
        .gte('points_classement', division.points_minimum)
        .lte('points_classement', division.points_maximum)
        .order('points_classement', { ascending: false });

      if (error) return null;

      const position = joueursInDivision?.findIndex(j => j.id === joueur_id) ?? -1;
      const isInDivision = joueur.division_id === division.id;

      return {
        division: {
          id: division.id,
          nom: division.nom,
          niveau: division.niveau,
          points_minimum: division.points_minimum,
          points_maximum: division.points_maximum
        },
        position: position >= 0 ? position + 1 : null,
        total: joueursInDivision?.length || 0,
        isCurrentDivision: isInDivision,
        canReach: joueur.points_classement >= division.points_minimum && joueur.points_classement <= division.points_maximum
      };
    })
  );

  return rankings.filter(r => r !== null);
};

export const getPlayerRankingInClub = async (joueur_id: string) => {
  // Récupérer le club du joueur
  const { data: joueur, error: joueurError } = await supabase
    .from('joueurs')
    .select('club_id, points_classement')
    .eq('id', joueur_id)
    .maybeSingle();

  if (joueurError) throw joueurError;
  if (!joueur || !joueur.club_id) return null;

  // Récupérer tous les joueurs du club
  const { data: joueursClub, error } = await supabase
    .from('joueurs')
    .select('id, nom_complet, points_classement')
    .eq('club_id', joueur.club_id)
    .order('points_classement', { ascending: false });

  if (error) throw error;
  if (!joueursClub || joueursClub.length === 0) return null;

  const position = joueursClub.findIndex(j => j.id === joueur_id) + 1;
  return {
    position,
    total: joueursClub.length,
    club_id: joueur.club_id
  };
};

export const getPlayerRankingGlobal = async (joueur_id: string) => {
  // Récupérer tous les joueurs triés par points
  const { data: joueurs, error } = await supabase
    .from('joueurs')
    .select('id, nom_complet, points_classement')
    .order('points_classement', { ascending: false });

  if (error) throw error;
  if (!joueurs || joueurs.length === 0) return null;

  const position = joueurs.findIndex(j => j.id === joueur_id) + 1;
  return {
    position,
    total: joueurs.length
  };
};

export const getPlayerRankingInLigue = async (joueur_id: string, ligue_id: number) => {
  // Récupérer les stats de la ligue pour ce joueur
  const { data: ligueJoueur, error } = await supabase
    .from('ligues_joueurs')
    .select('position, points, victoires, defaites, matchs_joues')
    .eq('joueur_id', joueur_id)
    .eq('ligue_id', ligue_id)
    .maybeSingle();

  if (error) throw error;
  if (!ligueJoueur) return null;

  // Récupérer le nombre total de joueurs dans la ligue
  const { count, error: countError } = await supabase
    .from('ligues_joueurs')
    .select('*', { count: 'exact', head: true })
    .eq('ligue_id', ligue_id);

  if (countError) throw countError;

  return {
    position: ligueJoueur.position || null,
    total: count || 0,
    points: ligueJoueur.points || 0,
    victoires: ligueJoueur.victoires || 0,
    defaites: ligueJoueur.defaites || 0,
    matchs_joues: ligueJoueur.matchs_joues || 0
  };
};

export const createDefiInLigue = async (defi: {
  ligue_id: number;
  expediteur_id: string;
  destinataire_id: string;
  message?: string;
}) => {
  // Vérifier que les deux joueurs sont dans la ligue
  const { data: ligueJoueurs, error: checkError } = await supabase
    .from('ligues_joueurs')
    .select('ligue_id')
    .eq('ligue_id', defi.ligue_id)
    .in('joueur_id', [defi.expediteur_id, defi.destinataire_id]);

  if (checkError) throw checkError;
  if (!ligueJoueurs || ligueJoueurs.length !== 2) {
    throw new Error('Les deux joueurs doivent être dans la ligue');
  }

  // Créer le défi avec la référence à la ligue
  const { data, error } = await supabase
    .from('defis')
    .insert({
      expediteur_id: defi.expediteur_id,
      destinataire_id: defi.destinataire_id,
      message: defi.message || 'Défi de ligue',
      statut: 'en_attente',
      ligue_id: defi.ligue_id,
      date_expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Defi;
};

export const getLiguePlayers = async (ligue_id: number) => {
  const { data: ligueJoueurs, error } = await supabase
    .from('ligues_joueurs')
    .select(`
      joueur_id,
      position,
      points,
      victoires,
      defaites,
      matchs_joues,
      joueur:joueurs(id, nom_complet, points_classement, division_id)
    `)
    .eq('ligue_id', ligue_id)
    .order('position', { ascending: true });

  if (error) throw error;
  return ligueJoueurs || [];
};

export const updateDefiTeamsAndScore = async (
  defi_id: number,
  teams: {
    equipe1_joueur1_id: string;
    equipe1_joueur2_id: string;
    equipe2_joueur1_id: string;
    equipe2_joueur2_id: string;
    score_equipe1?: number;
    score_equipe2?: number;
  }
) => {
  const { data, error } = await supabase
    .from('defis')
    .update({ ...teams, updated_at: new Date().toISOString() })
    .eq('id', defi_id)
    .select()
    .single();

  if (error) throw error;
  return data as Defi;
};

export const completeDefiWithMatch = async (
  defi_id: number,
  matchData: {
    equipe1_joueur1_id: string;
    equipe1_joueur2_id: string;
    equipe2_joueur1_id: string;
    equipe2_joueur2_id: string;
    score: string;
    equipe1_gagnante: boolean;
  }
) => {
  const match = await createMatch({
    joueur1_id: matchData.equipe1_joueur1_id,
    joueur2_id: matchData.equipe1_joueur2_id,
    joueur3_id: matchData.equipe2_joueur1_id,
    joueur4_id: matchData.equipe2_joueur2_id,
    score: matchData.score,
    equipe1_gagnante: matchData.equipe1_gagnante,
  });

  const { data, error } = await supabase
    .from('defis')
    .update({
      statut: 'termine',
      updated_at: new Date().toISOString()
    })
    .eq('id', defi_id)
    .select()
    .maybeSingle();

  if (error) throw error;

  return { match, defi: data as Defi | null };
};