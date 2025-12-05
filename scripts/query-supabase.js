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

// Fonction pour lire une table spécifique
export async function readTable(tableName, limit = 10) {
  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' })
    .limit(limit);

  if (error) {
    throw new Error(`Erreur lors de la lecture de ${tableName}: ${error.message}`);
  }

  return {
    table: tableName,
    count: count || data.length,
    data: data || []
  };
}

// Fonction pour lire toutes les tables principales
export async function readAllTables() {
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
      const result = await readTable(table, 100);
      results[table] = result;
    } catch (error) {
      results[table] = { error: error.message };
    }
  }

  return results;
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const tableName = process.argv[2];
  
  if (tableName) {
    readTable(tableName, 20)
      .then(result => {
        console.log(`\n📊 Table: ${result.table}`);
        console.log(`📈 Total: ${result.count} enregistrement(s)`);
        console.log(`\n📋 Données (${result.data.length} premiers):\n`);
        console.log(JSON.stringify(result.data, null, 2));
      })
      .catch(console.error);
  } else {
    readAllTables()
      .then(results => {
        console.log('\n📚 Structure complète de Supabase:\n');
        Object.entries(results).forEach(([table, result]) => {
          if (result.error) {
            console.log(`❌ ${table}: ${result.error}`);
          } else {
            console.log(`✅ ${table}: ${result.count} enregistrement(s)`);
          }
        });
      })
      .catch(console.error);
  }
}

export { supabase };

