/*
  # Création du système anti-triche et sanctions

  1. Nouvelles Tables
    - `sanctions`
      - `id` (serial, primary key)
      - `joueur_id` (uuid, foreign key)
      - `type_sanction` (enum)
      - `duree_heures` (integer, optional)
      - `raison` (text)
      - `date_debut` (timestamptz)
      - `date_fin` (timestamptz, optional)
      - `admin_id` (uuid, optional)

  2. Sécurité
    - Enable RLS sur `sanctions`
    - Politique de lecture pour joueur concerné et admins
*/

-- Type enum pour les types de sanctions
CREATE TYPE sanction_type AS ENUM ('avertissement', 'suspension_temporaire', 'suspension_longue', 'bannissement');

CREATE TABLE IF NOT EXISTS sanctions (
  id serial PRIMARY KEY,
  joueur_id uuid REFERENCES joueurs(id) NOT NULL,
  type_sanction sanction_type NOT NULL,
  duree_heures integer,
  raison text NOT NULL,
  date_debut timestamptz NOT NULL DEFAULT now(),
  date_fin timestamptz,
  admin_id uuid REFERENCES joueurs(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour joueur concerné
CREATE POLICY "Joueurs peuvent voir leurs sanctions"
  ON sanctions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = joueur_id);

-- Politique d'insertion pour admins
CREATE POLICY "Admins peuvent créer des sanctions"
  ON sanctions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Trigger pour updated_at
CREATE TRIGGER update_sanctions_updated_at
  BEFORE UPDATE ON sanctions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour vérifier si un joueur est suspendu
CREATE OR REPLACE FUNCTION joueur_est_suspendu(joueur_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sanctions 
    WHERE joueur_id = joueur_uuid 
    AND type_sanction IN ('suspension_temporaire', 'suspension_longue', 'bannissement')
    AND (date_fin IS NULL OR date_fin > now())
  );
END;
$$ LANGUAGE plpgsql;