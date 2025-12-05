/*
  # Add trigger for match INSERT operations

  1. Problem
    - Current trigger only fires on UPDATE
    - Matches are created with statut='valide' on INSERT
    - Stats are never updated because trigger never fires

  2. Solution
    - Add AFTER INSERT trigger in addition to UPDATE trigger
    - Both triggers use the same function
    - This ensures stats are updated whether match is:
      - Created as 'valide' (INSERT)
      - Updated to 'valide' (UPDATE)

  3. Changes
    - Keep existing UPDATE trigger
    - Add new INSERT trigger
    - Both use update_player_stats_from_match() function
*/

-- Add INSERT trigger (UPDATE trigger already exists)
CREATE TRIGGER match_inserted_stats_update
  AFTER INSERT ON matchs
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_from_match();