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

// Données de test
const firstNames = {
  M: ['Carlos', 'Jean', 'Antonio', 'Lucas', 'Marco', 'Miguel', 'Pablo', 'Diego', 'Sergio', 'Roberto', 'François', 'Pierre', 'Thomas', 'Nicolas', 'David'],
  F: ['Sofia', 'Maria', 'Emma', 'Isabella', 'Camila', 'Lucia', 'Ana', 'Laura', 'Clara', 'Elena', 'Sophie', 'Marie', 'Julie', 'Amélie', 'Sarah']
};

const lastNames = ['Martinez', 'Rodriguez', 'Dubois', 'Santos', 'Garcia', 'Silva', 'Lopez', 'Fernandez', 'Torres', 'Moreno', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Diaz', 'Laurent', 'Martin', 'Bernard', 'Thomas', 'Petit'];

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

async function seedCompleteDatabase() {
  console.log('🚀 Création d\'une base de données complète pour les tests...\n');
  console.log('='.repeat(60));

  try {
    // 1. Récupérer les divisions et clubs existants
    console.log('\n1️⃣ Récupération des divisions et clubs...');
    const { data: divisions } = await supabase.from('divisions').select('*').order('niveau');
    const { data: clubs } = await supabase.from('clubs').select('*').limit(10);
    
    if (!divisions || divisions.length === 0 || !clubs || clubs.length === 0) {
      console.error('❌ Divisions ou clubs manquants!');
      return;
    }
    console.log(`✅ ${divisions.length} divisions, ${clubs.length} clubs\n`);

    // 2. Créer des utilisateurs auth et profils joueurs
    console.log('2️⃣ Création de 30 joueurs avec comptes auth...');
    const joueursCrees = [];
    const password = 'Test123456!';

    // Fonction pour attendre
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < 30; i++) {
      // Attendre 500ms entre chaque création pour éviter le rate limit
      if (i > 0) await wait(500);
      const sexe = Math.random() > 0.5 ? 'M' : 'F';
      const firstName = firstNames[sexe][Math.floor(Math.random() * firstNames[sexe].length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `test${i + 1}@padel.com`;
      const nomComplet = `${firstName} ${lastName}${i > 0 ? ` ${i}` : ''}`;

      try {
        // Créer le compte auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nom_complet: nomComplet }
          }
        });

        if (authError && !authError.message.includes('already registered')) {
          console.log(`⚠️  Erreur création ${email}: ${authError.message}`);
          continue;
        }

        if (authData?.user) {
          const userId = authData.user.id;
          
          // Sélectionner division et club
          const divisionIndex = Math.min(
            Math.floor(Math.random() * Math.random() * divisions.length),
            divisions.length - 1
          );
          const division = divisions[divisionIndex];
          const club = clubs[Math.floor(Math.random() * clubs.length)];

          // Calculer points selon division
          const points = division.points_minimum + 
            Math.floor(Math.random() * (division.points_maximum - division.points_minimum + 1));

          // Créer profil joueur
          const { error: joueurError } = await supabase.from('joueurs').insert({
            id: userId,
            nom_complet: nomComplet,
            date_naissance: new Date(1980 + Math.floor(Math.random() * 25), 
              Math.floor(Math.random() * 12), 
              Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
            sexe,
            club_id: club.id,
            points_classement: points,
            division_id: division.id,
            preference_langue: ['fr', 'es', 'en', 'it'][Math.floor(Math.random() * 4)],
            confidentialite: {
              masquer_position: Math.random() > 0.8,
              masquer_profil: Math.random() > 0.9,
              statut_en_ligne: Math.random() > 0.3
            },
            badges: [],
            victoires: 0,
            defaites: 0,
            matchs_joues: 0
          });

          if (!joueurError) {
            joueursCrees.push({
              id: userId,
              email,
              nom_complet: nomComplet,
              points_classement: points,
              division_id: division.id
            });
          }
        }
      } catch (err) {
        console.log(`⚠️  Exception pour ${email}: ${err.message}`);
      }
    }

    console.log(`✅ ${joueursCrees.length} joueurs créés\n`);

    // 3. Récupérer tous les joueurs (existants + nouveaux)
    console.log('3️⃣ Récupération de tous les joueurs...');
    const { data: allJoueurs } = await supabase.from('joueurs').select('id, nom_complet, points_classement').limit(100);
    if (!allJoueurs || allJoueurs.length < 8) {
      console.error('❌ Pas assez de joueurs!');
      return;
    }
    console.log(`✅ ${allJoueurs.length} joueurs disponibles\n`);

    // 4. Créer des ligues
    console.log('4️⃣ Création de 10 ligues...');
    const liguesCrees = [];
    
    for (let i = 0; i < 10; i++) {
      const createur = allJoueurs[Math.floor(Math.random() * allJoueurs.length)];
      const nombreJoueurs = [8, 10, 12, 16][Math.floor(Math.random() * 4)];
      const joueursIds = [];
      
      // Sélectionner des joueurs aléatoires
      const joueursDisponibles = [...allJoueurs].filter(j => j.id !== createur.id);
      for (let j = 0; j < nombreJoueurs - 1 && joueursDisponibles.length > 0; j++) {
        const index = Math.floor(Math.random() * joueursDisponibles.length);
        joueursIds.push(joueursDisponibles[index].id);
        joueursDisponibles.splice(index, 1);
      }
      joueursIds.unshift(createur.id);

      const formats = ['americano', 'paires_fixes'];
      const statuts = ['active', 'active', 'active', 'terminee', 'en_attente'];
      
      const { data: ligue, error } = await supabase.from('ligues').insert({
        nom: `Ligue ${['Printemps', 'Été', 'Automne', 'Hiver', 'Championnat'][i % 5]} ${2024 + Math.floor(i / 5)}`,
        description: `Ligue de test ${i + 1}`,
        format: formats[Math.floor(Math.random() * formats.length)],
        nombre_joueurs: nombreJoueurs,
        joueurs_ids: joueursIds,
        statut: statuts[Math.floor(Math.random() * statuts.length)],
        createur_id: createur.id
      }).select().single();

      if (error) {
        console.log(`⚠️  Erreur création ligue ${i + 1}: ${error.message}`);
      } else if (ligue) {
        liguesCrees.push(ligue);
        
        // Créer les relations ligues_joueurs
        for (let j = 0; j < joueursIds.length; j++) {
          const { error: ljError } = await supabase.from('ligues_joueurs').insert({
            ligue_id: ligue.id,
            joueur_id: joueursIds[j],
            points: Math.floor(Math.random() * 100),
            position: j + 1,
            matchs_joues: Math.floor(Math.random() * 20),
            victoires: Math.floor(Math.random() * 15),
            defaites: Math.floor(Math.random() * 10)
          });
          if (ljError) {
            console.log(`⚠️  Erreur relation ligue-joueur: ${ljError.message}`);
          }
        }
      }
    }
    console.log(`✅ ${liguesCrees.length} ligues créées avec relations\n`);

    // 5. Créer des matchs (2v2)
    console.log('5️⃣ Création de 100 matchs (2v2)...');
    let matchsCrees = 0;

    for (let i = 0; i < 100; i++) {
      // Sélectionner 4 joueurs différents
      const joueurs = [];
      const joueursDisponibles = [...allJoueurs];
      
      for (let j = 0; j < 4; j++) {
        const index = Math.floor(Math.random() * joueursDisponibles.length);
        joueurs.push(joueursDisponibles[index]);
        joueursDisponibles.splice(index, 1);
      }

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

    // 6. Créer des défis
    console.log('6️⃣ Création de 80 défis...');
    let defisCrees = 0;

    for (let i = 0; i < 80; i++) {
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

      // Si accepté, ajouter les équipes et scores
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

    // 7. Créer des notifications
    console.log('7️⃣ Création de 150 notifications...');
    let notificationsCrees = 0;

    for (let i = 0; i < 150; i++) {
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

    // 8. Mettre à jour les statistiques des joueurs
    console.log('8️⃣ Mise à jour des statistiques des joueurs...');
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
    console.log('='.repeat(60));
    console.log('🎉 BASE DE DONNÉES COMPLÈTE CRÉÉE!');
    console.log('='.repeat(60));
    console.log(`✅ Joueurs: ${allJoueurs.length}`);
    console.log(`✅ Ligues: ${liguesCrees.length}`);
    console.log(`✅ Matchs: ${matchsCrees}`);
    console.log(`✅ Défis: ${defisCrees}`);
    console.log(`✅ Notifications: ${notificationsCrees}`);
    console.log('\n📧 Comptes de test créés:');
    console.log('   Email: test1@padel.com à test50@padel.com');
    console.log('   Mot de passe: Test123456!');
    console.log('\n✅ Tous les tests sont maintenant possibles!');

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

seedCompleteDatabase();

