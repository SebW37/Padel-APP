/*
  # Création du système de joueurs

  1. Nouvelles Tables
    - `joueurs`
      - `id` (uuid, primary key, lié à auth.users)
      - `nom_complet` (text)
      - `date_naissance` (date)
      - `sexe` (enum: M, F)
      - `club_id` (integer, foreign key)
      - `points_classement` (integer)
      - `division_id` (integer, foreign key)
      - `position_gps` (jsonb, optional)
      - `preference_langue` (text)
      - `confidentialite` (jsonb)
      - `badges` (text array)

  2. Sécurité
    - Enable RLS sur `joueurs`
    - Politique de lecture selon confidentialité
    - Politique de mise à jour pour propriétaire
*/

-- Type enum pour le sexe
CREATE TYPE sexe_type AS ENUM ('M', 'F');

CREATE TABLE IF NOT EXISTS joueurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_complet text NOT NULL,
  date_naissance date NOT NULL,
  sexe sexe_type NOT NULL,
  club_id integer REFERENCES clubs(id),
  points_classement integer NOT NULL DEFAULT 0,
  division_id integer REFERENCES divisions(id) DEFAULT 1,
  position_gps jsonb,
  preference_langue text NOT NULL DEFAULT 'fr',
  confidentialite jsonb NOT NULL DEFAULT '{"masquer_position": false, "masquer_profil": false, "statut_en_ligne": true}',
  badges text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertion de joueurs d'exemple
INSERT INTO joueurs (id, nom_complet, date_naissance, sexe, club_id, points_classement, division_id, preference_langue) VALUES
(gen_random_uuid(), 'Carlos Martinez', '1985-03-15', 'M', 1, 4850, 15, 'es'),
(gen_random_uuid(), 'Sofia Rodriguez', '1990-07-22', 'F', 2, 4420, 14, 'es'),
(gen_random_uuid(), 'Jean Dubois', '1988-11-08', 'M', 3, 1247, 6, 'fr'),
(gen_random_uuid(), 'Maria Santos', '1992-05-12', 'F', 4, 1580, 7, 'es'),
(gen_random_uuid(), 'Antonio Garcia', '1987-09-30', 'M', 1, 3820, 13, 'es'),
(gen_random_uuid(), 'Emma Laurent', '1991-12-03', 'F', 7, 2150, 8, 'fr'),
(gen_random_uuid(), 'Marco Rossi', '1989-04-18', 'M', 5, 2890, 9, 'it'),
(gen_random_uuid(), 'Sarah Johnson', '1993-08-25', 'F', 6, 1950, 8, 'en');

-- Enable RLS
ALTER TABLE joueurs ENABLE ROW LEVEL SECURITY;

-- Politique de lecture selon confidentialité
CREATE POLICY "Joueurs publics sont lisibles"
  ON joueurs
  FOR SELECT
  TO public
  USING (
    confidentialite->>'masquer_profil' = 'false' OR
    auth.uid() = id
  );

-- Politique de mise à jour pour propriétaire
CREATE POLICY "Joueurs peuvent modifier leur profil"
  ON joueurs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Politique d'insertion pour utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent créer un profil"
  ON joueurs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger pour updated_at
CREATE TRIGGER update_joueurs_updated_at
  BEFORE UPDATE ON joueurs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour déterminer la division selon les points
CREATE OR REPLACE FUNCTION determiner_division(points integer)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT id FROM divisions 
    WHERE points >= points_minimum AND points <= points_maximum
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique de la division
CREATE OR REPLACE FUNCTION update_division_on_points_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.division_id = determiner_division(NEW.points_classement);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_joueur_division
  BEFORE UPDATE OF points_classement ON joueurs
  FOR EACH ROW
  EXECUTE FUNCTION update_division_on_points_change();