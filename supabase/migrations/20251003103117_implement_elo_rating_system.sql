/*
  # Implement proper ELO rating system for matches

  1. Overview
    - Replaces the simple fixed points system with proper ELO calculation
    - Calculates team ratings as average of both players' ratings
    - Adjusts points based on expected vs actual outcome
    - Uses K-factor of 32 (standard for competitive games)

  2. ELO Formula
    - Expected score: E = 1 / (1 + 10^((RatingB - RatingA) / 400))
    - New rating: NewRating = OldRating + K × (ActualScore - ExpectedScore)
    - ActualScore: 1 for win, 0 for loss
    - K-factor: 32 (can be adjusted based on competition level)

  3. Changes
    - Updates the `update_player_stats_from_match()` function
    - Calculates average team ratings
    - Applies ELO formula to determine points gained/lost
    - Ensures minimum rating of 0 (no negative ratings)

  4. Example Scenarios
    - Equal teams (1500 vs 1500): Winner gains ~16 points, loser loses ~16 points
    - Strong vs weak (1800 vs 1200): 
      * If strong team wins: gains ~3 points, weak loses ~3 points
      * If weak team wins: gains ~29 points, strong loses ~29 points
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS match_validated_stats_update ON matchs;

-- Replace function with ELO calculation
CREATE OR REPLACE FUNCTION update_player_stats_from_match()
RETURNS TRIGGER AS $$
DECLARE
  v_k_factor integer := 32; -- Standard K-factor for competitive games
  v_team1_avg_rating numeric;
  v_team2_avg_rating numeric;
  v_expected_team1 numeric;
  v_expected_team2 numeric;
  v_actual_team1 numeric;
  v_actual_team2 numeric;
  v_points_team1 integer;
  v_points_team2 integer;
  v_player1_rating integer;
  v_player2_rating integer;
  v_player3_rating integer;
  v_player4_rating integer;
BEGIN
  -- Only process when status changes to 'valide'
  IF NEW.statut = 'valide' AND (OLD.statut IS NULL OR OLD.statut != 'valide') THEN
    
    -- Get current ratings for all players
    SELECT points_classement INTO v_player1_rating FROM joueurs WHERE id = NEW.joueur1_id;
    SELECT points_classement INTO v_player2_rating FROM joueurs WHERE id = NEW.joueur2_id;
    SELECT points_classement INTO v_player3_rating FROM joueurs WHERE id = NEW.joueur3_id;
    SELECT points_classement INTO v_player4_rating FROM joueurs WHERE id = NEW.joueur4_id;
    
    -- Calculate average team ratings
    v_team1_avg_rating := (v_player1_rating + v_player2_rating) / 2.0;
    v_team2_avg_rating := (v_player3_rating + v_player4_rating) / 2.0;
    
    -- Calculate expected scores using ELO formula
    -- Expected score for team 1: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
    v_expected_team1 := 1.0 / (1.0 + power(10, (v_team2_avg_rating - v_team1_avg_rating) / 400.0));
    v_expected_team2 := 1.0 / (1.0 + power(10, (v_team1_avg_rating - v_team2_avg_rating) / 400.0));
    
    -- Set actual scores (1 for win, 0 for loss)
    IF NEW.equipe1_gagnante THEN
      v_actual_team1 := 1.0;
      v_actual_team2 := 0.0;
    ELSE
      v_actual_team1 := 0.0;
      v_actual_team2 := 1.0;
    END IF;
    
    -- Calculate points change using ELO formula: K × (Actual - Expected)
    v_points_team1 := ROUND(v_k_factor * (v_actual_team1 - v_expected_team1));
    v_points_team2 := ROUND(v_k_factor * (v_actual_team2 - v_expected_team2));
    
    -- Update stats for Team 1 players (Player 1 and Player 2)
    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NEW.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NOT NEW.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = GREATEST(0, points_classement + v_points_team1)
    WHERE id = NEW.joueur1_id;

    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NEW.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NOT NEW.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = GREATEST(0, points_classement + v_points_team1)
    WHERE id = NEW.joueur2_id;

    -- Update stats for Team 2 players (Player 3 and Player 4)
    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NOT NEW.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NEW.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = GREATEST(0, points_classement + v_points_team2)
    WHERE id = NEW.joueur3_id;

    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NOT NEW.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NEW.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = GREATEST(0, points_classement + v_points_team2)
    WHERE id = NEW.joueur4_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER match_validated_stats_update
  AFTER UPDATE ON matchs
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_from_match();