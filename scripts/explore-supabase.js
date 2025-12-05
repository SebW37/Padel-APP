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

async function exploreDatabase() {
  console.log('🔍 Exploration de la base de données Supabase...\n');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...\n');
  console.log('='.repeat(60));

  // Liste des tables à explorer
  const tables = [
    'joueurs',
    'divisions',
    'clubs',
    'ligues',
    'ligues_joueurs',
    'matchs',
    'defis',
    'notifications',
    'sanctions'
  ];

  const results = {};

  for (const table of tables) {
    try {
      console.log(`\n📊 Table: ${table}`);
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);

      if (error) {
        console.log(`  ❌ Erreur: ${error.message}`);
        results[table] = { error: error.message };
      } else {
        console.log(`  ✅ ${count || data?.length || 0} enregistrement(s) trouvé(s)`);
        if (data && data.length > 0) {
          console.log(`  📋 Exemple de données:`);
          console.log(`     ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
          results[table] = {
            count: count || data.length,
            sample: data[0],
            columns: Object.keys(data[0])
          };
        } else {
          results[table] = { count: 0, empty: true };
        }
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
      results[table] = { error: err.message };
    }
  }

  // Vérifier les utilisateurs auth
  console.log(`\n👥 Utilisateurs authentifiés:`);
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.log(`  ⚠️  Impossible de lister les utilisateurs (nécessite service_role key): ${error.message}`);
    } else {
      console.log(`  ✅ ${users?.length || 0} utilisateur(s) trouvé(s)`);
      if (users && users.length > 0) {
        users.slice(0, 5).forEach(user => {
          console.log(`     - ${user.email} (${user.id})`);
        });
      }
    }
  } catch (err) {
    console.log(`  ⚠️  ${err.message}`);
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ DE LA BASE DE DONNÉES');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([table, info]) => {
    if (info.error) {
      console.log(`❌ ${table}: ${info.error}`);
    } else if (info.empty) {
      console.log(`📭 ${table}: Vide`);
    } else {
      console.log(`✅ ${table}: ${info.count} enregistrement(s)`);
      if (info.columns) {
        console.log(`   Colonnes: ${info.columns.join(', ')}`);
      }
    }
  });

  return results;
}

// Exécuter l'exploration
exploreDatabase().catch(console.error);

