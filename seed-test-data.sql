-- Script SQL pour créer une base de données complète de test
-- À exécuter dans le SQL Editor de Supabase

-- 1. Créer des relations ligues_joueurs pour les ligues existantes
INSERT INTO ligues_joueurs (ligue_id, joueur_id, points, position, matchs_joues, victoires, defaites)
SELECT 
  l.id as ligue_id,
  unnest(l.joueurs_ids) as joueur_id,
  floor(random() * 100)::integer as points,
  row_number() OVER (PARTITION BY l.id ORDER BY random()) as position,
  floor(random() * 20)::integer as matchs_joues,
  floor(random() * 15)::integer as victoires,
  floor(random() * 10)::integer as defaites
FROM ligues l
WHERE l.joueurs_ids IS NOT NULL 
  AND array_length(l.joueurs_ids, 1) > 0
ON CONFLICT (ligue_id, joueur_id) DO NOTHING;

-- 2. Créer des matchs (2v2) avec des joueurs existants
DO $$
DECLARE
  joueur1_id uuid;
  joueur2_id uuid;
  joueur3_id uuid;
  joueur4_id uuid;
  i integer;
  set1_j1 integer;
  set1_j2 integer;
  set2_j1 integer;
  set2_j2 integer;
  equipe1_gagne boolean;
  score_text text;
  date_match timestamptz;
BEGIN
  FOR i IN 1..100 LOOP
    -- Sélectionner 4 joueurs aléatoires différents
    SELECT id INTO joueur1_id FROM joueurs ORDER BY random() LIMIT 1;
    SELECT id INTO joueur2_id FROM joueurs WHERE id != joueur1_id ORDER BY random() LIMIT 1;
    SELECT id INTO joueur3_id FROM joueurs WHERE id NOT IN (joueur1_id, joueur2_id) ORDER BY random() LIMIT 1;
    SELECT id INTO joueur4_id FROM joueurs WHERE id NOT IN (joueur1_id, joueur2_id, joueur3_id) ORDER BY random() LIMIT 1;
    
    -- Générer un score réaliste
    set1_j1 := floor(random() * 7)::integer;
    set1_j2 := CASE WHEN set1_j1 = 6 THEN floor(random() * 5)::integer ELSE CASE WHEN random() > 0.5 THEN 6 ELSE floor(random() * 6)::integer END END;
    set2_j1 := floor(random() * 7)::integer;
    set2_j2 := CASE WHEN set2_j1 = 6 THEN floor(random() * 5)::integer ELSE CASE WHEN random() > 0.5 THEN 6 ELSE floor(random() * 6)::integer END END;
    
    equipe1_gagne := (set1_j1 > set1_j2 AND set2_j1 >= set2_j2) OR (set1_j1 >= set1_j2 AND set2_j1 > set2_j2);
    score_text := set1_j1 || '-' || set1_j2 || ', ' || set2_j1 || '-' || set2_j2;
    date_match := now() - (floor(random() * 60) || ' days')::interval;
    
    -- Insérer le match
    INSERT INTO matchs (
      joueur1_id, joueur2_id, joueur3_id, joueur4_id,
      score, statut, date_match, validations,
      duree_minutes, equipe1_gagnante
    ) VALUES (
      joueur1_id, joueur2_id, joueur3_id, joueur4_id,
      score_text, 'valide', date_match,
      jsonb_build_object(
        joueur1_id::text, true,
        joueur2_id::text, true,
        joueur3_id::text, true,
        joueur4_id::text, true
      ),
      60 + floor(random() * 60)::integer,
      equipe1_gagne
    );
  END LOOP;
END $$;

-- 3. Créer des défis
DO $$
DECLARE
  expediteur_id uuid;
  destinataire_id uuid;
  i integer;
  statut text;
  message text;
  date_expiration timestamptz;
  equipe1_j1 uuid;
  equipe1_j2 uuid;
  equipe2_j1 uuid;
  equipe2_j2 uuid;
  messages_arr text[] := ARRAY[
    'Prêt pour un match ?',
    'On se fait un match demain ?',
    'Dispo cette semaine ?',
    'Challenge accepté !',
    'Match de préparation ?',
    'Tu veux jouer ce weekend ?',
    'Disponible pour un défi ?',
    'Match amical ?'
  ];
