/*
  # Create ligues_joueurs table

  ## Description
  Table de liaison entre les ligues et les joueurs pour suivre la participation et les statistiques individuelles dans chaque ligue.

  1. New Tables
    - `ligues_joueurs`
      - `id` (serial, primary key) - Identifiant unique
      - `ligue_id` (integer, foreign key) - Référence à la ligue
      - `joueur_id` (uuid, foreign key) - Référence au joueur
      - `position` (integer) - Position du joueur dans le classement de la ligue
      - `points` (integer) - Points accumulés dans la ligue
      - `matchs_joues` (integer) - Nombre de matchs joués
      - `victoires` (integer) - Nombre de victoires
      - `defaites` (integer) - Nombre de défaites
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de mise à jour

  2. Security
    - Enable RLS on `ligues_joueurs` table
    - Add policies for authenticated users to read league data
    - Add policies for league members to update their own data
*/

CREATE TABLE IF NOT EXISTS ligues_joueurs (
  id SERIAL PRIMARY KEY,
  ligue_id INTEGER NOT NULL REFERENCES ligues(id) ON DELETE CASCADE,
  joueur_id UUID NOT NULL REFERENCES joueurs(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  matchs_joues INTEGER DEFAULT 0,
  victoires INTEGER DEFAULT 0,
  defaites INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ligue_id, joueur_id)
);

ALTER TABLE ligues_joueurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view league participants"
  ON ligues_joueurs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "League participants can update own stats"
  ON ligues_joueurs FOR UPDATE
  TO authenticated
  USING (auth.uid() = joueur_id)
  WITH CHECK (auth.uid() = joueur_id);

CREATE POLICY "League creator can insert participants"
  ON ligues_joueurs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ligues
      WHERE ligues.id = ligue_id
      AND ligues.createur_id = auth.uid()
    )
  );