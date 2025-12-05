/*
  # Recalculate all player stats from scratch

  1. Problem
    - Old matches were created before INSERT trigger was added
    - Player stats (victoires, defaites, matchs_joues, points_classement) are incorrect
    - Need to reprocess all validated matches

  2. Solution
    - Reset all player stats to zero
    - Process each validated match in chronological order
    - Apply ELO calculations manually for historical matches
    - Future matches will use triggers automatically

  3. Process
    - Reset stats for all players
    - Loop through all validated matches chronologically
    - Apply same ELO logic as trigger function
*/

DO $$
DECLARE
  v_match RECORD;
  v_player1_rating integer;
  v_player2_rating integer;
  v_player3_rating integer;
  v_player4_rating integer;
  v_player1_division integer;
  v_player2_division integer;
  v_player3_division integer;
  v_player4_division integer;
  v_team1_avg_rating numeric;
  v_team2_avg_rating numeric;
  v_expected_team1 numeric;
  v_expected_team2 numeric;
  v_actual_team1 numeric;
  v_actual_team2 numeric;
  v_points_team1 integer;
  v_points_team2 integer;
  v_avg_division numeric;
  v_k_factor integer;
BEGIN
  -- Step 1: Reset all player stats to initial values
  RAISE NOTICE 'Resetting all player stats...';
  UPDATE joueurs 
  SET 
    victoires = 0,
    defaites = 0,
    matchs_joues = 0;
  -- Keep points_classement as is (starting rating)

  RAISE NOTICE 'Processing % validated matches...', (SELECT COUNT(*) FROM matchs WHERE statut = 'valide');

  -- Step 2: Process all validated matches in chronological order
  FOR v_match IN 
    SELECT * FROM matchs 
    WHERE statut = 'valide' 
    ORDER BY created_at ASC
  LOOP
    -- Get current ratings and divisions
    SELECT points_classement, division_id INTO v_player1_rating, v_player1_division 
    FROM joueurs WHERE id = v_match.joueur1_id;
    
    SELECT points_classement, division_id INTO v_player2_rating, v_player2_division 
    FROM joueurs WHERE id = v_match.joueur2_id;
    
    SELECT points_classement, division_id INTO v_player3_rating, v_player3_division 
    FROM joueurs WHERE id = v_match.joueur3_id;
    
    SELECT points_classement, division_id INTO v_player4_rating, v_player4_division 
    FROM joueurs WHERE id = v_match.joueur4_id;
    
    -- Calculate average division for K-factor
    v_avg_division := (v_player1_division + v_player2_division + 
                      v_player3_division + v_player4_division) / 4.0;
    
    -- Adaptive K-factor
    IF v_avg_division <= 5 THEN
      v_k_factor := 40;
    ELSIF v_avg_division <= 10 THEN
      v_k_factor := 30;
    ELSE
      v_k_factor := 20;
    END IF;
    
    -- Calculate team averages
    v_team1_avg_rating := (v_player1_rating + v_player2_rating) / 2.0;
    v_team2_avg_rating := (v_player3_rating + v_player4_rating) / 2.0;
    
    -- ELO formula
    v_expected_team1 := 1.0 / (1.0 + power(10, (v_team2_avg_rating - v_team1_avg_rating) / 400.0));
    v_expected_team2 := 1.0 / (1.0 + power(10, (v_team1_avg_rating - v_team2_avg_rating) / 400.0));
    
    -- Actual scores
    IF v_match.equipe1_gagnante THEN
      v_actual_team1 := 1.0;
      v_actual_team2 := 0.0;
    ELSE
      v_actual_team1 := 0.0;
      v_actual_team2 := 1.0;
    END IF;
    
    -- Calculate points change
    v_points_team1 := ROUND(v_k_factor * (v_actual_team1 - v_expected_team1));
    v_points_team2 := ROUND(v_k_factor * (v_actual_team2 - v_expected_team2));
    
    -- Update Team 1 players
    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN v_match.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NOT v_match.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = GREATEST(0, points_classement + v_points_team1)
    WHERE id = v_match.joueur1_id;

    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN v_match.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN NOT v_match.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = GREATEST(0, points_classement + v_points_team1)
    WHERE id = v_match.joueur2_id;

    -- Update Team 2 players
    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NOT v_match.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN v_match.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = GREATEST(0, points_classement + v_points_team2)
    WHERE id = v_match.joueur3_id;

    UPDATE joueurs 
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = CASE WHEN NOT v_match.equipe1_gagnante THEN victoires + 1 ELSE victoires END,
      defaites = CASE WHEN v_match.equipe1_gagnante THEN defaites + 1 ELSE defaites END,
      points_classement = GREATEST(0, points_classement + v_points_team2)
    WHERE id = v_match.joueur4_id;

  END LOOP;

  RAISE NOTICE 'Stats recalculation complete!';
END $$;