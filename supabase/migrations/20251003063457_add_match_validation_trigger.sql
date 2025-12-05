/*
  # Add automatic stats update on match validation

  1. New Function
    - `update_player_stats_from_match()` - Updates player statistics when a match is validated

  2. New Trigger
    - Automatically updates player stats when match status changes to 'valide'

  3. Logic
    - Increments matchs_joues for all 4 players
    - Increments victoires for winning team players
    - Increments defaites for losing team players
    - Updates points_classement (ELO) for all players
*/

-- Function to update player stats when a match is validated
CREATE OR REPLACE FUNCTION update_player_stats_from_match()
RETURNS TRIGGER AS $$
DECLARE
  v_points_gagnant integer := 25;
  v_points_perdant integer := -15;
BEGIN
  -- Only process when status changes to 'valide'
  IF NEW.statut = 'valide' AND (OLD.statut IS NULL OR OLD.statut != 'valide') THEN
    
    -- Update stats for all 4 players
    -- Player 1 (Team 1)
    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NEW.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NOT NEW.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = points_classement + CASE WHEN NEW.equipe1_gagnante THEN v_points_gagnant ELSE v_points_perdant END
    WHERE id = NEW.joueur1_id;

    -- Player 2 (Team 1)
    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NEW.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NOT NEW.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = points_classement + CASE WHEN NEW.equipe1_gagnante THEN v_points_gagnant ELSE v_points_perdant END
    WHERE id = NEW.joueur2_id;

    -- Player 3 (Team 2)
    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NOT NEW.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NEW.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = points_classement + CASE WHEN NOT NEW.equipe1_gagnante THEN v_points_gagnant ELSE v_points_perdant END
    WHERE id = NEW.joueur3_id;

    -- Player 4 (Team 2)
    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NOT NEW.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NEW.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = points_classement + CASE WHEN NOT NEW.equipe1_gagnante THEN v_points_gagnant ELSE v_points_perdant END
    WHERE id = NEW.joueur4_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS match_validated_stats_update ON matchs;
CREATE TRIGGER match_validated_stats_update
  AFTER UPDATE ON matchs
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_from_match();