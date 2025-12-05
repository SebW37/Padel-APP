/*
  # Création du système de notifications

  1. Nouvelles Tables
    - `notifications`
      - `id` (serial, primary key)
      - `destinataire_id` (uuid, foreign key)
      - `type` (text)
      - `titre` (text)
      - `message` (text)
      - `donnees` (jsonb, optional)
      - `lu` (boolean)
      - `date_expiration` (timestamptz, optional)

  2. Sécurité
    - Enable RLS sur `notifications`
    - Politique de lecture pour destinataire
*/

CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  destinataire_id uuid REFERENCES joueurs(id) NOT NULL,
  type text NOT NULL,
  titre text NOT NULL,
  message text NOT NULL,
  donnees jsonb DEFAULT '{}',
  lu boolean NOT NULL DEFAULT false,
  date_expiration timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertion de notifications d'exemple
INSERT INTO notifications (destinataire_id, type, titre, message) 
SELECT 
  j.id, 'defi', 'Nouveau défi reçu', 'Carlos & Sofia vous défient pour un match'
FROM joueurs j 
WHERE j.nom_complet = 'Jean Dubois'
LIMIT 1;

INSERT INTO notifications (destinataire_id, type, titre, message) 
SELECT 
  j.id, 'classement', 'Promotion de division !', 'Félicitations ! Vous êtes maintenant Court Warrior'
FROM joueurs j 
WHERE j.nom_complet = 'Jean Dubois'
LIMIT 1;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour destinataire
CREATE POLICY "Destinataires peuvent voir leurs notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = destinataire_id);

-- Politique de mise à jour pour destinataire (marquer comme lu)
CREATE POLICY "Destinataires peuvent marquer leurs notifications comme lues"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = destinataire_id);

-- Politique d'insertion pour système
CREATE POLICY "Système peut créer des notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger pour updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour nettoyer les notifications expirées
CREATE OR REPLACE FUNCTION nettoyer_notifications_expirees()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications 
  WHERE date_expiration IS NOT NULL AND date_expiration < now();
END;
$$ LANGUAGE plpgsql;