-- Script SQL complet pour lier toutes les données au compte test2@padel.com
-- À exécuter dans le SQL Editor de Supabase
-- Ce script crée des données cohérentes et réalistes

-- Désactiver temporairement RLS pour permettre les insertions
ALTER TABLE ligues_joueurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE matchs DISABLE ROW LEVEL SECURITY;
ALTER TABLE defis DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  test2_user_id uuid;
  ligue_id_var integer;
  joueur_random_id uuid;
  i integer;
  j integer;
  match_count integer;
  defi_count integer;
  notification_count integer;
  ligue_count integer;
  default_division_id integer;
  default_club_id integer;
  default_points integer;
BEGIN
  -- 1. Trouver l'ID du joueur test2@padel.com
  -- Chercher directement dans auth.users
  SELECT id INTO test2_user_id 
  FROM auth.users
  WHERE email = 'test2@padel.com'
  LIMIT 1;

  IF test2_user_id IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'Joueur test2@padel.com non trouve dans auth.users. Verifiez que le compte existe.';
  END IF;

  RAISE NOTICE '✅ ID du joueur test2 trouvé: %', test2_user_id;

  -- 1.5. Vérifier et créer le profil joueur s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM joueurs WHERE id = test2_user_id) THEN
    RAISE NOTICE 'Création du profil joueur pour test2@padel.com...';
    
    -- Récupérer une division par défaut
    SELECT id INTO default_division_id 
    FROM divisions 
    ORDER BY niveau 
    LIMIT 1;
    
    -- Récupérer un club par défaut
    SELECT id INTO default_club_id 
    FROM clubs 
    LIMIT 1;
    
    -- Récupérer les points minimum de la division
    SELECT points_minimum INTO default_points
    FROM divisions 
    WHERE id = COALESCE(default_division_id, 1)
    LIMIT 1;
    
    -- Créer le profil joueur
    BEGIN
      INSERT INTO joueurs (
        id,
        nom_complet,
        date_naissance,
        sexe,
        club_id,
        points_classement,
        division_id,
        preference_langue,
        confidentialite,
        badges,
        victoires,
        defaites,
        matchs_joues
      ) VALUES (
        test2_user_id,
        'Test User 2',
        '1990-01-01',
        'M',
        COALESCE(default_club_id, 1),
        COALESCE(default_points, 1200),
        COALESCE(default_division_id, 1),
        'fr',
        '{"masquer_position": false, "masquer_profil": false, "statut_en_ligne": true}'::jsonb,
        '{}'::text[],
        0,
        0,
        0
      );
      
      RAISE NOTICE '✅ Profil joueur créé avec succès';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Erreur lors de la création du profil: %', SQLERRM;
      RAISE;
    END;
  ELSE
    RAISE NOTICE '✅ Profil joueur existe déjà';
  END IF;

  -- 2. Ajouter test2 à toutes les ligues existantes avec des données cohérentes
  ligue_count := 0;
  FOR ligue_id_var IN SELECT id FROM ligues LOOP
    -- Vérifier si déjà présent
    IF NOT EXISTS (
      SELECT 1 FROM ligues_joueurs 
      WHERE ligue_id = ligue_id_var AND joueur_id = test2_user_id
    ) THEN
      -- Calculer la position basée sur le nombre de joueurs déjà dans la ligue
      DECLARE
        current_position integer;
        ligue_points integer;
        ligue_matches integer;
        ligue_wins integer;
        ligue_losses integer;
      BEGIN
        SELECT COUNT(*) + 1 INTO current_position 
        FROM ligues_joueurs 
        WHERE ligue_id = ligue_id_var;

        -- Générer des statistiques cohérentes
        ligue_matches := floor(random() * 15 + 5)::integer; -- Entre 5 et 20 matchs
        ligue_wins := floor(random() * (ligue_matches * 0.7))::integer; -- Jusqu'à 70% de victoires
        ligue_losses := ligue_matches - ligue_wins;
        ligue_points := ligue_wins * 10 + floor(random() * 50); -- Points basés sur les victoires

        INSERT INTO ligues_joueurs (
          ligue_id, 
          joueur_id, 
          points, 
          position, 
          matchs_joues, 
          victoires, 
          defaites
        ) VALUES (
          ligue_id_var,
          test2_user_id,
          ligue_points,
          current_position,
          ligue_matches,
          ligue_wins,
          ligue_losses
        );
        ligue_count := ligue_count + 1;
      END;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Joueur ajouté à % ligue(s)', ligue_count;

  -- 3. Créer des défis cohérents avec test2
  defi_count := 0;
  FOR i IN 1..25 LOOP
    -- Sélectionner un joueur aléatoire différent
    SELECT id INTO joueur_random_id 
    FROM joueurs 
    WHERE id != test2_user_id 
    ORDER BY random() 
    LIMIT 1;

    IF joueur_random_id IS NOT NULL THEN
      DECLARE
        is_sender boolean;
        defi_statut text;
        defi_message text;
      BEGIN
        -- Alterner entre expéditeur et destinataire
        is_sender := (i % 2 = 0);
        
        -- Distribuer les statuts de manière réaliste
        CASE floor(random() * 10)
          WHEN 0, 1, 2, 3, 4 THEN defi_statut := 'en_attente'; -- 50% en attente
          WHEN 5, 6 THEN defi_statut := 'accepte'; -- 20% accepté
          WHEN 7, 8 THEN defi_statut := 'refuse'; -- 20% refusé
          WHEN 9 THEN defi_statut := 'termine'; -- 10% terminé
        END CASE;

        -- Messages variés
        defi_message := (ARRAY[
          'Prêt pour un match ?',
          'On se fait un match demain ?',
          'Dispo cette semaine ?',
          'Challenge accepté !',
          'Match de préparation ?',
          'Tu veux jouer ce weekend ?',
          'Disponible pour un défi ?',
          'Match amical ?'
        ])[floor(random() * 8) + 1];

        IF is_sender THEN
          -- Défi envoyé par test2
          INSERT INTO defis (
            expediteur_id, 
            destinataire_id, 
            message, 
            statut, 
            date_expiration
          ) VALUES (
            test2_user_id,
            joueur_random_id,
            defi_message,
            defi_statut::defi_statut,
            now() + (floor(random() * 7 + 1) || ' days')::interval
          );
        ELSE
          -- Défi reçu par test2
          INSERT INTO defis (
            expediteur_id, 
            destinataire_id, 
            message, 
            statut, 
            date_expiration
          ) VALUES (
            joueur_random_id,
            test2_user_id,
            defi_message,
            defi_statut::defi_statut,
            now() + (floor(random() * 7 + 1) || ' days')::interval
          );
        END IF;
        defi_count := defi_count + 1;
      END;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ % défi(s) créé(s)', defi_count;

  -- 4. Créer des notifications cohérentes pour test2
  notification_count := 0;
  FOR i IN 1..40 LOOP
    DECLARE
      notif_type text;
      notif_titre text;
      notif_message text;
      is_read boolean;
    BEGIN
      -- Types de notifications variés
      notif_type := (ARRAY['defi', 'match', 'ligue', 'classement', 'message'])[floor(random() * 5) + 1];
      
      -- Titres cohérents selon le type
      CASE notif_type
        WHEN 'defi' THEN
          notif_titre := (ARRAY['Nouveau défi reçu', 'Votre défi a été accepté', 'Votre défi a été refusé'])[floor(random() * 3) + 1];
          notif_message := 'Un joueur vous a envoyé un défi ou a répondu à votre défi.';
        WHEN 'match' THEN
          notif_titre := (ARRAY['Match terminé', 'Nouveau match programmé', 'Résultat du match'])[floor(random() * 3) + 1];
          notif_message := 'Un match auquel vous participez a été mis à jour.';
        WHEN 'ligue' THEN
          notif_titre := (ARRAY['Nouvelle ligue créée', 'Vous avez été ajouté à une ligue', 'Classement de ligue mis à jour'])[floor(random() * 3) + 1];
          notif_message := 'Une ligue a été créée ou vous y avez été ajouté.';
        WHEN 'classement' THEN
          notif_titre := (ARRAY['Classement mis à jour', 'Promotion de division !', 'Nouveau classement disponible'])[floor(random() * 3) + 1];
          notif_message := 'Votre position dans le classement a changé.';
        ELSE
          notif_titre := 'Nouveau message';
          notif_message := 'Vous avez reçu un nouveau message.';
      END CASE;

      -- 60% des notifications non lues pour avoir du contenu
      is_read := random() < 0.4;

      INSERT INTO notifications (
        destinataire_id,
        type,
        titre,
        message,
        donnees,
        lu,
        date_expiration
      ) VALUES (
        test2_user_id,
        notif_type,
        notif_titre,
        notif_message,
        '{}'::jsonb,
        is_read,
        now() + (30 || ' days')::interval
      );
      notification_count := notification_count + 1;
    END;
  END LOOP;

  RAISE NOTICE '✅ % notification(s) créée(s)', notification_count;

  -- 5. Créer des matchs cohérents avec test2 comme participant
  match_count := 0;
  FOR i IN 1..20 LOOP
    DECLARE
      j1 uuid;
      j2 uuid;
      j3 uuid;
      j4 uuid;
      set1_j1 integer;
      set1_j2 integer;
      set2_j1 integer;
      set2_j2 integer;
      equipe1_gagne boolean;
      score_text text;
      match_date timestamptz;
      test2_in_team1 boolean;
    BEGIN
      -- test2 sera toujours joueur1 ou joueur2 (équipe 1)
      test2_in_team1 := random() > 0.3; -- 70% du temps dans l'équipe 1
      
      IF test2_in_team1 THEN
        j1 := test2_user_id;
        -- Sélectionner j2 (même équipe)
        SELECT id INTO j2 
        FROM joueurs 
        WHERE id != test2_user_id 
        ORDER BY random() 
        LIMIT 1;
      ELSE
        -- test2 dans équipe 2
        SELECT id INTO j1 
        FROM joueurs 
        WHERE id != test2_user_id 
        ORDER BY random() 
        LIMIT 1;
        j2 := test2_user_id;
      END IF;

      -- Sélectionner les 2 autres joueurs pour l'équipe 2
      SELECT id INTO j3 
      FROM joueurs 
      WHERE id NOT IN (j1, j2) 
      ORDER BY random() 
      LIMIT 1;
      
      SELECT id INTO j4 
      FROM joueurs 
      WHERE id NOT IN (j1, j2, j3) 
      ORDER BY random() 
      LIMIT 1;

      -- Générer un score réaliste
      -- Set 1
      set1_j1 := floor(random() * 7)::integer;
      IF set1_j1 = 6 THEN
        set1_j2 := floor(random() * 5)::integer; -- Si 6, l'adversaire peut avoir 0-4
      ELSE
        IF random() > 0.5 THEN
          set1_j2 := 6; -- L'adversaire gagne
        ELSE
          set1_j2 := floor(random() * 6)::integer; -- Score normal
        END IF;
      END IF;

      -- Set 2
      set2_j1 := floor(random() * 7)::integer;
      IF set2_j1 = 6 THEN
        set2_j2 := floor(random() * 5)::integer;
      ELSE
        IF random() > 0.5 THEN
          set2_j2 := 6;
        ELSE
          set2_j2 := floor(random() * 6)::integer;
        END IF;
      END IF;

      -- Déterminer le gagnant de manière cohérente
      equipe1_gagne := (set1_j1 > set1_j2 AND set2_j1 >= set2_j2) OR 
                       (set1_j1 >= set1_j2 AND set2_j1 > set2_j2);
      
      score_text := set1_j1 || '-' || set1_j2 || ', ' || set2_j1 || '-' || set2_j2;
      
      -- Date aléatoire dans les 60 derniers jours
      match_date := now() - (floor(random() * 60) || ' days')::interval;

      -- Insérer le match
      INSERT INTO matchs (
        joueur1_id, 
        joueur2_id, 
        joueur3_id, 
        joueur4_id,
        score, 
        statut, 
        date_match, 
        validations,
        duree_minutes, 
        equipe1_gagnante
      ) VALUES (
        j1, j2, j3, j4,
        score_text, 
        'valide', 
        match_date,
        jsonb_build_object(
          j1::text, true,
          j2::text, true,
          j3::text, true,
          j4::text, true
        ),
        60 + floor(random() * 60)::integer, -- Durée entre 60 et 120 minutes
        equipe1_gagne
      );
      
      match_count := match_count + 1;
    END;
  END LOOP;

  RAISE NOTICE '✅ % match(s) créé(s)', match_count;

  -- 6. Mettre à jour les statistiques du joueur test2 basées sur les matchs créés
  UPDATE joueurs j
  SET 
    matchs_joues = COALESCE((
      SELECT COUNT(*) 
      FROM matchs m 
      WHERE j.id IN (m.joueur1_id, m.joueur2_id, m.joueur3_id, m.joueur4_id)
        AND m.statut = 'valide'
    ), 0),
    victoires = COALESCE((
      SELECT COUNT(*) 
      FROM matchs m 
      WHERE j.id IN (m.joueur1_id, m.joueur2_id, m.joueur3_id, m.joueur4_id)
        AND m.statut = 'valide'
        AND (
          (j.id IN (m.joueur1_id, m.joueur2_id) AND m.equipe1_gagnante = true) OR
          (j.id IN (m.joueur3_id, m.joueur4_id) AND m.equipe1_gagnante = false)
        )
    ), 0),
    defaites = COALESCE((
      SELECT COUNT(*) 
      FROM matchs m 
      WHERE j.id IN (m.joueur1_id, m.joueur2_id, m.joueur3_id, m.joueur4_id)
        AND m.statut = 'valide'
        AND (
          (j.id IN (m.joueur1_id, m.joueur2_id) AND m.equipe1_gagnante = false) OR
          (j.id IN (m.joueur3_id, m.joueur4_id) AND m.equipe1_gagnante = true)
        )
    ), 0)
  WHERE j.id = test2_user_id;

  RAISE NOTICE '✅ Statistiques du joueur mises à jour';

  -- 7. Afficher le résumé final
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 RÉSUMÉ DES DONNÉES CRÉÉES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Ligues: %', (SELECT COUNT(*) FROM ligues_joueurs WHERE joueur_id = test2_user_id);
  RAISE NOTICE 'Défis: %', (SELECT COUNT(*) FROM defis WHERE expediteur_id = test2_user_id OR destinataire_id = test2_user_id);
  RAISE NOTICE 'Notifications: %', (SELECT COUNT(*) FROM notifications WHERE destinataire_id = test2_user_id);
  RAISE NOTICE 'Matchs: %', (SELECT COUNT(*) FROM matchs WHERE joueur1_id = test2_user_id OR joueur2_id = test2_user_id OR joueur3_id = test2_user_id OR joueur4_id = test2_user_id);
  
  SELECT 
    victoires, 
    defaites, 
    matchs_joues 
  INTO ligue_count, defi_count, notification_count
  FROM joueurs 
  WHERE id = test2_user_id;
  
  RAISE NOTICE 'Statistiques: % victoires, % défaites, % matchs joués', ligue_count, defi_count, notification_count;
  RAISE NOTICE '========================================';

