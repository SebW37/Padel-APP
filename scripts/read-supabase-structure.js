import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function readDatabaseStructure() {
  console.log('📚 Lecture de la structure complète de Supabase...\n');

  const structure = {
    url: supabaseUrl,
    tables: {},
    summary: {}
  };

  // Tables principales
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

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(10);

      if (error) {
        structure.tables[table] = { error: error.message };
        structure.summary[table] = `❌ Erreur: ${error.message}`;
      } else {
        const totalCount = count || 0;
        structure.tables[table] = {
          count: totalCount,
          columns: data && data.length > 0 ? Object.keys(data[0]) : [],
          sample: data && data.length > 0 ? data[0] : null,
          allData: data || []
        };
        structure.summary[table] = `✅ ${totalCount} enregistrement(s)`;
      }
    } catch (err) {
      structure.tables[table] = { error: err.message };
      structure.summary[table] = `❌ Exception: ${err.message}`;
    }
  }

  // Sauvegarder dans un fichier JSON pour référence future
  const outputFile = 'supabase-structure.json';
  fs.writeFileSync(outputFile, JSON.stringify(structure, null, 2));
  console.log(`\n💾 Structure sauvegardée dans: ${outputFile}`);

  // Afficher le résumé
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ DE LA BASE DE DONNÉES');
  console.log('='.repeat(60));
  Object.entries(structure.summary).forEach(([table, status]) => {
    console.log(`${status.padEnd(30)} ${table}`);
  });

  return structure;
}

// Exécuter
readDatabaseStructure()
  .then(structure => {
    console.log('\n✅ Exploration terminée!');
    console.log(`📊 Total de tables explorées: ${Object.keys(structure.tables).length}`);
  })
  .catch(console.error);

