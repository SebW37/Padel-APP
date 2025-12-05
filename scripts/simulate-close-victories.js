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

/**
 * Calcule les points gagnés avec le nouveau système ELO
 */
function calculatePointsGained(score, equipe1Gagnante, probAttendue, differenceRating = 0) {
  const kBase = 50;
  let scoreFactor = 1.0;
  let surpriseFactor = 1.0;
  
  // Parser le score
  const scoreParts = score.split(',');
  let jeuxGagnesEquipe1 = 0;
  let jeuxGagnesEquipe2 = 0;
  let jeuxPerdusEquipe1 = 0;
  let jeuxPerdusEquipe2 = 0;
  
  scoreParts.forEach(part => {
    const trimmed = part.trim();
    const match = trimmed.match(/^(\d+)-(\d+)$/);
    if (match) {
      const e1 = parseInt(match[1]);
      const e2 = parseInt(match[2]);
      jeuxGagnesEquipe1 += e1;
      jeuxGagnesEquipe2 += e2;
      jeuxPerdusEquipe1 += e2;
      jeuxPerdusEquipe2 += e1;
    }
  });
  
  // Calculer le facteur de score
  if (equipe1Gagnante) {
    if (jeuxPerdusEquipe1 === 0) {
      scoreFactor = 3.0; // Victoire parfaite 6-0, 6-0
    } else if (jeuxPerdusEquipe1 <= 3) {
      scoreFactor = 2.5; // Très forte domination
    } else if (jeuxPerdusEquipe1 <= 6) {
      scoreFactor = 2.0; // Forte domination
    } else if (jeuxPerdusEquipe1 <= 9) {
      scoreFactor = 1.5; // Domination modérée
    } else {
      scoreFactor = 1.2; // Victoire nette
    }
  } else {
    if (jeuxPerdusEquipe2 === 0) {
      scoreFactor = 3.0;
    } else if (jeuxPerdusEquipe2 <= 3) {
      scoreFactor = 2.5;
    } else if (jeuxPerdusEquipe2 <= 6) {
      scoreFactor = 2.0;
    } else if (jeuxPerdusEquipe2 <= 9) {
      scoreFactor = 1.5;
    } else {
      scoreFactor = 1.2;
    }
  }
  
  // Pour victoire serrée, si on a plus de 9 jeux perdus, c'est une victoire serrée
  // Le scoreFactor est déjà calculé correctement ci-dessus
  
  // Facteur de surprise
  surpriseFactor = 1.0 + (1.0 - probAttendue) * 1.5;
  
  // Bonus différence
  let differenceBonus = 1.0;
  if (differenceRating > 3000) {
    differenceBonus = 2.0;
  } else if (differenceRating > 2000) {
    differenceBonus = 1.7;
  } else if (differenceRating > 1000) {
    differenceBonus = 1.4;
  } else if (differenceRating > 500) {
    differenceBonus = 1.2;
  }
  
  // Limiter les facteurs
  scoreFactor = Math.max(1.0, Math.min(3.0, scoreFactor));
  surpriseFactor = Math.max(1.0, Math.min(2.5, surpriseFactor));
  
  // Coefficient final
  const coefficient = kBase * scoreFactor * surpriseFactor * differenceBonus;
  
  // Points gagnés
  const actual = equipe1Gagnante ? 1 : 0;
  const points = Math.round(coefficient * (actual - probAttendue));
  
  return {
    scoreFactor: scoreFactor,
    surpriseFactor: surpriseFactor,
    differenceBonus: differenceBonus,
    coefficient: coefficient,
    points: points
  };
}

/**
 * Calcule la probabilité de victoire selon ELO
 */
function calculateWinProbability(rating1, rating2) {
  return 1.0 / (1.0 + Math.pow(10, (rating2 - rating1) / 400.0));
}

