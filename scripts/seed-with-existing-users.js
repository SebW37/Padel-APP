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

const messagesDefis = [
  'Prêt pour un match ?',
  'On se fait un match demain ?',
  'Dispo cette semaine ?',
  'Challenge accepté !',
  'Match de préparation ?',
  'Tu veux jouer ce weekend ?',
  'Disponible pour un défi ?',
  'Match amical ?',
  'On s\'affronte ?',
  'Match sérieux ?'
];

const messagesNotifications = [
  'Nouveau défi reçu',
  'Votre défi a été accepté',
  'Match terminé',
  'Nouvelle ligue créée',
  'Vous avez été ajouté à une ligue',
  'Classement mis à jour',
  'Nouveau match programmé'
];

async function seedWithExistingUsers() {
  console.log('🚀 Création de données de test avec les utilisateurs existants...\n');
  console.log('='.repeat(60));

  try {
    // 1. Récupérer tous les joueurs existants
    console.log('\n1️⃣ Récupération des joueurs existants...');
    const { data: allJoueurs } = await supabase
      .from('joueurs')
      .select('id, nom_complet, points_classement, division_id')
      .limit(100);
    
    if (!allJoueurs || allJoueurs.length < 8) {
      console.error('❌ Pas assez de joueurs! Minimum 8 requis.');
      return;
    }
    console.log(`✅ ${allJoueurs.length} joueurs disponibles\n`);

    // 2. Récupérer les ligues existantes
    console.log('2️⃣ Récupération des ligues existantes...');
    const { data: liguesExistantes } = await supabase
      .from('ligues')
      .select('id, joueurs_ids, createur_id')
      .limit(20);
    console.log(`✅ ${liguesExistantes?.length || 0} ligues existantes\n`);

    // 3. Créer des relations ligues_joueurs pour les ligues existantes
    if (liguesExistantes && liguesExistantes.length > 0) {
      console.log('3️⃣ Création de relations ligues_joueurs...');
      let relationsCrees = 0;
      
      for (const ligue of liguesExistantes) {
        if (ligue.joueurs_ids && Array.isArray(ligue.joueurs_ids)) {
          for (let i = 0; i < ligue.joueurs_ids.length; i++) {
            const joueurId = ligue.joueurs_ids[i];
            
            // Vérifier si la relation existe déjà
            const { data: existing } = await supabase
              .from('ligues_joueurs')
              .select('id')
              .eq('ligue_id', ligue.id)
              .eq('joueur_id', joueurId)
              .maybeSingle();
            
            if (!existing) {
              const { error } = await supabase.from('ligues_joueurs').insert({
                ligue_id: ligue.id,
                joueur_id: joueurId,
                points: Math.floor(Math.random() * 100),
                position: i + 1,
                matchs_joues: Math.floor(Math.random() * 20),
                victoires: Math.floor(Math.random() * 15),
                defaites: Math.floor(Math.random() * 10)
              });
              
              if (!error) relationsCrees++;
            }
          }
        }
      }
      console.log(`✅ ${relationsCrees} relations ligues_joueurs créées\n`);
    }

    // 4. Créer des matchs (2v2) - Utiliser les joueurs existants
    console.log('4️⃣ Création de 50 matchs (2v2)...');
    let matchsCrees = 0;

    for (let i = 0; i < 50; i++) {
      // Sélectionner 4 joueurs différents
      const joueurs = [];
      const joueursDisponibles = [...allJoueurs];
      
      for (let j = 0; j < 4 && joueursDisponibles.length > 0; j++) {
        const index = Math.floor(Math.random() * joueursDisponibles.length);
        joueurs.push(joueursDisponibles[index]);
        joueursDisponibles.splice(index, 1);
      }

      if (joueurs.length < 4) continue;

      // Générer un score réaliste
      const set1_j1 = Math.floor(Math.random() * 7);
      const set1_j2 = set1_j1 === 6 ? Math.floor(Math.random() * 5) : (Math.random() > 0.5 ? 6 : Math.floor(Math.random() * 6));
      const set2_j1 = Math.floor(Math.random() * 7);
      const set2_j2 = set2_j1 === 6 ? Math.floor(Math.random() * 5) : (Math.random() > 0.5 ? 6 : Math.floor(Math.random() * 6));
      
      const equipe1Gagne = (set1_j1 > set1_j2 && set2_j1 >= set2_j2) || 
                          (set1_j1 >= set1_j2 && set2_j1 > set2_j2);

      const score = `${set1_j1}-${set1_j2}, ${set2_j1}-${set2_j2}`;
      
      // Date aléatoire dans les 60 derniers jours
      const dateMatch = new Date();
      dateMatch.setDate(dateMatch.getDate() - Math.floor(Math.random() * 60));

      const { error } = await supabase.from('matchs').insert({
        joueur1_id: joueurs[0].id,
        joueur2_id: joueurs[1].id,
        joueur3_id: joueurs[2].id,
        joueur4_id: joueurs[3].id,
        score,
        statut: 'valide',
        date_match: dateMatch.toISOString(),
        validations: {
          [joueurs[0].id]: true,
          [joueurs[1].id]: true,
          [joueurs[2].id]: true,
          [joueurs[3].id]: true
        },
        duree_minutes: 60 + Math.floor(Math.random() * 60),
        equipe1_gagnante: equipe1Gagne
      });

      if (!error) matchsCrees++;
    }
    console.log(`✅ ${matchsCrees} matchs créés\n`);

    // 5. Créer des défis
    console.log('5️⃣ Création de 60 défis...');
    let defisCrees = 0;

    for (let i = 0; i < 60; i++) {
      const expediteur = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
      let destinataire = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
      while (destinataire.id === expediteur.id) {
        destinataire = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
      }

      const statuts = ['en_attente', 'en_attente', 'accepte', 'refuse', 'termine'];
      const statut = statuts[Math.floor(Math.random() * statuts.length)];

      const dateExpiration = new Date();
      dateExpiration.setDate(dateExpiration.getDate() + Math.floor(Math.random() * 7) + 1);

      const defiData = {
        expediteur_id: expediteur.id,
        destinataire_id: destinataire.id,
        message: messagesDefis[Math.floor(Math.random() * messagesDefis.length)],
        statut,
        date_expiration: dateExpiration.toISOString()
      };

      // Si accepté, ajouter les équipes
      if (statut === 'accepte' || statut === 'termine') {
        const equipe1_j1 = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
        let equipe1_j2 = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
        while (equipe1_j2.id === equipe1_j1.id) {
          equipe1_j2 = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
        }
        
        let equipe2_j1 = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
        while (equipe2_j1.id === equipe1_j1.id || equipe2_j1.id === equipe1_j2.id) {
          equipe2_j1 = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
        }
        
        let equipe2_j2 = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
        while (equipe2_j2.id === equipe1_j1.id || equipe2_j2.id === equipe1_j2.id || equipe2_j2.id === equipe2_j1.id) {
          equipe2_j2 = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
        }

        defiData.equipe1_joueur1_id = equipe1_j1.id;
        defiData.equipe1_joueur2_id = equipe1_j2.id;
        defiData.equipe2_joueur1_id = equipe2_j1.id;
        defiData.equipe2_joueur2_id = equipe2_j2.id;

        if (statut === 'termine') {
          defiData.score_equipe1 = Math.floor(Math.random() * 3) + 1;
          defiData.score_equipe2 = Math.floor(Math.random() * 3) + 1;
        }
      }

      const { error } = await supabase.from('defis').insert(defiData);
      if (!error) defisCrees++;
    }
    console.log(`✅ ${defisCrees} défis créés\n`);

    // 6. Créer des notifications
    console.log('6️⃣ Création de 100 notifications...');
    let notificationsCrees = 0;

    for (let i = 0; i < 100; i++) {
      const destinataire = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
      const type = ['defi', 'match', 'ligue', 'classement', 'message'][Math.floor(Math.random() * 5)];
      
      const { error } = await supabase.from('notifications').insert({
        destinataire_id: destinataire.id,
        type,
        titre: messagesNotifications[Math.floor(Math.random() * messagesNotifications.length)],
        message: `Notification de test ${i + 1}`,
        donnees: {},
        lu: Math.random() > 0.5,
        date_expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (!error) notificationsCrees++;
    }
    console.log(`✅ ${notificationsCrees} notifications créées\n`);

    // 7. Mettre à jour les statistiques des joueurs
    console.log('7️⃣ Mise à jour des statistiques des joueurs...');
    const { data: matchs } = await supabase.from('matchs').select('joueur1_id, joueur2_id, joueur3_id, joueur4_id, equipe1_gagnante');
    
    if (matchs) {
      const stats = {};
      matchs.forEach(match => {
        const joueurs = [match.joueur1_id, match.joueur2_id, match.joueur3_id, match.joueur4_id];
        const equipe1 = [match.joueur1_id, match.joueur2_id];
        
        joueurs.forEach(joueurId => {
          if (!stats[joueurId]) {
            stats[joueurId] = { matchs_joues: 0, victoires: 0, defaites: 0 };
          }
          stats[joueurId].matchs_joues++;
          
          const estEquipe1 = equipe1.includes(joueurId);
          if ((estEquipe1 && match.equipe1_gagnante) || (!estEquipe1 && !match.equipe1_gagnante)) {
            stats[joueurId].victoires++;
          } else {
            stats[joueurId].defaites++;
          }
        });
      });

      for (const [joueurId, stat] of Object.entries(stats)) {
        await supabase.from('joueurs')
          .update({
            matchs_joues: stat.matchs_joues,
            victoires: stat.victoires,
            defaites: stat.defaites
          })
          .eq('id', joueurId);
      }
    }
    console.log('✅ Statistiques mises à jour\n');

    // Résumé final
    let relationsCrees = 0;
    if (liguesExistantes && liguesExistantes.length > 0) {
      for (const ligue of liguesExistantes) {
        if (ligue.joueurs_ids && Array.isArray(ligue.joueurs_ids)) {
          relationsCrees += ligue.joueurs_ids.length;
        }
      }
    }

    console.log('='.repeat(60));
    console.log('🎉 DONNÉES DE TEST CRÉÉES!');
    console.log('='.repeat(60));
    console.log(`✅ Joueurs disponibles: ${allJoueurs.length}`);
    console.log(`✅ Relations ligues_joueurs: ${relationsCrees}`);
    console.log(`✅ Matchs: ${matchsCrees}`);
    console.log(`✅ Défis: ${defisCrees}`);
    console.log(`✅ Notifications: ${notificationsCrees}`);
    console.log('\n✅ Base de données prête pour tous les tests!');

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

seedWithExistingUsers();

