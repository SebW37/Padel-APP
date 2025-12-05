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
  const kBase = 50; // K-factor augmenté
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
    const ecart = jeuxGagnesEquipe1 - jeuxGagnesEquipe2;
    const totalJeux = jeuxGagnesEquipe1 + jeuxGagnesEquipe2;
    const ratioDomination = totalJeux > 0 ? jeuxGagnesEquipe1 / totalJeux : 0.5;
    
    if (jeuxPerdusEquipe1 === 0) {
      scoreFactor = 2.5; // Victoire parfaite 6-0, 6-0
    } else if (ratioDomination >= 0.85) {
      scoreFactor = 2.0 + (ratioDomination - 0.85) * 3.33; // 2.0 à 2.5
    } else if (ratioDomination >= 0.70) {
      scoreFactor = 1.5 + (ratioDomination - 0.70) * 3.33; // 1.5 à 2.0
    } else if (ratioDomination >= 0.60) {
      scoreFactor = 1.2 + (ratioDomination - 0.60) * 3.0; // 1.2 à 1.5
    } else if (ecart >= 4) {
      scoreFactor = 1.1;
    } else {
      scoreFactor = 1.0;
    }
  } else {
    const ecart = jeuxGagnesEquipe2 - jeuxGagnesEquipe1;
    const totalJeux = jeuxGagnesEquipe1 + jeuxGagnesEquipe2;
    const ratioDomination = totalJeux > 0 ? jeuxGagnesEquipe2 / totalJeux : 0.5;
    
    if (jeuxPerdusEquipe2 === 0) {
      scoreFactor = 2.5; // Victoire parfaite 6-0, 6-0
    } else if (ratioDomination >= 0.85) {
      scoreFactor = 2.0 + (ratioDomination - 0.85) * 3.33; // 2.0 à 2.5
    } else if (ratioDomination >= 0.70) {
      scoreFactor = 1.5 + (ratioDomination - 0.70) * 3.33; // 1.5 à 2.0
    } else if (ratioDomination >= 0.60) {
      scoreFactor = 1.2 + (ratioDomination - 0.60) * 3.0; // 1.2 à 1.5
    } else if (ecart >= 4) {
      scoreFactor = 1.1;
    } else {
      scoreFactor = 1.0;
    }
  }
  
  // Facteur de surprise (plus agressif)
  surpriseFactor = 1.0 + (1.0 - probAttendue) * 1.5;
  
  // Bonus différence (non-linéaire)
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
  
  // Coefficient final (avec bonus différence)
  const coefficient = kBase * scoreFactor * surpriseFactor * differenceBonus;
  
  // Points gagnés
  const actual = equipe1Gagnante ? 1 : 0;
  const points = Math.round(coefficient * (actual - probAttendue));
  
  return {
    scoreFactor: scoreFactor,
    surpriseFactor: surpriseFactor,
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

async function estimateVictoriesToFirst() {
  console.log('📊 Estimation: Victoires écrasantes nécessaires pour arriver premier\n');
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

    console.log(`👤 Joueur: ${testUser.nom_complet}`);
    console.log(`   Points actuels: ${testUser.points_classement}\n`);

    // 2. Récupérer le classement complet
    const { data: classement, error } = await supabase
      .from('joueurs')
      .select('id, nom_complet, points_classement')
      .order('points_classement', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    if (!classement || classement.length === 0) {
      console.log('❌ Aucun joueur trouvé');
      return;
    }

    // 3. Trouver la position de Test User 2
    const positionTestUser = classement.findIndex(j => j.id === testUser.id);
    const premier = classement[0];
    const pointsPremier = premier.points_classement;
    const pointsTestUser = testUser.points_classement;
    const ecart = pointsPremier - pointsTestUser;

    console.log(`🏆 Premier du classement: ${premier.nom_complet}`);
    console.log(`   Points: ${pointsPremier}`);
    console.log(`   Écart avec Test User 2: ${ecart} points\n`);

    if (positionTestUser === 0) {
      console.log('✅ Test User 2 est déjà premier du classement!');
      return;
    }

    if (positionTestUser === -1) {
      console.log(`📊 Position: Non classé dans le top 10`);
    } else {
      console.log(`📊 Position actuelle: ${positionTestUser + 1}ème\n`);
    }

    // 4. Scénarios de victoires
    const scenarios = [
      {
        name: 'Victoire écrasante 6-0, 6-0 contre le numéro 1',
        score: '6-0, 6-0',
        adversaire: premier,
        equipe1Gagnante: true
      },
      {
        name: 'Victoire écrasante 6-0, 6-0 contre un joueur du top 3',
        score: '6-0, 6-0',
        adversaire: classement[2] || classement[1] || premier,
        equipe1Gagnante: true
      },
      {
        name: 'Victoire nette 6-2, 6-2 contre le numéro 1',
        score: '6-2, 6-2',
        adversaire: premier,
        equipe1Gagnante: true
      },
      {
        name: 'Victoire serrée 7-6, 6-4 contre le numéro 1',
        score: '7-6, 6-4',
        adversaire: premier,
        equipe1Gagnante: true
      }
    ];

    console.log('🎯 Scénarios de victoires:\n');

    scenarios.forEach((scenario, index) => {
      // Calculer la probabilité de victoire
      // On suppose que Test User 2 joue avec un partenaire de niveau moyen
      // Pour simplifier, on prend la moyenne des points de Test User 2 et un partenaire moyen
      const pointsPartenaire = (pointsPremier + pointsTestUser) / 2; // Partenaire de niveau moyen
      const pointsEquipeTest = (pointsTestUser + pointsPartenaire) / 2;
      const pointsEquipeAdversaire = (scenario.adversaire.points_classement + pointsPremier) / 2;
      
      const probAttendue = calculateWinProbability(pointsEquipeTest, pointsEquipeAdversaire);
      
      const differenceRating = Math.abs(pointsEquipeTest - pointsEquipeAdversaire);
      
      const result = calculatePointsGained(
        scenario.score,
        scenario.equipe1Gagnante,
        probAttendue,
        differenceRating
      );

      const victoiresNecessaires = Math.ceil(ecart / result.points);

      console.log(`${index + 1}. ${scenario.name}`);
      console.log(`   Adversaire: ${scenario.adversaire.nom_complet} (${scenario.adversaire.points_classement} pts)`);
      console.log(`   Score: ${scenario.score}`);
      console.log(`   Probabilité attendue: ${(probAttendue * 100).toFixed(2)}%`);
      console.log(`   Facteur Score: ${result.scoreFactor.toFixed(2)}x`);
      console.log(`   Facteur Surprise: ${result.surpriseFactor.toFixed(2)}x`);
      console.log(`   Coefficient: ${result.coefficient.toFixed(1)}`);
      console.log(`   Points gagnés par match: +${result.points}`);
      console.log(`   Victoires nécessaires: ${victoiresNecessaires} matchs`);
      console.log(`   Points après ${victoiresNecessaires} victoires: ${pointsTestUser + (victoiresNecessaires * result.points)}`);
      console.log('');
    });

    // 5. Simulation progressive
    console.log('📈 Simulation progressive (victoires 6-0, 6-0 contre le numéro 1):\n');
    
    const pointsPartenaire = (pointsPremier + pointsTestUser) / 2;
    let pointsActuels = pointsTestUser;
    let matchs = 0;
    const historique = [];

    while (pointsActuels < pointsPremier && matchs < 100) {
      matchs++;
      const pointsEquipeTest = (pointsActuels + pointsPartenaire) / 2;
      const pointsEquipeAdversaire = (premier.points_classement + pointsPremier) / 2;
      const probAttendue = calculateWinProbability(pointsEquipeTest, pointsEquipeAdversaire);
      
      const differenceRating = Math.abs(pointsEquipeTest - pointsEquipeAdversaire);
      const result = calculatePointsGained('6-0, 6-0', true, probAttendue, differenceRating);
      pointsActuels += result.points;
      
      historique.push({
        match: matchs,
        points: pointsActuels,
        pointsGagnes: result.points,
        probAttendue: probAttendue
      });
      
      if (matchs <= 10 || matchs % 10 === 0 || pointsActuels >= pointsPremier) {
        console.log(`   Match ${matchs}: ${pointsActuels.toFixed(0)} pts (+${result.points}, prob: ${(probAttendue * 100).toFixed(2)}%)`);
      }
      
      // Arrêter si on dépasse le premier
      if (pointsActuels >= pointsPremier) {
        console.log(`\n✅ Après ${matchs} victoires écrasantes, Test User 2 devient premier avec ${Math.round(pointsActuels)} points!`);
        break;
      }
    }

    if (matchs >= 100) {
      console.log(`\n⚠️ Après 100 matchs, Test User 2 aurait ${Math.round(pointsActuels)} points (encore ${Math.round(pointsPremier - pointsActuels)} points de retard)`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Note: Cette estimation suppose que:');
    console.log('   - Test User 2 joue toujours avec un partenaire de niveau moyen');
    console.log('   - Le numéro 1 ne gagne pas de points entre-temps');
    console.log('   - Chaque victoire est une victoire écrasante 6-0, 6-0');
    console.log('   - La probabilité de victoire augmente progressivement (car Test User 2 gagne des points)');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

estimateVictoriesToFirst();

