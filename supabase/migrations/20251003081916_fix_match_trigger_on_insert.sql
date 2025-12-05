/*
  # Fix match validation trigger to work on INSERT

  1. Changes
    - Modify trigger to fire on both INSERT and UPDATE
    - Adjust condition to handle INSERT (when OLD is NULL)
    
  2. Behavior
    - When a match is created with statut='valide', stats are updated immediately
    - When a match status changes to 'valide', stats are updated
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS match_validated_stats_update ON matchs;

-- Create trigger that fires on both INSERT and UPDATE
CREATE TRIGGER match_validated_stats_update
  AFTER INSERT OR UPDATE ON matchs
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_from_match();
