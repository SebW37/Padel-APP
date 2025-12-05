/*
  # Création du système de ligues

  1. Nouvelles Tables
    - `ligues`
      - `id` (serial, primary key)
      - `nom` (text)
      - `description` (text, optional)
      - `format` (enum: americano, paires_fixes)
      - `nombre_joueurs` (integer)
      - `joueurs_ids` (uuid array)
      - `statut` (enum: active, terminee, en_attente)

  2. Sécurité
    - Enable RLS sur `ligues`
    - Politique de lecture publique pour ligues actives
    - Politique de mise à jour pour créateur
*/

-- Type enum pour le format des ligues
CREATE TYPE ligue_format AS ENUM ('americano', 'paires_fixes');

-- Type enum pour le statut des ligues
CREATE TYPE ligue_statut AS ENUM ('active', 'terminee', 'en_attente');

CREATE TABLE IF NOT EXISTS ligues (
  id serial PRIMARY KEY,
  nom text NOT NULL,
  description text,
  format ligue_format NOT NULL DEFAULT 'americano',
  nombre_joueurs integer NOT NULL CHECK (nombre_joueurs >= 6),
  joueurs_ids uuid[] NOT NULL DEFAULT '{}',
  statut ligue_statut NOT NULL DEFAULT 'en_attente',
  createur_id uuid REFERENCES joueurs(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertion de ligues d'exemple
INSERT INTO ligues (nom, description, format, nombre_joueurs, statut, createur_id) 
SELECT 
  'Ligue Été 2025', 'Tournoi estival pour tous niveaux', 'americano', 8, 'active', j.id
FROM joueurs j 
WHERE j.nom_complet = 'Carlos Martinez'
LIMIT 1;

INSERT INTO ligues (nom, description, format, nombre_joueurs, statut, createur_id) 
SELECT 
  'Tournoi Corporate', 'Championnat inter-entreprises', 'paires_fixes', 12, 'active', j.id
FROM joueurs j 
WHERE j.nom_complet = 'Sofia Rodriguez'
LIMIT 1;

-- Enable RLS
ALTER TABLE ligues ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique pour ligues actives
CREATE POLICY "Ligues actives sont publiquement lisibles"
  ON ligues
  FOR SELECT
  TO public
  USING (statut = 'active');

-- Politique d'insertion pour utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent créer des ligues"
  ON ligues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = createur_id);

-- Politique de mise à jour pour créateur
CREATE POLICY "Créateurs peuvent modifier leurs ligues"
  ON ligues
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = createur_id);

-- Trigger pour updated_at
CREATE TRIGGER update_ligues_updated_at
  BEFORE UPDATE ON ligues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();