/*
  # Création du système de matchs

  1. Nouvelles Tables
    - `matchs`
      - `id` (serial, primary key)
      - `joueur1_id`, `joueur2_id`, `joueur3_id`, `joueur4_id` (uuid, foreign keys)
      - `score` (text)
      - `statut` (enum: en_attente, valide, conteste)
      - `date_match` (timestamptz)
      - `validations` (jsonb)
      - `duree_minutes` (integer)

  2. Sécurité
    - Enable RLS sur `matchs`
    - Politique de lecture pour participants
    - Politique de mise à jour pour participants
*/

-- Type enum pour le statut des matchs
CREATE TYPE match_statut AS ENUM ('en_attente', 'valide', 'conteste');

CREATE TABLE IF NOT EXISTS matchs (
  id serial PRIMARY KEY,
  joueur1_id uuid REFERENCES joueurs(id) NOT NULL,
  joueur2_id uuid REFERENCES joueurs(id) NOT NULL,
  joueur3_id uuid REFERENCES joueurs(id) NOT NULL,
  joueur4_id uuid REFERENCES joueurs(id) NOT NULL,
  score text NOT NULL,
  statut match_statut NOT NULL DEFAULT 'en_attente',
  date_match timestamptz NOT NULL DEFAULT now(),
  validations jsonb NOT NULL DEFAULT '{}',
  duree_minutes integer,
  equipe1_gagnante boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT different_players CHECK (
    joueur1_id != joueur2_id AND joueur1_id != joueur3_id AND joueur1_id != joueur4_id AND
    joueur2_id != joueur3_id AND joueur2_id != joueur4_id AND
    joueur3_id != joueur4_id
  )
);

-- Enable RLS
ALTER TABLE matchs ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour participants
CREATE POLICY "Participants peuvent voir leurs matchs"
  ON matchs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (joueur1_id, joueur2_id, joueur3_id, joueur4_id)
  );

-- Politique d'insertion pour utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent créer des matchs"
  ON matchs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (joueur1_id, joueur2_id, joueur3_id, joueur4_id)
  );

-- Politique de mise à jour pour participants
CREATE POLICY "Participants peuvent valider leurs matchs"
  ON matchs
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (joueur1_id, joueur2_id, joueur3_id, joueur4_id)
  );

-- Trigger pour updated_at
CREATE TRIGGER update_matchs_updated_at
  BEFORE UPDATE ON matchs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer les nouveaux points après un match
CREATE OR REPLACE FUNCTION calculer_nouveaux_points(
  points1 integer, points2 integer, points3 integer, points4 integer,
  equipe1_gagne boolean, score_detail text
)
RETURNS jsonb AS $$
DECLARE
  points_equipe1 numeric := (points1 + points2) / 2.0;
  points_equipe2 numeric := (points3 + points4) / 2.0;
  difference numeric := points_equipe1 - points_equipe2;
  probabilite_victoire numeric := 1.0 / (1.0 + power(10, -difference / 400.0));
  facteur_k integer := 30;
  resultat_equipe1 integer := CASE WHEN equipe1_gagne THEN 1 ELSE 0 END;
  changement numeric := facteur_k * (resultat_equipe1 - probabilite_victoire);
  nouveaux_points jsonb;
BEGIN
  nouveaux_points := jsonb_build_object(
    'joueur1', greatest(0, points1 + round(changement)),
    'joueur2', greatest(0, points2 + round(changement)),
    'joueur3', greatest(0, points3 + round(-changement)),
    'joueur4', greatest(0, points4 + round(-changement)),
    'changement_equipe1', round(changement),
    'changement_equipe2', round(-changement)
  );
  
  RETURN nouveaux_points;
END;
$$ LANGUAGE plpgsql;