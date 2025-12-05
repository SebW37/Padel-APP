import dotenv from 'dotenv';

dotenv.config();

/**
 * Simule le nouveau système ELO avec K-factor adaptatif
 */
function calculatePointsGained(score, equipe1Gagnante, probAttendue, differenceRating = 0, avgMatchs = 100) {
  // K-factor adaptatif selon le nombre de matchs
  let kBase;
  if (avgMatchs < 5) {
    kBase = 150; // Très nouveau joueur
  } else if (avgMatchs < 10) {
    kBase = 120; // Nouveau joueur
  } else if (avgMatchs < 20) {
    kBase = 90; // Joueur en développement
  } else if (avgMatchs < 50) {
    kBase = 70; // Joueur expérimenté
  } else {
    kBase = 50; // Joueur très expérimenté
  }
  
  let scoreFactor = 1.0;
  
  // Parser le score
  const scoreParts = score.split(',');
  let jeuxPerdusEquipe1 = 0;
  let jeuxPerdusEquipe2 = 0;
  
  scoreParts.forEach(part => {
    const trimmed = part.trim();
    const match = trimmed.match(/^(\d+)-(\d+)$/);
    if (match) {
      const e1 = parseInt(match[1]);
      const e2 = parseInt(match[2]);
      jeuxPerdusEquipe1 += e2;
      jeuxPerdusEquipe2 += e1;
    }
  });
  
  // Score factor
  if (equipe1Gagnante) {
    if (jeuxPerdusEquipe1 === 0) {
      scoreFactor = 3.0;
    } else if (jeuxPerdusEquipe1 <= 3) {
      scoreFactor = 2.5;
    } else if (jeuxPerdusEquipe1 <= 6) {
      scoreFactor = 2.0;
    } else if (jeuxPerdusEquipe1 <= 9) {
      scoreFactor = 1.5;
    } else {
      scoreFactor = 1.2;
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
  
  // Surprise factor
  const surpriseFactor = Math.max(1.0, Math.min(2.5, 1.0 + (1.0 - probAttendue) * 1.5));
  
  // Bonus différence
  let differenceBonus = 1.0;
  if (differenceRating > 3000) {
    differenceBonus = 2.5;
  } else if (differenceRating > 2000) {
    differenceBonus = 2.0;
  } else if (differenceRating > 1000) {
    differenceBonus = 1.6;
  } else if (differenceRating > 500) {
    differenceBonus = 1.3;
  }
  
  // Coefficient final
  const coefficient = kBase * scoreFactor * surpriseFactor * differenceBonus;
  
  // Points gagnés
  const actual = equipe1Gagnante ? 1 : 0;
  const points = Math.round(coefficient * (actual - probAttendue));
  
  return {
    kFactor: kBase,
    scoreFactor: scoreFactor,
    surpriseFactor: surpriseFactor,
    differenceBonus: differenceBonus,
    coefficient: coefficient,
    points: points
  };
}

async function testNewELOSystem() {
  console.log('🧪 Test du nouveau système ELO avec K-factor adaptatif\n');
  console.log('='.repeat(80));

  const scenarios = [
    {
      name: 'Nouveau joueur (3 matchs) bat numéro 1 avec 6-0, 6-0',
      score: '6-0, 6-0',
      equipe1Gagnante: true,
      probAttendue: 0.01,
      differenceRating: 3000,
      avgMatchs: 3
    },
    {
      name: 'Joueur débutant (8 matchs) bat numéro 1 avec 6-0, 6-0',
      score: '6-0, 6-0',
      equipe1Gagnante: true,
      probAttendue: 0.01,
      differenceRating: 3000,
      avgMatchs: 8
    },
    {
      name: 'Joueur expérimenté (100 matchs) bat numéro 1 avec 6-0, 6-0',
      score: '6-0, 6-0',
      equipe1Gagnante: true,
      probAttendue: 0.01,
      differenceRating: 3000,
      avgMatchs: 100
    },
    {
      name: 'Nouveau joueur (3 matchs) bat numéro 1 avec 7-6, 6-4',
      score: '7-6, 6-4',
      equipe1Gagnante: true,
      probAttendue: 0.01,
      differenceRating: 3000,
      avgMatchs: 3
    },
    {
      name: 'Nouveau joueur (3 matchs) perd contre numéro 1 avec 0-6, 0-6',
      score: '0-6, 0-6',
      equipe1Gagnante: false,
      probAttendue: 0.01,
      differenceRating: 3000,
      avgMatchs: 3
    },
    {
      name: 'Joueur expérimenté (100 matchs) perd contre faible avec 0-6, 0-6',
      score: '0-6, 0-6',
      equipe1Gagnante: false,
      probAttendue: 0.99,
      differenceRating: 3000,
      avgMatchs: 100
    }
  ];

  scenarios.forEach((scenario, index) => {
    const result = calculatePointsGained(
      scenario.score,
      scenario.equipe1Gagnante,
      scenario.probAttendue,
      scenario.differenceRating,
      scenario.avgMatchs
    );

    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Score: ${scenario.score}`);
    console.log(`   Probabilité attendue: ${(scenario.probAttendue * 100).toFixed(1)}%`);
    console.log(`   Nombre de matchs moyen: ${scenario.avgMatchs}`);
    console.log(`   K-factor: ${result.kFactor}`);
    console.log(`   Facteur Score: ${result.scoreFactor.toFixed(2)}x`);
    console.log(`   Facteur Surprise: ${result.surpriseFactor.toFixed(2)}x`);
    console.log(`   Bonus Différence: ${result.differenceBonus.toFixed(2)}x`);
    console.log(`   Coefficient final: ${result.coefficient.toFixed(1)}`);
    console.log(`   Points ${scenario.equipe1Gagnante ? 'gagnés' : 'perdus'}: ${result.points > 0 ? '+' : ''}${result.points}`);
    console.log('');
  });

  // Simulation pour nouveau joueur
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 Simulation: Nouveau joueur (3 matchs) bat le numéro 1 à répétition\n');
  
  let pointsActuels = 455;
  let matchs = 0;
  const ecartInitial = 8262;
  
  while (pointsActuels < 8717 && matchs < 10) {
    matchs++;
    const probAttendue = 1.0 / (1.0 + Math.pow(10, (8717 - pointsActuels) / 400.0));
    const result = calculatePointsGained('6-0, 6-0', true, probAttendue, 3000, 3 + matchs);
    pointsActuels += result.points;
    
    console.log(`Match ${matchs}: ${Math.round(pointsActuels)} points (+${result.points}, prob: ${(probAttendue * 100).toFixed(2)}%)`);
    
    if (pointsActuels >= 8717) {
      console.log(`\n✅ Après ${matchs} victoires, le nouveau joueur devient premier!`);
      break;
    }
  }

  console.log('\n💡 Avantages du nouveau système:');
  console.log('   - Nouveaux joueurs progressent 3x plus vite (K=150 vs K=50)');
  console.log('   - Système de perte cohérent (même formule inversée)');
  console.log('   - Les très bons joueurs qui débutent peuvent rapidement atteindre leur niveau');
}

testNewELOSystem();

