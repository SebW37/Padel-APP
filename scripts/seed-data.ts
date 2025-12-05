import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const firstNames = ['Carlos', 'Sofia', 'Jean', 'Maria', 'Antonio', 'Isabella', 'Lucas', 'Emma', 'Diego', 'Camila', 'Marco', 'Lucia', 'Miguel', 'Ana', 'Pablo'];
const lastNames = ['Martinez', 'Rodriguez', 'Dubois', 'Santos', 'Garcia', 'Silva', 'Lopez', 'Fernandez', 'Torres', 'Moreno', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Diaz'];
const cities = ['Barcelona', 'Madrid', 'Paris', 'Valencia', 'Sevilla', 'Lyon', 'Marseille', 'Toulouse', 'Malaga', 'Bilbao'];

const messages = [
  'Prêt pour un match ?',
  'On se fait un match demain ?',
  'Dispo cette semaine ?',
  'Challenge accepté !',
  'Match de préparation ?',
  'Tu veux jouer ce weekend ?',
  'Disponible pour un défi ?',
  'Match amical ?'
];

async function seedData() {
  console.log('🚀 Début du peuplement de la base de données...\n');

  try {
    console.log('1️⃣ Récupération des divisions...');
    const { data: divisions, error: divError } = await supabase
      .from('divisions')
      .select('*')
      .order('niveau');

    if (divError) {
      console.error('❌ Erreur divisions:', divError);
      return;
    }

    if (!divisions || divisions.length === 0) {
      console.error('❌ Aucune division trouvée');
      return;
    }
    console.log(`✅ ${divisions.length} divisions trouvées\n`);

    console.log('2️⃣ Récupération des clubs...');
    const { data: clubs } = await supabase
      .from('clubs')
      .select('*')
      .limit(10);

    if (!clubs || clubs.length === 0) {
      console.error('❌ Aucun club trouvé');
      return;
    }
    console.log(`✅ ${clubs.length} clubs trouvés\n`);

    console.log('3️⃣ Récupération des joueurs existants...');
    const { data: existingPlayers } = await supabase
      .from('joueurs')
      .select('id, email');

    const existingEmails = new Set(existingPlayers?.map(p => p.email) || []);
    console.log(`✅ ${existingPlayers?.length || 0} joueurs existants\n`);

    console.log('4️⃣ Création de 20 nouveaux joueurs...');
    const newPlayers = [];

    for (let i = 0; i < 20; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@padel.com`;

      if (existingEmails.has(email)) continue;

      const divisionIndex = Math.min(
        Math.floor(Math.random() * Math.random() * divisions.length),
        divisions.length - 1
      );
      const division = divisions[divisionIndex];

      const basePoints = division.points_minimum + Math.floor(Math.random() * (division.points_maximum - division.points_minimum));
      const club = clubs[Math.floor(Math.random() * clubs.length)];

      newPlayers.push({
        email,
        nom_complet: `${firstName} ${lastName}`,
        division_id: division.id,
        club_id: club.id,
        points_classement: basePoints,
        matchs_joues: Math.floor(Math.random() * 50) + 10,
        matchs_gagnes: Math.floor(Math.random() * 30) + 5,
        serie_victoires: Math.floor(Math.random() * 5),
        meilleure_serie: Math.floor(Math.random() * 10) + 3,
        niveau_estimatif: 2.5 + Math.random() * 4.5,
        disponibilite_jours: ['lundi', 'mercredi', 'samedi'],
        photo_url: `https://i.pravatar.cc/300?u=${email}`,
      });
    }

    if (newPlayers.length > 0) {
      const { data: insertedPlayers, error } = await supabase
        .from('joueurs')
        .insert(newPlayers)
        .select();

      if (error) {
        console.error('❌ Erreur insertion joueurs:', error);
      } else {
        console.log(`✅ ${insertedPlayers?.length || 0} nouveaux joueurs créés\n`);
      }
    }

    console.log('5️⃣ Récupération de tous les joueurs pour créer des défis...');
    const { data: allPlayers } = await supabase
      .from('joueurs')
      .select('id, division_id')
      .limit(50);

    if (!allPlayers || allPlayers.length < 2) {
      console.error('❌ Pas assez de joueurs pour créer des défis');
      return;
    }
    console.log(`✅ ${allPlayers.length} joueurs disponibles\n`);

    console.log('6️⃣ Création de 30 défis...');
    const defis = [];

    for (let i = 0; i < 30; i++) {
      const player1 = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      let player2 = allPlayers[Math.floor(Math.random() * allPlayers.length)];

      while (player2.id === player1.id) {
        player2 = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      }

      const statuts = ['en_attente', 'accepte', 'refuse', 'en_attente'];
      const statut = statuts[Math.floor(Math.random() * statuts.length)];

      const daysAgo = Math.floor(Math.random() * 7);
      const dateCreation = new Date();
      dateCreation.setDate(dateCreation.getDate() - daysAgo);

      defis.push({
        expediteur_id: player1.id,
        destinataire_id: player2.id,
        statut,
        message: messages[Math.floor(Math.random() * messages.length)],
        date_creation: dateCreation.toISOString(),
      });
    }

    const { data: insertedDefis, error: defisError } = await supabase
      .from('defis')
      .insert(defis)
      .select();

    if (defisError) {
      console.error('❌ Erreur insertion défis:', defisError);
    } else {
      console.log(`✅ ${insertedDefis?.length || 0} défis créés\n`);
    }

    console.log('7️⃣ Création de 40 matchs...');
    const matchs = [];

    for (let i = 0; i < 40; i++) {
      const player1 = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      let player2 = allPlayers[Math.floor(Math.random() * allPlayers.length)];

      while (player2.id === player1.id) {
        player2 = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      }

      const score1Set1 = Math.floor(Math.random() * 7);
      const score2Set1 = score1Set1 === 6 ? Math.floor(Math.random() * 5) : (Math.random() > 0.5 ? 6 : Math.floor(Math.random() * 6));

      let score1Set2 = 0;
      let score2Set2 = 0;

      if (Math.random() > 0.3) {
        score1Set2 = Math.floor(Math.random() * 7);
        score2Set2 = score1Set2 === 6 ? Math.floor(Math.random() * 5) : (Math.random() > 0.5 ? 6 : Math.floor(Math.random() * 6));
      }

      const joueur1Gagne = (score1Set1 > score2Set1 && score1Set2 >= score2Set2) ||
                           (score1Set1 >= score2Set1 && score1Set2 > score2Set2);

      const daysAgo = Math.floor(Math.random() * 30);
      const dateMatch = new Date();
      dateMatch.setDate(dateMatch.getDate() - daysAgo);

      const club = clubs[Math.floor(Math.random() * clubs.length)];

      matchs.push({
        joueur1_id: player1.id,
        joueur2_id: player2.id,
        score_j1_set1: score1Set1,
        score_j2_set1: score2Set1,
        score_j1_set2: score1Set2,
        score_j2_set2: score2Set2,
        vainqueur_id: joueur1Gagne ? player1.id : player2.id,
        date_match: dateMatch.toISOString(),
        statut: 'termine',
        club_id: club.id,
        points_attribues: Math.floor(Math.random() * 50) + 10,
      });
    }

    const { data: insertedMatchs, error: matchsError } = await supabase
      .from('matchs')
      .insert(matchs)
      .select();

    if (matchsError) {
      console.error('❌ Erreur insertion matchs:', matchsError);
    } else {
      console.log(`✅ ${insertedMatchs?.length || 0} matchs créés\n`);
    }

    console.log('8️⃣ Mise à jour du rang global des joueurs...');
    const { data: rankedPlayers } = await supabase
      .from('joueurs')
      .select('id')
      .order('points_classement', { ascending: false });

    if (rankedPlayers) {
      for (let i = 0; i < rankedPlayers.length; i++) {
        await supabase
          .from('joueurs')
          .update({ rang_global: i + 1 })
          .eq('id', rankedPlayers[i].id);
      }
      console.log(`✅ Rangs mis à jour pour ${rankedPlayers.length} joueurs\n`);
    }

    console.log('✅ SUCCÈS! Base de données peuplée avec succès! 🎉');
    console.log('\nRésumé:');
    console.log(`- Joueurs: ${allPlayers.length}`);
    console.log(`- Défis: ${insertedDefis?.length || 0}`);
    console.log(`- Matchs: ${insertedMatchs?.length || 0}`);

  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

seedData();
