-- Script SQL simplifié pour créer des données de test
-- À exécuter dans le SQL Editor de Supabase
-- Ce script désactive temporairement RLS pour permettre les insertions

-- Désactiver temporairement RLS pour les insertions
ALTER TABLE ligues_joueurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE matchs DISABLE ROW LEVEL SECURITY;
ALTER TABLE defis DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

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

-- 2. Créer des matchs (2v2) - Version simplifiée avec moins de matchs
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
  joueurs_array uuid[];
BEGIN
  -- Récupérer tous les IDs de joueurs une fois
  SELECT ARRAY_AGG(id) INTO joueurs_array FROM joueurs;
  
  FOR i IN 1..50 LOOP
    -- Sélectionner 4 joueurs aléatoires différents
    joueur1_id := joueurs_array[floor(random() * array_length(joueurs_array, 1)) + 1];
    LOOP
      joueur2_id := joueurs_array[floor(random() * array_length(joueurs_array, 1)) + 1];
      EXIT WHEN joueur2_id != joueur1_id;
    END LOOP;
    LOOP
      joueur3_id := joueurs_array[floor(random() * array_length(joueurs_array, 1)) + 1];
      EXIT WHEN joueur3_id NOT IN (joueur1_id, joueur2_id);
    END LOOP;
    LOOP
      joueur4_id := joueurs_array[floor(random() * array_length(joueurs_array, 1)) + 1];
      EXIT WHEN joueur4_id NOT IN (joueur1_id, joueur2_id, joueur3_id);
    END LOOP;
    
    -- Générer un score réaliste
    set1_j1 := floor(random() * 7)::integer;
    set1_j2 := CASE WHEN set1_j1 = 6 THEN floor(random() * 5)::integer ELSE CASE WHEN random() > 0.5 THEN 6 ELSE floor(random() * 6)::integer END END;
    set2_j1 := floor(random() * 7)::integer;
    set2_j2 := CASE WHEN set2_j1 = 6 THEN floor(random() * 5)::integer ELSE CASE WHEN random() > 0.5 THEN 6 ELSE floor(random() * 6)::integer END END;
    
    equipe1_gagne := (set1_j1 > set1_j2 AND set2_j1 >= set2_j2) OR (set1_j1 >= set1_j2 AND set2_j1 > set2_j2);
    score_text := set1_j1 || '-' || set1_j2 || ', ' || set2_j1 || '-' || set2_j2;
    date_match := now() - (floor(random() * 60) || ' days')::interval;
    
    -- Insérer le match
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      -- Ignorer les erreurs de contraintes
      NULL;
    END;
  END LOOP;
END $$;

-- 3. Créer des défis - Version simplifiée
DO $$
DECLARE
  expediteur_id uuid;
  destinataire_id uuid;
  i integer;
  statut text;
  message text;
  date_expiration timestamptz;
  joueurs_array uuid[];
  messages_arr text[] := ARRAY[
    'Prêt pour un match ?',
    'On se fait un match demain ?',
    'Dispo cette semaine ?',
    'Challenge accepté !',
    'Match de préparation ?'
  ];
BEGIN
  SELECT ARRAY_AGG(id) INTO joueurs_array FROM joueurs;
  
  FOR i IN 1..40 LOOP
    expediteur_id := joueurs_array[floor(random() * array_length(joueurs_array, 1)) + 1];
    LOOP
      destinataire_id := joueurs_array[floor(random() * array_length(joueurs_array, 1)) + 1];
      EXIT WHEN destinataire_id != expediteur_id;
    END LOOP;
    
    statut := (ARRAY['en_attente', 'en_attente', 'accepte', 'refuse', 'termine'])[floor(random() * 5) + 1];
    message := messages_arr[floor(random() * array_length(messages_arr, 1)) + 1];
    date_expiration := now() + (floor(random() * 7 + 1) || ' days')::interval;
    
    BEGIN
      INSERT INTO defis (expediteur_id, destinataire_id, message, statut, date_expiration)
      VALUES (expediteur_id, destinataire_id, message, statut::defi_statut, date_expiration);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
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
    'Classement mis à jour'
  ])[floor(random() * 5) + 1] as titre,
  'Notification de test ' || row_number() OVER () as message,
  '{}'::jsonb as donnees,
  random() > 0.5 as lu,
  now() + (30 || ' days')::interval as date_expiration
FROM joueurs j
CROSS JOIN generate_series(1, 2)
ORDER BY random()
LIMIT 100;

-- Réactiver RLS
ALTER TABLE ligues_joueurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchs ENABLE ROW LEVEL SECURITY;
ALTER TABLE defis ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

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

