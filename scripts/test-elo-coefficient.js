import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

/**
 * Simule le calcul du coefficient ELO selon le nouveau système
 */
function calculateELOCoefficient(score, equipe1Gagnante, probAttendue, differenceRating = 0) {
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
    scoreFactor: scoreFactor.toFixed(2),
    surpriseFactor: surpriseFactor.toFixed(2),
    differenceBonus: differenceBonus.toFixed(2),
    coefficient: coefficient.toFixed(1),
    points: points
  };
}

async function testELOCoefficient() {
  console.log('🧪 Test du système ELO avec coefficient dynamique\n');
  console.log('=' .repeat(80));
  
  const scenarios = [
    {
      name: 'Victoire écrasante (6-0, 6-0) contre adversaire 10x plus fort',
      score: '6-0, 6-0',
      equipe1Gagnante: true,
      probAttendue: 0.05, // 5% de chance
      differenceRating: 3000 // Grande différence
    },
    {
      name: 'Victoire écrasante (6-0, 6-0) contre adversaire égal',
      score: '6-0, 6-0',
      equipe1Gagnante: true,
      probAttendue: 0.50, // 50% de chance
      differenceRating: 0
    },
    {
      name: 'Victoire écrasante (6-0, 6-0) contre adversaire faible',
      score: '6-0, 6-0',
      equipe1Gagnante: true,
      probAttendue: 0.95, // 95% de chance
      differenceRating: 0
    },
    {
      name: 'Victoire serrée (7-6, 6-4) contre adversaire 10x plus fort',
      score: '7-6, 6-4',
      equipe1Gagnante: true,
      probAttendue: 0.05, // 5% de chance
      differenceRating: 3000
    },
    {
      name: 'Victoire serrée (7-6, 6-4) contre adversaire égal',
      score: '7-6, 6-4',
      equipe1Gagnante: true,
      probAttendue: 0.50, // 50% de chance
      differenceRating: 0
    },
    {
      name: 'Victoire nette (6-2, 6-3) contre adversaire 10x plus fort',
      score: '6-2, 6-3',
      equipe1Gagnante: true,
      probAttendue: 0.05, // 5% de chance
      differenceRating: 3000
    },
    {
      name: 'Victoire nette (6-2, 6-3) contre adversaire égal',
      score: '6-2, 6-3',
      equipe1Gagnante: true,
      probAttendue: 0.50, // 50% de chance
      differenceRating: 0
    },
    {
      name: 'Victoire modérée (6-4, 6-4) contre adversaire 10x plus fort',
      score: '6-4, 6-4',
      equipe1Gagnante: true,
      probAttendue: 0.05, // 5% de chance
      differenceRating: 3000
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    const result = calculateELOCoefficient(
      scenario.score,
      scenario.equipe1Gagnante,
      scenario.probAttendue,
      scenario.differenceRating || 0
    );
    
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log(`   Score: ${scenario.score}`);
    console.log(`   Probabilité attendue: ${(scenario.probAttendue * 100).toFixed(1)}%`);
    console.log(`   Facteur Score: ${result.scoreFactor}x`);
    console.log(`   Facteur Surprise: ${result.surpriseFactor}x`);
    console.log(`   Bonus Différence: ${result.differenceBonus}x`);
    console.log(`   Coefficient final: ${result.coefficient}`);
    console.log(`   Points gagnés: ${result.points > 0 ? '+' : ''}${result.points}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Comparaison avec l\'ancien système (K=32 fixe):');
  console.log('   Ancien système: Points = 32 × (1 - probabilité)');
  console.log('   Nouveau système: Points = (32 × score_factor × surprise_factor) × (1 - probabilité)');
  console.log('\n💡 Le nouveau système récompense:');
  console.log('   - Les victoires écrasantes (score_factor élevé)');
  console.log('   - Les victoires surprenantes (surprise_factor élevé)');
  console.log('   - La combinaison des deux (coefficient très élevé)');
}

testELOCoefficient();

