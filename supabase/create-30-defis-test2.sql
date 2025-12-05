-- Script pour créer 30 défis fictifs pour Test User 2
-- À exécuter dans le SQL Editor de Supabase

-- Désactiver temporairement RLS pour permettre les insertions
ALTER TABLE defis DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  test2_user_id uuid;
  joueur_random_id uuid;
  i integer;
  defi_statut text;
  defi_message text;
  is_sender boolean;
  equipe1_j1 uuid;
  equipe1_j2 uuid;
  equipe2_j1 uuid;
  equipe2_j2 uuid;
  statuts_array text[] := ARRAY['en_attente', 'accepte', 'termine', 'refuse'];
  messages_array text[] := ARRAY[
    'Prêt pour un match ?',
    'On se défie ?',
    'Match ce week-end ?',
    'Tu es libre pour jouer ?',
    'Défi accepté !',
    'Match confirmé',
    'À bientôt sur le terrain',
    'Prêt à relever le défi ?',
    'Match amical ?',
    'On se retrouve sur le court ?',
    'Défi lancé !',
    'Match de ligue ?',
    'Entraînement ensemble ?',
    'Match pour progresser',
    'Défi entre amis'
  ];
BEGIN
  -- Trouver l'ID de Test User 2
  SELECT id INTO test2_user_id 
  FROM auth.users
  WHERE email = 'test2@padel.com'
  LIMIT 1;

  IF test2_user_id IS NULL THEN
    RAISE EXCEPTION 'Joueur test2@padel.com non trouvé dans auth.users';
  END IF;

  RAISE NOTICE '✅ Création de 30 défis pour Test User 2 (ID: %)', test2_user_id;

  -- Créer 30 défis variés
  FOR i IN 1..30 LOOP
    -- Choisir un joueur aléatoire différent de Test User 2
    SELECT id INTO joueur_random_id
    FROM joueurs
    WHERE id != test2_user_id
    ORDER BY random()
    LIMIT 1;

    IF joueur_random_id IS NULL THEN
      RAISE NOTICE '⚠️ Pas assez de joueurs pour créer tous les défis';
      EXIT;
    END IF;

    -- Déterminer si Test User 2 est expéditeur ou destinataire (50/50)
    is_sender := (random() < 0.5);
    
    -- Choisir un statut aléatoire (plus de défis en attente et acceptés)
    IF random() < 0.4 THEN
      defi_statut := 'en_attente';
    ELSIF random() < 0.7 THEN
      defi_statut := 'accepte';
    ELSIF random() < 0.9 THEN
      defi_statut := 'termine';
    ELSE
      defi_statut := 'refuse';
    END IF;

    -- Choisir un message aléatoire
    defi_message := messages_array[floor(random() * array_length(messages_array, 1)) + 1];

    -- Si le défi est accepté ou terminé, créer les équipes 2v2
    IF defi_statut IN ('accepte', 'termine') THEN
      -- Sélectionner 4 joueurs différents pour les équipes
      SELECT id INTO equipe1_j1
      FROM joueurs
      WHERE id NOT IN (test2_user_id, joueur_random_id)
      ORDER BY random()
      LIMIT 1;

      SELECT id INTO equipe1_j2
      FROM joueurs
      WHERE id NOT IN (test2_user_id, joueur_random_id, equipe1_j1)
      ORDER BY random()
      LIMIT 1;

      SELECT id INTO equipe2_j1
      FROM joueurs
      WHERE id NOT IN (test2_user_id, joueur_random_id, equipe1_j1, equipe1_j2)
      ORDER BY random()
      LIMIT 1;

      SELECT id INTO equipe2_j2
      FROM joueurs
      WHERE id NOT IN (test2_user_id, joueur_random_id, equipe1_j1, equipe1_j2, equipe2_j1)
      ORDER BY random()
      LIMIT 1;

      -- Si Test User 2 est expéditeur, il est dans l'équipe 1
      IF is_sender THEN
        -- Équipe 1: Test User 2 + partenaire aléatoire
        -- Équipe 2: Destinataire + partenaire aléatoire
        INSERT INTO defis (
          expediteur_id,
          destinataire_id,
          message,
          statut,
          date_expiration,
          equipe1_joueur1_id,
          equipe1_joueur2_id,
          equipe2_joueur1_id,
          equipe2_joueur2_id,
          score_equipe1,
          score_equipe2
        ) VALUES (
          test2_user_id,
          joueur_random_id,
          defi_message,
          defi_statut::defi_statut,
          now() + (floor(random() * 7 + 1) || ' days')::interval,
          test2_user_id,
          equipe1_j1,
          joueur_random_id,
          equipe2_j1,
          CASE WHEN defi_statut = 'termine' THEN floor(random() * 3 + 1)::integer ELSE NULL END,
          CASE WHEN defi_statut = 'termine' THEN floor(random() * 3 + 1)::integer ELSE NULL END
        );
      ELSE
        -- Équipe 1: Expéditeur + partenaire aléatoire
        -- Équipe 2: Test User 2 + partenaire aléatoire
        INSERT INTO defis (
          expediteur_id,
          destinataire_id,
          message,
          statut,
          date_expiration,
          equipe1_joueur1_id,
          equipe1_joueur2_id,
          equipe2_joueur1_id,
          equipe2_joueur2_id,
          score_equipe1,
          score_equipe2
        ) VALUES (
          joueur_random_id,
          test2_user_id,
          defi_message,
          defi_statut::defi_statut,
          now() + (floor(random() * 7 + 1) || ' days')::interval,
          joueur_random_id,
          equipe1_j1,
          test2_user_id,
          equipe2_j1,
          CASE WHEN defi_statut = 'termine' THEN floor(random() * 3 + 1)::integer ELSE NULL END,
          CASE WHEN defi_statut = 'termine' THEN floor(random() * 3 + 1)::integer ELSE NULL END
        );
      END IF;
    ELSE
      -- Défi simple sans équipes (en attente ou refusé)
      IF is_sender THEN
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
    END IF;

    RAISE NOTICE 'Défi % créé: % -> % (statut: %)', i, 
      CASE WHEN is_sender THEN 'Test User 2' ELSE 'Autre joueur' END,
      CASE WHEN is_sender THEN 'Autre joueur' ELSE 'Test User 2' END,
      defi_statut;
  END LOOP;

  RAISE NOTICE '✅ 30 défis créés avec succès pour Test User 2';
END $$;

-- Réactiver RLS
ALTER TABLE defis ENABLE ROW LEVEL SECURITY;

-- Vérification
SELECT 
  COUNT(*) as total_defis,
  COUNT(*) FILTER (WHERE expediteur_id = (SELECT id FROM auth.users WHERE email = 'test2@padel.com')) as defis_envoyes,
  COUNT(*) FILTER (WHERE destinataire_id = (SELECT id FROM auth.users WHERE email = 'test2@padel.com')) as defis_recus,
  COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE statut = 'accepte') as acceptes,
  COUNT(*) FILTER (WHERE statut = 'termine') as termines,
  COUNT(*) FILTER (WHERE statut = 'refuse') as refuses
FROM defis
WHERE expediteur_id = (SELECT id FROM auth.users WHERE email = 'test2@padel.com')
   OR destinataire_id = (SELECT id FROM auth.users WHERE email = 'test2@padel.com');

