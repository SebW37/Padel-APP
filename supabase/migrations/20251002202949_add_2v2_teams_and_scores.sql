/*
  # Add 2v2 Teams and Scores to Challenges

  ## Changes Made
  
  1. New Columns for Team 1
    - `equipe1_joueur1_id` (uuid, nullable) - First player of team 1
    - `equipe1_joueur2_id` (uuid, nullable) - Second player of team 1
  
  2. New Columns for Team 2
    - `equipe2_joueur1_id` (uuid, nullable) - First player of team 2
    - `equipe2_joueur2_id` (uuid, nullable) - Second player of team 2
  
  3. Score Columns
    - `score_equipe1` (integer, nullable) - Score for team 1
    - `score_equipe2` (integer, nullable) - Score for team 2
  
  4. Notes
    - All new columns are nullable to maintain backward compatibility with existing 1v1 challenges
    - Foreign keys reference the joueurs table
    - Scores are only filled when the match is completed
*/

-- Add team 1 players
ALTER TABLE defis 
ADD COLUMN IF NOT EXISTS equipe1_joueur1_id uuid REFERENCES joueurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS equipe1_joueur2_id uuid REFERENCES joueurs(id) ON DELETE SET NULL;

-- Add team 2 players
ALTER TABLE defis 
ADD COLUMN IF NOT EXISTS equipe2_joueur1_id uuid REFERENCES joueurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS equipe2_joueur2_id uuid REFERENCES joueurs(id) ON DELETE SET NULL;

-- Add scores
ALTER TABLE defis 
ADD COLUMN IF NOT EXISTS score_equipe1 integer,
ADD COLUMN IF NOT EXISTS score_equipe2 integer;

-- Add check constraints to ensure valid scores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'score_equipe1_valid'
  ) THEN
    ALTER TABLE defis ADD CONSTRAINT score_equipe1_valid CHECK (score_equipe1 >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'score_equipe2_valid'
  ) THEN
    ALTER TABLE defis ADD CONSTRAINT score_equipe2_valid CHECK (score_equipe2 >= 0);
  END IF;
END $$;