BEGIN
  FOR i IN 1..80 LOOP
    -- Sélectionner expéditeur et destinataire différents
    SELECT id INTO expediteur_id FROM joueurs ORDER BY random() LIMIT 1;
    SELECT id INTO destinataire_id FROM joueurs WHERE id != expediteur_id ORDER BY random() LIMIT 1;
    
    statut := (ARRAY['en_attente', 'en_attente', 'accepte', 'refuse', 'termine'])[floor(random() * 5) + 1];
    message := messages_arr[floor(random() * array_length(messages_arr, 1)) + 1];
    date_expiration := now() + (floor(random() * 7 + 1) || ' days')::interval;
    
    -- Si accepté ou terminé, ajouter les équipes
    IF statut IN ('accepte', 'termine') THEN
      SELECT id INTO equipe1_j1 FROM joueurs WHERE id NOT IN (expediteur_id, destinataire_id) ORDER BY random() LIMIT 1;
      SELECT id INTO equipe1_j2 FROM joueurs WHERE id NOT IN (expediteur_id, destinataire_id, equipe1_j1) ORDER BY random() LIMIT 1;
      SELECT id INTO equipe2_j1 FROM joueurs WHERE id NOT IN (expediteur_id, destinataire_id, equipe1_j1, equipe1_j2) ORDER BY random() LIMIT 1;
      SELECT id INTO equipe2_j2 FROM joueurs WHERE id NOT IN (expediteur_id, destinataire_id, equipe1_j1, equipe1_j2, equipe2_j1) ORDER BY random() LIMIT 1;
      
      INSERT INTO defis (
        expediteur_id, destinataire_id, message, statut, date_expiration,
        equipe1_joueur1_id, equipe1_joueur2_id, equipe2_joueur1_id, equipe2_joueur2_id,
        score_equipe1, score_equipe2
      ) VALUES (
        expediteur_id, destinataire_id, message, statut::defi_statut, date_expiration,
        equipe1_j1, equipe1_j2, equipe2_j1, equipe2_j2,
        CASE WHEN statut = 'termine' THEN floor(random() * 3 + 1)::integer ELSE NULL END,
        CASE WHEN statut = 'termine' THEN floor(random() * 3 + 1)::integer ELSE NULL END
      );
    ELSE
      INSERT INTO defis (expediteur_id, destinataire_id, message, statut, date_expiration)
      VALUES (expediteur_id, destinataire_id, message, statut::defi_statut, date_expiration);
    END IF;
  END LOOP;
END $$;

-- 4. Créer des notifications
INSERT INTO notifications (destinataire_id, type, titre, message, donnees, lu, date_expiration)
SELECT 
  j.id as destinataire_id,
  (ARRAY['defi', 'match', 'ligue', 'classement', 'message'])[floor(random() * 5) + 1] as type,
  (ARRAY[
    'Nouveau défi reçu',
    'Votre défi a été accepté',
    'Match terminé',
    'Nouvelle ligue créée',
    'Vous avez été ajouté à une ligue',
    'Classement mis à jour',
    'Nouveau match programmé'
  ])[floor(random() * 7) + 1] as titre,
  'Notification de test ' || row_number() OVER () as message,
  '{}'::jsonb as donnees,
  random() > 0.5 as lu,
  now() + (30 || ' days')::interval as date_expiration
FROM joueurs j
CROSS JOIN generate_series(1, 2) -- 2 notifications par joueur
ORDER BY random()
LIMIT 150;

-- 5. Mettre à jour les statistiques des joueurs basées sur les matchs
UPDATE joueurs j
SET 
  matchs_joues = COALESCE((
    SELECT COUNT(*) 
    FROM matchs m 
    WHERE j.id IN (m.joueur1_id, m.joueur2_id, m.joueur3_id, m.joueur4_id)
  ), 0),
  victoires = COALESCE((
    SELECT COUNT(*) 
    FROM matchs m 
    WHERE j.id IN (m.joueur1_id, m.joueur2_id, m.joueur3_id, m.joueur4_id)
      AND (
        (j.id IN (m.joueur1_id, m.joueur2_id) AND m.equipe1_gagnante = true) OR
        (j.id IN (m.joueur3_id, m.joueur4_id) AND m.equipe1_gagnante = false)
      )
  ), 0),
  defaites = COALESCE((
    SELECT COUNT(*) 
    FROM matchs m 
    WHERE j.id IN (m.joueur1_id, m.joueur2_id, m.joueur3_id, m.joueur4_id)
      AND (
        (j.id IN (m.joueur1_id, m.joueur2_id) AND m.equipe1_gagnante = false) OR
        (j.id IN (m.joueur3_id, m.joueur4_id) AND m.equipe1_gagnante = true)
      )
  ), 0);

-- Résumé
SELECT 
  'Joueurs' as table_name, COUNT(*) as count FROM joueurs
UNION ALL
SELECT 'Ligues', COUNT(*) FROM ligues
UNION ALL
SELECT 'Ligues_joueurs', COUNT(*) FROM ligues_joueurs
UNION ALL
SELECT 'Matchs', COUNT(*) FROM matchs
UNION ALL
SELECT 'Défis', COUNT(*) FROM defis
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;