async function simulateCloseVictories() {
  console.log('📊 Simulation: Victoires serrées répétées contre le numéro 1\n');
  console.log('='.repeat(80));

  try {
    // 1. Récupérer Test User 2
    const { data: testUser } = await supabase
      .from('joueurs')
      .select('id, nom_complet, points_classement')
      .eq('nom_complet', 'Test User 2')
      .maybeSingle();

    if (!testUser) {
      console.log('❌ Test User 2 non trouvé');
      return;
    }

    // 2. Récupérer le numéro 1
    const { data: classement } = await supabase
      .from('joueurs')
      .select('id, nom_complet, points_classement')
      .order('points_classement', { ascending: false })
      .limit(1);

    if (!classement || classement.length === 0) {
      console.log('❌ Aucun joueur trouvé');
      return;
    }

    const premier = classement[0];
    const pointsPremier = premier.points_classement;
    const pointsTestUser = testUser.points_classement;
    const ecart = pointsPremier - pointsTestUser;

    console.log(`👤 Joueur: ${testUser.nom_complet}`);
    console.log(`   Points actuels: ${pointsTestUser}`);
    console.log(`\n🏆 Adversaire: ${premier.nom_complet}`);
    console.log(`   Points: ${pointsPremier}`);
    console.log(`   Écart: ${ecart} points\n`);

    // 3. Scénarios de victoires serrées
    const scenarios = [
      { name: 'Victoire très serrée 7-6, 7-6', score: '7-6, 7-6' },
      { name: 'Victoire serrée 7-6, 6-4', score: '7-6, 6-4' },
      { name: 'Victoire serrée 6-4, 7-5', score: '6-4, 7-5' },
      { name: 'Victoire modérée 6-3, 6-4', score: '6-3, 6-4' }
    ];

    console.log('🎯 Scénarios de victoires serrées:\n');

    scenarios.forEach((scenario, index) => {
      const pointsPartenaire = (pointsPremier + pointsTestUser) / 2;
      const pointsEquipeTest = (pointsTestUser + pointsPartenaire) / 2;
      const pointsEquipeAdversaire = (premier.points_classement + pointsPremier) / 2;
      const differenceRating = Math.abs(pointsEquipeTest - pointsEquipeAdversaire);
      const probAttendue = calculateWinProbability(pointsEquipeTest, pointsEquipeAdversaire);
      
      const result = calculatePointsGained(
        scenario.score,
        true,
        probAttendue,
        differenceRating
      );

      const victoiresNecessaires = Math.ceil(ecart / result.points);

      console.log(`${index + 1}. ${scenario.name}`);
      console.log(`   Score: ${scenario.score}`);
      console.log(`   Probabilité attendue: ${(probAttendue * 100).toFixed(2)}%`);
      console.log(`   Facteur Score: ${result.scoreFactor.toFixed(2)}x`);
      console.log(`   Facteur Surprise: ${result.surpriseFactor.toFixed(2)}x`);
      console.log(`   Bonus Différence: ${result.differenceBonus.toFixed(2)}x`);
      console.log(`   Coefficient: ${result.coefficient.toFixed(1)}`);
      console.log(`   Points gagnés par match: +${result.points}`);
      console.log(`   Victoires nécessaires: ${victoiresNecessaires} matchs`);
      console.log(`   Points après ${victoiresNecessaires} victoires: ${pointsTestUser + (victoiresNecessaires * result.points)}`);
      console.log('');
    });

    // 4. Simulation progressive avec victoires serrées 7-6, 6-4
    console.log('📈 Simulation progressive (victoires serrées 7-6, 6-4 contre le numéro 1):\n');
    
    const pointsPartenaire = (pointsPremier + pointsTestUser) / 2;
    let pointsActuels = pointsTestUser;
    let pointsPremierActuels = pointsPremier; // Le numéro 1 perd aussi des points
    let matchs = 0;
    const historique = [];

    while (pointsActuels < pointsPremierActuels && matchs < 200) {
      matchs++;
      
      // Calculer les points moyens des équipes
      const pointsEquipeTest = (pointsActuels + pointsPartenaire) / 2;
      const pointsEquipeAdversaire = (pointsPremierActuels + pointsPremier) / 2;
      const differenceRating = Math.abs(pointsEquipeTest - pointsEquipeAdversaire);
      const probAttendue = calculateWinProbability(pointsEquipeTest, pointsEquipeAdversaire);
      
      // Points gagnés par Test User 2
      const resultGagnant = calculatePointsGained('7-6, 6-4', true, probAttendue, differenceRating);
      pointsActuels += resultGagnant.points;
      
      // Points perdus par le numéro 1 (même calcul mais inversé)
      const probAttendueAdversaire = 1.0 - probAttendue;
      const resultPerdant = calculatePointsGained('7-6, 6-4', false, probAttendueAdversaire, differenceRating);
      pointsPremierActuels += resultPerdant.points; // Résultat négatif donc soustraction
      
      historique.push({
        match: matchs,
        pointsTestUser: pointsActuels,
        pointsPremier: pointsPremierActuels,
        pointsGagnes: resultGagnant.points,
        pointsPerdusPremier: resultPerdant.points,
        probAttendue: probAttendue,
        ecart: pointsPremierActuels - pointsActuels
      });
      
      if (matchs <= 10 || matchs % 20 === 0 || pointsActuels >= pointsPremierActuels) {
        console.log(`   Match ${matchs}: Test User 2 = ${Math.round(pointsActuels)} pts (+${resultGagnant.points}), Premier = ${Math.round(pointsPremierActuels)} pts (${resultPerdant.points}), Écart = ${Math.round(pointsPremierActuels - pointsActuels)} pts`);
      }
      
      // Arrêter si on dépasse le premier
      if (pointsActuels >= pointsPremierActuels) {
        console.log(`\n✅ Après ${matchs} victoires serrées, Test User 2 devient premier!`);
        console.log(`   Points Test User 2: ${Math.round(pointsActuels)}`);
        console.log(`   Points ancien premier: ${Math.round(pointsPremierActuels)}`);
        break;
      }
    }

    if (matchs >= 200) {
      console.log(`\n⚠️ Après 200 matchs, Test User 2 aurait ${Math.round(pointsActuels)} points`);
      console.log(`   Le premier aurait ${Math.round(pointsPremierActuels)} points`);
      console.log(`   Écart restant: ${Math.round(pointsPremierActuels - pointsActuels)} points`);
    }

    // 5. Résumé comparatif
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Comparaison des scénarios:\n');
    
    const victoireEcrasante = calculatePointsGained('6-0, 6-0', true, 0.0, 3000);
    const victoireSerree = calculatePointsGained('7-6, 6-4', true, 0.0, 3000);
    
    console.log(`Victoire écrasante 6-0, 6-0: +${victoireEcrasante.points} points/match`);
    console.log(`   Victoires nécessaires: ${Math.ceil(ecart / victoireEcrasante.points)} matchs\n`);
    
    console.log(`Victoire serrée 7-6, 6-4: +${victoireSerree.points} points/match`);
    console.log(`   Victoires nécessaires: ${Math.ceil(ecart / victoireSerree.points)} matchs\n`);
    
    const ratio = victoireEcrasante.points / victoireSerree.points;
    console.log(`💡 La victoire écrasante est ${ratio.toFixed(1)}x plus efficace que la victoire serrée`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

simulateCloseVictories();

