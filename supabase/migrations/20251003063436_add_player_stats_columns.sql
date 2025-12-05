/*
  # Add player statistics columns

  1. Changes
    - Add `victoires` column to track player wins
    - Add `defaites` column to track player losses
    - Add `matchs_joues` column to track total matches played

  2. Security
    - No changes to RLS policies
*/

-- Add statistics columns to joueurs table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'joueurs' AND column_name = 'victoires'
  ) THEN
    ALTER TABLE joueurs ADD COLUMN victoires integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'joueurs' AND column_name = 'defaites'
  ) THEN
    ALTER TABLE joueurs ADD COLUMN defaites integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'joueurs' AND column_name = 'matchs_joues'
  ) THEN
    ALTER TABLE joueurs ADD COLUMN matchs_joues integer DEFAULT 0 NOT NULL;
  END IF;
END $$;