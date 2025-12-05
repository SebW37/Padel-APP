import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Test de connexion Supabase...\n');

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  console.log('📋 Configuration:');
  console.log(`   URL: ${url}`);
  console.log(`   Key: ${key?.substring(0, 30)}...`);
  console.log('');

  if (!url || !key) {
    console.error('❌ Variables manquantes!');
    process.exit(1);
  }

  try {
    const supabase = createClient(url, key);

    console.log('🔌 Connexion au serveur...');
    const { data, error } = await supabase
      .from('joueurs')
      .select('id, nom_complet')
      .limit(3);

    if (error) {
      console.error('❌ Erreur:', error);
      process.exit(1);
    }

    console.log('✅ Connexion réussie!\n');
    console.log('👥 Joueurs trouvés:');
    data?.forEach((j, i) => {
      console.log(`   ${i + 1}. ${j.nom_complet}`);
    });

    const { data: ligues } = await supabase
      .from('ligues')
      .select('id, nom, statut')
      .limit(5);

    console.log('\n🏆 Ligues actives:');
    ligues?.forEach((l, i) => {
      console.log(`   ${i + 1}. ${l.nom} (${l.statut})`);
    });

    console.log('\n✅ Toutes les requêtes fonctionnent!\n');
    console.log('🎯 Résultat: CONNEXION EFFECTIVE ✅');

  } catch (err: any) {
    console.error('❌ Exception:', err.message);
    process.exit(1);
  }
}

testConnection();
