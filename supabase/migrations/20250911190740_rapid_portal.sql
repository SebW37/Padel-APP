/*
  # Création du système de clubs

  1. Nouvelles Tables
    - `clubs`
      - `id` (integer, primary key)
      - `nom` (text)
      - `pays` (text)
      - `ville` (text)
      - `latitude` (numeric, optional)
      - `longitude` (numeric, optional)
      - `statut` (enum: valide, en_attente, rejete)
      - `date_creation` (timestamptz)

  2. Sécurité
    - Enable RLS sur `clubs`
    - Politique de lecture pour clubs validés
    - Politique d'insertion pour utilisateurs authentifiés
*/

-- Type enum pour le statut des clubs
CREATE TYPE club_statut AS ENUM ('valide', 'en_attente', 'rejete');

CREATE TABLE IF NOT EXISTS clubs (
  id serial PRIMARY KEY,
  nom text NOT NULL,
  pays text NOT NULL,
  ville text NOT NULL,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  statut club_statut NOT NULL DEFAULT 'en_attente',
  date_creation timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertion de quelques clubs d'exemple
INSERT INTO clubs (nom, pays, ville, latitude, longitude, statut) VALUES
('Club Padel Barcelona', 'Espagne', 'Barcelona', 41.3851, 2.1734, 'valide'),
('Madrid Padel Center', 'Espagne', 'Madrid', 40.4168, -3.7038, 'valide'),
('Paris Padel Club', 'France', 'Paris', 48.8566, 2.3522, 'valide'),
('Club Padel Valencia', 'Espagne', 'Valencia', 39.4699, -0.3763, 'valide'),
('Padel Club Milano', 'Italie', 'Milano', 45.4642, 9.1900, 'valide'),
('London Padel Academy', 'Royaume-Uni', 'London', 51.5074, -0.1278, 'valide'),
('Padel Club Lyon', 'France', 'Lyon', 45.7640, 4.8357, 'valide'),
('Berlin Padel Center', 'Allemagne', 'Berlin', 52.5200, 13.4050, 'valide');

-- Enable RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour clubs validés
CREATE POLICY "Clubs validés sont lisibles publiquement"
  ON clubs
  FOR SELECT
  TO public
  USING (statut = 'valide');

-- Politique d'insertion pour utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent proposer des clubs"
  ON clubs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique de mise à jour pour admins seulement
CREATE POLICY "Seuls les admins peuvent modifier les clubs"
  ON clubs
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger pour updated_at
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();