END $$;

-- Réactiver RLS
ALTER TABLE ligues_joueurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchs ENABLE ROW LEVEL SECURITY;
ALTER TABLE defis ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Afficher le résumé final dans un tableau
SELECT 
  'Ligues' as type, 
  COUNT(*) as count,
  'test2@padel.com est dans ' || COUNT(*) || ' ligue(s)' as description
FROM ligues_joueurs lj
JOIN joueurs j ON lj.joueur_id = j.id
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com'
UNION ALL
SELECT 
  'Défis', 
  COUNT(*),
  COUNT(*) || ' défi(s) (envoyés ou reçus)' as description
FROM defis d
JOIN joueurs j ON (d.expediteur_id = j.id OR d.destinataire_id = j.id)
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com'
UNION ALL
SELECT 
  'Notifications', 
  COUNT(*),
  COUNT(*) || ' notification(s) dont ' || COUNT(*) FILTER (WHERE NOT n.lu) || ' non lue(s)' as description
FROM notifications n
JOIN joueurs j ON n.destinataire_id = j.id
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com'
UNION ALL
SELECT 
  'Matchs', 
  COUNT(*),
  COUNT(*) || ' match(s) joué(s)' as description
FROM matchs m
JOIN joueurs j ON (m.joueur1_id = j.id OR m.joueur2_id = j.id OR m.joueur3_id = j.id OR m.joueur4_id = j.id)
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com';

