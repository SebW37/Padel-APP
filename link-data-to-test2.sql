-- Script SQL pour lier toutes les données au compte test2@padel.com
-- À exécuter dans le SQL Editor de Supabase

-- 1. Trouver l'ID du joueur test2@padel.com
DO $$
DECLARE
  test2_user_id uuid;
  ligue_id_var integer;
  joueur_random_id uuid;
  i integer;
BEGIN
  -- Récupérer l'ID du joueur test2@padel.com
  SELECT id INTO test2_user_id 
  FROM joueurs j
  JOIN auth.users u ON j.id = u.id
  WHERE u.email = 'test2@padel.com'
  LIMIT 1;

  IF test2_user_id IS NULL THEN
    RAISE EXCEPTION 'Joueur test2@padel.com non trouvé!';
  END IF;

  RAISE NOTICE 'ID du joueur test2: %', test2_user_id;

  -- 2. Ajouter test2 à toutes les ligues existantes
  FOR ligue_id_var IN SELECT id FROM ligues LOOP
    -- Vérifier si déjà présent
    IF NOT EXISTS (
      SELECT 1 FROM ligues_joueurs 
      WHERE ligue_id = ligue_id_var AND joueur_id = test2_user_id
    ) THEN
      INSERT INTO ligues_joueurs (
        ligue_id, 
        joueur_id, 
        points, 
        position, 
        matchs_joues, 
        victoires, 
        defaites
      )
      SELECT 
        ligue_id_var,
        test2_user_id,
        floor(random() * 100)::integer,
        (SELECT COUNT(*) FROM ligues_joueurs WHERE ligue_id = ligue_id_var) + 1,
        floor(random() * 20)::integer,
        floor(random() * 15)::integer,
        floor(random() * 10)::integer;
    END IF;
  END LOOP;

  RAISE NOTICE 'Joueur ajouté aux ligues';

  -- 3. Créer des défis avec test2 comme expéditeur ou destinataire
  FOR i IN 1..20 LOOP
    -- Sélectionner un joueur aléatoire différent
    SELECT id INTO joueur_random_id 
    FROM joueurs 
    WHERE id != test2_user_id 
    ORDER BY random() 
    LIMIT 1;

    IF joueur_random_id IS NOT NULL THEN
      -- Défi envoyé par test2
      IF random() > 0.5 THEN
        INSERT INTO defis (
          expediteur_id, 
          destinataire_id, 
          message, 
          statut, 
          date_expiration
        ) VALUES (
          test2_user_id,
          joueur_random_id,
          'Prêt pour un match ?',
          (ARRAY['en_attente', 'en_attente', 'accepte', 'refuse'])[floor(random() * 4) + 1]::defi_statut,
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
          'On se fait un match ?',
          (ARRAY['en_attente', 'en_attente', 'accepte', 'refuse'])[floor(random() * 4) + 1]::defi_statut,
          now() + (floor(random() * 7 + 1) || ' days')::interval
        );
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'Défis créés';

  -- 4. Créer des notifications pour test2
  FOR i IN 1..30 LOOP
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
      (ARRAY['defi', 'match', 'ligue', 'classement', 'message'])[floor(random() * 5) + 1],
      (ARRAY[
        'Nouveau défi reçu',
        'Votre défi a été accepté',
        'Match terminé',
        'Nouvelle ligue créée',
        'Vous avez été ajouté à une ligue',
        'Classement mis à jour',
        'Nouveau match programmé'
      ])[floor(random() * 7) + 1],
      'Notification de test ' || i,
      '{}'::jsonb,
      random() > 0.5,
      now() + (30 || ' days')::interval
    );
  END LOOP;

  RAISE NOTICE 'Notifications créées';

  -- 5. Créer des matchs avec test2 comme participant
  FOR i IN 1..15 LOOP
    DECLARE
      j1 uuid := test2_user_id;
      j2 uuid;
      j3 uuid;
      j4 uuid;
      set1_j1 integer;
      set1_j2 integer;
      set2_j1 integer;
      set2_j2 integer;
      equipe1_gagne boolean;
      score_text text;
    BEGIN
      -- Récupérer les 3 autres joueurs
      SELECT id INTO j2 FROM joueurs WHERE id != test2_user_id ORDER BY random() LIMIT 1;
      SELECT id INTO j3 FROM joueurs WHERE id NOT IN (test2_user_id, j2) ORDER BY random() LIMIT 1;
      SELECT id INTO j4 FROM joueurs WHERE id NOT IN (test2_user_id, j2, j3) ORDER BY random() LIMIT 1;

      -- Générer un score
      set1_j1 := floor(random() * 7)::integer;
      set1_j2 := CASE WHEN set1_j1 = 6 THEN floor(random() * 5)::integer ELSE CASE WHEN random() > 0.5 THEN 6 ELSE floor(random() * 6)::integer END END;
      set2_j1 := floor(random() * 7)::integer;
      set2_j2 := CASE WHEN set2_j1 = 6 THEN floor(random() * 5)::integer ELSE CASE WHEN random() > 0.5 THEN 6 ELSE floor(random() * 6)::integer END END;
      
      equipe1_gagne := (set1_j1 > set1_j2 AND set2_j1 >= set2_j2) OR (set1_j1 >= set1_j2 AND set2_j1 > set2_j2);
      score_text := set1_j1 || '-' || set1_j2 || ', ' || set2_j1 || '-' || set2_j2;

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
        now() - (floor(random() * 60) || ' days')::interval,
        jsonb_build_object(
          j1::text, true,
          j2::text, true,
          j3::text, true,
          j4::text, true
        ),
        60 + floor(random() * 60)::integer,
        equipe1_gagne
      );
    END;
  END LOOP;

  RAISE NOTICE 'Matchs créés';

  -- 6. Résumé
  RAISE NOTICE '=== RÉSUMÉ ===';
  RAISE NOTICE 'Ligues: %', (SELECT COUNT(*) FROM ligues_joueurs WHERE joueur_id = test2_user_id);
  RAISE NOTICE 'Défis: %', (SELECT COUNT(*) FROM defis WHERE expediteur_id = test2_user_id OR destinataire_id = test2_user_id);
  RAISE NOTICE 'Notifications: %', (SELECT COUNT(*) FROM notifications WHERE destinataire_id = test2_user_id);
  RAISE NOTICE 'Matchs: %', (SELECT COUNT(*) FROM matchs WHERE joueur1_id = test2_user_id OR joueur2_id = test2_user_id OR joueur3_id = test2_user_id OR joueur4_id = test2_user_id);

END $$;

-- Afficher le résumé final
SELECT 
  'Ligues' as type, 
  COUNT(*) as count 
FROM ligues_joueurs lj
JOIN joueurs j ON lj.joueur_id = j.id
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com'
UNION ALL
SELECT 
  'Défis', 
  COUNT(*) 
FROM defis d
JOIN joueurs j ON (d.expediteur_id = j.id OR d.destinataire_id = j.id)
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com'
UNION ALL
SELECT 
  'Notifications', 
  COUNT(*) 
FROM notifications n
JOIN joueurs j ON n.destinataire_id = j.id
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com'
UNION ALL
SELECT 
  'Matchs', 
  COUNT(*) 
FROM matchs m
JOIN joueurs j ON (m.joueur1_id = j.id OR m.joueur2_id = j.id OR m.joueur3_id = j.id OR m.joueur4_id = j.id)
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com';

