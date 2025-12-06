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

async function checkLastMatch() {
  console.log('🔍 Vérification du dernier match enregistré...\n');

  try {
    // 1. Récupérer les 5 derniers matchs avec les noms des joueurs
    const { data: matchs, error } = await supabase
      .from('matchs')
      .select(`
        id,
        date_match,
        score,
        statut,
        equipe1_gagnante,
        created_at,
        joueur1:joueurs!matchs_joueur1_id_fkey(nom_complet),
        joueur2:joueurs!matchs_joueur2_id_fkey(nom_complet),
        joueur3:joueurs!matchs_joueur3_id_fkey(nom_complet),
        joueur4:joueurs!matchs_joueur4_id_fkey(nom_complet)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    console.log(`✅ ${matchs?.length || 0} match(s) trouvé(s)\n`);

    if (matchs && matchs.length > 0) {
      console.log('📊 Derniers matchs enregistrés:\n');
      matchs.forEach((match, index) => {
        console.log(`${index + 1}. Match ID: ${match.id}`);
        console.log(`   Date: ${new Date(match.date_match).toLocaleString('fr-FR')}`);
        console.log(`   Score: ${match.score}`);
        console.log(`   Statut: ${match.statut}`);
        console.log(`   Équipe 1: ${match.joueur1?.nom_complet} & ${match.joueur2?.nom_complet}`);
        console.log(`   Équipe 2: ${match.joueur3?.nom_complet} & ${match.joueur4?.nom_complet}`);
        console.log(`   Gagnant: ${match.equipe1_gagnante ? 'Équipe 1' : 'Équipe 2'}`);
        console.log(`   Créé le: ${new Date(match.created_at).toLocaleString('fr-FR')}`);
        console.log('');
      });

      // 2. Chercher spécifiquement le match avec "Test User 2" et "Marie Laurent 15"
      const matchRecherche = matchs.find(m => {
        const joueurs = [
          m.joueur1?.nom_complet,
          m.joueur2?.nom_complet,
          m.joueur3?.nom_complet,
          m.joueur4?.nom_complet
        ];
        return joueurs.includes('Test User 2') && 
               (joueurs.includes('Marie Laurent 15') || joueurs.includes('Carlos Martinez'));
      });

      if (matchRecherche) {
        console.log('🎯 MATCH TROUVÉ!');
        console.log(`   Score: ${matchRecherche.score}`);
        console.log(`   Équipe 1: ${matchRecherche.joueur1?.nom_complet} & ${matchRecherche.joueur2?.nom_complet}`);
        console.log(`   Équipe 2: ${matchRecherche.joueur3?.nom_complet} & ${matchRecherche.joueur4?.nom_complet}`);
        console.log(`   Gagnant: ${matchRecherche.equipe1_gagnante ? 'Équipe 1' : 'Équipe 2'}\n`);
      }

      // 3. Vérifier les statistiques de "Test User 2"
      const { data: testUser } = await supabase
        .from('joueurs')
        .select('nom_complet, matchs_joues, victoires, defaites, points_classement, updated_at')
        .eq('nom_complet', 'Test User 2')
        .maybeSingle();

      if (testUser) {
        console.log('📊 Statistiques de Test User 2:');
        console.log(`   Matchs joués: ${testUser.matchs_joues}`);
        console.log(`   Victoires: ${testUser.victoires}`);
        console.log(`   Défaites: ${testUser.defaites}`);
        console.log(`   Points: ${testUser.points_classement}`);
        console.log(`   Dernière mise à jour: ${new Date(testUser.updated_at).toLocaleString('fr-FR')}\n`);
      }
    } else {
      console.log('❌ Aucun match trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkLastMatch();


