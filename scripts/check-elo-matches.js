import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkELOMatches() {
  console.log('🔍 Analyse des matchs ELO contre Elena Petit 26...\n');

  try {
    // 1. Trouver Elena Petit 26
    const { data: elena } = await supabase
      .from('joueurs')
      .select('id, nom_complet, points_classement')
      .eq('nom_complet', 'Elena Petit 26')
      .maybeSingle();

    if (!elena) {
      console.log('❌ Elena Petit 26 non trouvée');
      return;
    }

    console.log(`📊 ${elena.nom_complet}:`);
    console.log(`   Points actuels: ${elena.points_classement}\n`);

    // 2. Trouver Test User 2
    const { data: testUser } = await supabase
      .from('joueurs')
      .select('id, nom_complet, points_classement')
      .eq('nom_complet', 'Test User 2')
      .maybeSingle();

    if (!testUser) {
      console.log('❌ Test User 2 non trouvé');
      return;
    }

    console.log(`📊 ${testUser.nom_complet}:`);
    console.log(`   Points actuels: ${testUser.points_classement}\n`);

    // 3. Trouver tous les matchs entre Test User 2 et Elena Petit 26
    const { data: matchs, error } = await supabase
      .from('matchs')
      .select(`
        id,
        date_match,
        score,
        equipe1_gagnante,
        created_at,
        joueur1:joueurs!matchs_joueur1_id_fkey(id, nom_complet, points_classement),
        joueur2:joueurs!matchs_joueur2_id_fkey(id, nom_complet, points_classement),
        joueur3:joueurs!matchs_joueur3_id_fkey(id, nom_complet, points_classement),
        joueur4:joueurs!matchs_joueur4_id_fkey(id, nom_complet, points_classement)
      `)
      .or(`joueur1_id.eq.${testUser.id},joueur2_id.eq.${testUser.id},joueur3_id.eq.${testUser.id},joueur4_id.eq.${testUser.id}`)
      .or(`joueur1_id.eq.${elena.id},joueur2_id.eq.${elena.id},joueur3_id.eq.${elena.id},joueur4_id.eq.${elena.id}`)
      .eq('statut', 'valide')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    // Filtrer les matchs où les deux jouent ensemble
    const matchsEnsemble = matchs?.filter(m => {
      const joueurs = [
        m.joueur1?.id,
        m.joueur2?.id,
        m.joueur3?.id,
        m.joueur4?.id
      ];
      return joueurs.includes(testUser.id) && joueurs.includes(elena.id);
    }) || [];

    console.log(`\n🎾 ${matchsEnsemble.length} match(s) trouvé(s) entre Test User 2 et Elena Petit 26:\n`);

    let victoiresTestUser = 0;
    let victoiresElena = 0;

    matchsEnsemble.forEach((match, index) => {
      const equipe1 = [match.joueur1, match.joueur2];
      const equipe2 = [match.joueur3, match.joueur4];
      
      const testUserDansEquipe1 = equipe1.some(j => j?.id === testUser.id);
      const elenaDansEquipe1 = equipe1.some(j => j?.id === elena.id);
      const testUserDansEquipe2 = equipe2.some(j => j?.id === testUser.id);
      const elenaDansEquipe2 = equipe2.some(j => j?.id === elena.id);

      const testUserGagne = (testUserDansEquipe1 && match.equipe1_gagnante) || 
                           (testUserDansEquipe2 && !match.equipe1_gagnante);
      const elenaGagne = (elenaDansEquipe1 && match.equipe1_gagnante) || 
                         (elenaDansEquipe2 && !match.equipe1_gagnante);

      if (testUserGagne) victoiresTestUser++;
      if (elenaGagne) victoiresElena++;

      // Calculer les points moyens des équipes AVANT le match
      const pointsEquipe1 = (equipe1[0]?.points_classement || 0) + (equipe1[1]?.points_classement || 0);
      const pointsEquipe2 = (equipe2[0]?.points_classement || 0) + (equipe2[1]?.points_classement || 0);
      const moyenneEquipe1 = pointsEquipe1 / 2;
      const moyenneEquipe2 = pointsEquipe2 / 2;
      const difference = moyenneEquipe1 - moyenneEquipe2;

      // Calculer la probabilité attendue (formule ELO)
      const expectedEquipe1 = 1 / (1 + Math.pow(10, (moyenneEquipe2 - moyenneEquipe1) / 400));
      const expectedEquipe2 = 1 - expectedEquipe1;

      // Calculer les points gagnés/perdus avec K=32
      const kFactor = 32;
      const actualEquipe1 = match.equipe1_gagnante ? 1 : 0;
      const pointsGagnesEquipe1 = Math.round(kFactor * (actualEquipe1 - expectedEquipe1));
      const pointsGagnesEquipe2 = Math.round(kFactor * ((1 - actualEquipe1) - expectedEquipe2));

      // Analyser le score pour déterminer si c'est une victoire écrasante
      const scoreParts = match.score.split(',');
      let victoireEcrasante = false;
      let jeuxGagnesEquipe1 = 0;
      let jeuxGagnesEquipe2 = 0;
      
      scoreParts.forEach(part => {
        const [e1, e2] = part.trim().split('-').map(Number);
        jeuxGagnesEquipe1 += e1 || 0;
        jeuxGagnesEquipe2 += e2 || 0;
      });

      // Victoire écrasante = gagner tous les sets avec un écart de 3+ jeux
      if (match.equipe1_gagnante) {
        victoireEcrasante = jeuxGagnesEquipe2 === 0 || (jeuxGagnesEquipe1 - jeuxGagnesEquipe2 >= 6);
      } else {
        victoireEcrasante = jeuxGagnesEquipe1 === 0 || (jeuxGagnesEquipe2 - jeuxGagnesEquipe1 >= 6);
      }

      console.log(`${index + 1}. Match ID: ${match.id}`);
      console.log(`   Date: ${new Date(match.date_match).toLocaleString('fr-FR')}`);
      console.log(`   Score: ${match.score}`);
      console.log(`   Équipe 1: ${equipe1[0]?.nom_complet} & ${equipe1[1]?.nom_complet}`);
      console.log(`   Équipe 2: ${equipe2[0]?.nom_complet} & ${equipe2[1]?.nom_complet}`);
      console.log(`   Gagnant: ${match.equipe1_gagnante ? 'Équipe 1' : 'Équipe 2'}`);
      console.log(`   Points moyens avant match:`);
      console.log(`     Équipe 1: ${moyenneEquipe1.toFixed(0)}`);
      console.log(`     Équipe 2: ${moyenneEquipe2.toFixed(0)}`);
      console.log(`     Différence: ${difference.toFixed(0)}`);
      console.log(`   Probabilité attendue:`);
      console.log(`     Équipe 1: ${(expectedEquipe1 * 100).toFixed(1)}%`);
      console.log(`     Équipe 2: ${(expectedEquipe2 * 100).toFixed(1)}%`);
      console.log(`   Points gagnés/perdus (K=32, sans bonus score):`);
      console.log(`     Équipe 1: ${pointsGagnesEquipe1 > 0 ? '+' : ''}${pointsGagnesEquipe1}`);
      console.log(`     Équipe 2: ${pointsGagnesEquipe2 > 0 ? '+' : ''}${pointsGagnesEquipe2}`);
      console.log(`   Victoire écrasante: ${victoireEcrasante ? '✅ OUI' : '❌ NON'}`);
      console.log(`   Test User 2: ${testUserGagne ? '✅ GAGNÉ' : '❌ PERDU'}`);
      console.log(`   Elena Petit 26: ${elenaGagne ? '✅ GAGNÉ' : '❌ PERDU'}`);
      console.log('');
    });

    console.log(`\n📊 Résumé:`);
    console.log(`   Victoires Test User 2: ${victoiresTestUser}`);
    console.log(`   Victoires Elena Petit 26: ${victoiresElena}`);
    console.log(`   Points actuels Test User 2: ${testUser.points_classement}`);
    console.log(`   Points actuels Elena Petit 26: ${elena.points_classement}`);
    console.log(`   Différence de points: ${elena.points_classement - testUser.points_classement}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkELOMatches();


