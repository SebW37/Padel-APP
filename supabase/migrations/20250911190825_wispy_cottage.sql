/*
  # Création du système de défis

  1. Nouvelles Tables
    - `defis`
      - `id` (serial, primary key)
      - `expediteur_id` (uuid, foreign key)
      - `destinataire_id` (uuid, foreign key)
      - `message` (text, optional)
      - `statut` (enum: en_attente, accepte, refuse, expire)
      - `date_expiration` (timestamptz)

  2. Sécurité
    - Enable RLS sur `defis`
    - Politique de lecture pour expéditeur et destinataire
    - Politique de mise à jour pour destinataire
*/

-- Type enum pour le statut des défis
CREATE TYPE defi_statut AS ENUM ('en_attente', 'accepte', 'refuse', 'expire');

CREATE TABLE IF NOT EXISTS defis (
  id serial PRIMARY KEY,
  expediteur_id uuid REFERENCES joueurs(id) NOT NULL,
  destinataire_id uuid REFERENCES joueurs(id) NOT NULL,
  message text,
  statut defi_statut NOT NULL DEFAULT 'en_attente',
  date_expiration timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contraintes
  CONSTRAINT different_players CHECK (expediteur_id != destinataire_id)
);

-- Insertion de défis d'exemple
INSERT INTO defis (expediteur_id, destinataire_id, message, statut) 
SELECT 
  j1.id, j2.id, 'Prêt pour un match ?', 'en_attente'
FROM joueurs j1, joueurs j2 
WHERE j1.nom_complet = 'Carlos Martinez' AND j2.nom_complet = 'Jean Dubois'
LIMIT 1;

INSERT INTO defis (expediteur_id, destinataire_id, message, statut) 
SELECT 
  j1.id, j2.id, 'Match confirmé pour demain', 'accepte'
FROM joueurs j1, joueurs j2 
WHERE j1.nom_complet = 'Sofia Rodriguez' AND j2.nom_complet = 'Emma Laurent'
LIMIT 1;

-- Enable RLS
ALTER TABLE defis ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour expéditeur et destinataire
CREATE POLICY "Participants peuvent voir leurs défis"
  ON defis
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (expediteur_id, destinataire_id)
  );

-- Politique d'insertion pour utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent créer des défis"
  ON defis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = expediteur_id);

-- Politique de mise à jour pour destinataire
CREATE POLICY "Destinataires peuvent répondre aux défis"
  ON defis
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = destinataire_id);

-- Trigger pour updated_at
CREATE TRIGGER update_defis_updated_at
  BEFORE UPDATE ON defis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour expirer automatiquement les défis
CREATE OR REPLACE FUNCTION expirer_defis_automatiquement()
RETURNS void AS $$
BEGIN
  UPDATE defis 
  SET statut = 'expire', updated_at = now()
  WHERE statut = 'en_attente' AND date_expiration < now();
END;
$$ LANGUAGE plpgsql;