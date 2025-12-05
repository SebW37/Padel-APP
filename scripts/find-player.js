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

async function findPlayer() {
  const searchTerm = process.argv[2] || 'Sofia Rodriguez';
  
  console.log(`🔍 Recherche de joueurs contenant "${searchTerm}"...\n`);

  try {
    const { data: joueurs, error } = await supabase
      .from('joueurs')
      .select('id, nom_complet')
      .ilike('nom_complet', `%${searchTerm}%`)
      .order('nom_complet')
      .limit(20);

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    if (joueurs && joueurs.length > 0) {
      console.log(`✅ ${joueurs.length} joueur(s) trouvé(s):\n`);
      joueurs.forEach((j, index) => {
        console.log(`${index + 1}. ${j.nom_complet} (ID: ${j.id})`);
      });
    } else {
      console.log('❌ Aucun joueur trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

findPlayer();

