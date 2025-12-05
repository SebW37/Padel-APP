/*
  # Système ELO avancé avec progression rapide et gestion cohérente des pertes

  1. Principe inspiré de Glicko et systèmes de placement
    - K-factor adaptatif selon le nombre de matchs (volatility)
    - Nouveaux joueurs (< 10 matchs) : K-factor très élevé (100-150)
    - Joueurs expérimentés (> 50 matchs) : K-factor standard (50)
    - Bonus exponentiel pour grandes différences de points
    - Système de perte cohérent (même logique inversée)

  2. Formule
    - K_factor = f(nombre_matchs) : 150 → 100 → 75 → 50
    - Score_factor: 1.0 à 3.0 (domination)
    - Surprise_factor: 1.0 à 2.5 (surprise)
    - Difference_bonus: 1.0 à 2.5 (grande différence)
    - Coefficient = K_factor × Score_factor × Surprise_factor × Difference_bonus
    - Points = Coefficient × (Résultat - Probabilité_attendue)

  3. Gestion des pertes
    - Même formule mais résultat inversé
    - Perdre contre un joueur beaucoup plus faible = perte importante
    - Perdre de manière écrasante = perte plus importante

  4. Exemples
    - Nouveau joueur (5 matchs) bat numéro 1 avec 6-0, 6-0:
      K=150, Score=3.0, Surprise=2.5, Diff=2.5
      Coefficient = 150 × 3.0 × 2.5 × 2.5 = 2812
      Points = 2812 × (1 - 0.01) = 2784 points!
    
    - Joueur expérimenté (100 matchs) bat numéro 1 avec 6-0, 6-0:
      K=50, Score=3.0, Surprise=2.5, Diff=2.5
      Coefficient = 50 × 3.0 × 2.5 × 2.5 = 937
      Points = 937 × (1 - 0.01) = 927 points
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS match_validated_stats_update ON matchs;

-- Replace function with advanced ELO calculation including volatility
CREATE OR REPLACE FUNCTION update_player_stats_from_match()
RETURNS TRIGGER AS $$
DECLARE
  v_k_factor_base integer; -- K-factor adaptatif selon le nombre de matchs
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
  v_player1_matchs integer;
  v_player2_matchs integer;
  v_player3_matchs integer;
  v_player4_matchs integer;
  v_team1_avg_matchs numeric;
  v_team2_avg_matchs numeric;
  
  -- Facteurs de coefficient
  v_score_factor numeric := 1.0;
  v_surprise_factor numeric := 1.0;
  v_difference_bonus numeric := 1.0;
  v_coefficient numeric;
  
  -- Variables pour analyser le score
  v_score_parts text[];
  v_jeux_gagnes_equipe1 integer := 0;
  v_jeux_gagnes_equipe2 integer := 0;
  v_jeux_perdus_equipe1 integer := 0;
  v_jeux_perdus_equipe2 integer := 0;
  v_probabilite_attendue numeric;
  v_difference_rating numeric;
BEGIN
  -- Only process when status changes to 'valide'
  IF NEW.statut = 'valide' AND (OLD.statut IS NULL OR OLD.statut != 'valide') THEN
    
    -- Get current ratings and match counts for all players
    SELECT points_classement, matchs_joues INTO v_player1_rating, v_player1_matchs 
    FROM joueurs WHERE id = NEW.joueur1_id;
    SELECT points_classement, matchs_joues INTO v_player2_rating, v_player2_matchs 
    FROM joueurs WHERE id = NEW.joueur2_id;
    SELECT points_classement, matchs_joues INTO v_player3_rating, v_player3_matchs 
    FROM joueurs WHERE id = NEW.joueur3_id;
    SELECT points_classement, matchs_joues INTO v_player4_rating, v_player4_matchs 
    FROM joueurs WHERE id = NEW.joueur4_id;
    
    -- Calculate average team ratings and match counts
    v_team1_avg_rating := (v_player1_rating + v_player2_rating) / 2.0;
    v_team2_avg_rating := (v_player3_rating + v_player4_rating) / 2.0;
    v_team1_avg_matchs := (v_player1_matchs + v_player2_matchs) / 2.0;
    v_team2_avg_matchs := (v_player3_matchs + v_player4_matchs) / 2.0;
    
    -- Calculate difference in ratings
    v_difference_rating := ABS(v_team1_avg_rating - v_team2_avg_rating);
    
    -- Calculate expected scores using ELO formula
    v_expected_team1 := 1.0 / (1.0 + power(10, (v_team2_avg_rating - v_team1_avg_rating) / 400.0));
    v_expected_team2 := 1.0 / (1.0 + power(10, (v_team1_avg_rating - v_team2_avg_rating) / 400.0));
    
    -- Determine which team won and their expected probability
    IF NEW.equipe1_gagnante THEN
      v_actual_team1 := 1.0;
      v_actual_team2 := 0.0;
      v_probabilite_attendue := v_expected_team1;
    ELSE
      v_actual_team1 := 0.0;
      v_actual_team2 := 1.0;
      v_probabilite_attendue := v_expected_team2;
    END IF;
    
    -- Parse score to calculate domination factor
    IF NEW.score IS NOT NULL AND NEW.score != '' THEN
      v_score_parts := string_to_array(NEW.score, ',');
      
      FOR i IN 1..LEAST(array_length(v_score_parts, 1), 3) LOOP
        BEGIN
          IF i = 1 THEN
            v_jeux_gagnes_equipe1 := v_jeux_gagnes_equipe1 + (regexp_match(trim(v_score_parts[i]), '^(\d+)'))[1]::integer;
            v_jeux_gagnes_equipe2 := v_jeux_gagnes_equipe2 + (regexp_match(trim(v_score_parts[i]), '-(\d+)$'))[1]::integer;
            v_jeux_perdus_equipe1 := v_jeux_perdus_equipe1 + (regexp_match(trim(v_score_parts[i]), '-(\d+)$'))[1]::integer;
            v_jeux_perdus_equipe2 := v_jeux_perdus_equipe2 + (regexp_match(trim(v_score_parts[i]), '^(\d+)'))[1]::integer;
          ELSIF i = 2 THEN
            v_jeux_gagnes_equipe1 := v_jeux_gagnes_equipe1 + (regexp_match(trim(v_score_parts[i]), '^(\d+)'))[1]::integer;
            v_jeux_gagnes_equipe2 := v_jeux_gagnes_equipe2 + (regexp_match(trim(v_score_parts[i]), '-(\d+)$'))[1]::integer;
            v_jeux_perdus_equipe1 := v_jeux_perdus_equipe1 + (regexp_match(trim(v_score_parts[i]), '-(\d+)$'))[1]::integer;
            v_jeux_perdus_equipe2 := v_jeux_perdus_equipe2 + (regexp_match(trim(v_score_parts[i]), '^(\d+)'))[1]::integer;
          ELSIF i = 3 THEN
            v_jeux_gagnes_equipe1 := v_jeux_gagnes_equipe1 + (regexp_match(trim(v_score_parts[i]), '^(\d+)'))[1]::integer;
            v_jeux_gagnes_equipe2 := v_jeux_gagnes_equipe2 + (regexp_match(trim(v_score_parts[i]), '-(\d+)$'))[1]::integer;
            v_jeux_perdus_equipe1 := v_jeux_perdus_equipe1 + (regexp_match(trim(v_score_parts[i]), '-(\d+)$'))[1]::integer;
            v_jeux_perdus_equipe2 := v_jeux_perdus_equipe2 + (regexp_match(trim(v_score_parts[i]), '^(\d+)'))[1]::integer;
          END IF;
        EXCEPTION
          WHEN OTHERS THEN
            NULL;
        END;
      END LOOP;
      
      -- Score factor simplifié mais plus agressif
      IF NEW.equipe1_gagnante THEN
        IF v_jeux_perdus_equipe1 = 0 THEN
          v_score_factor := 3.0; -- Victoire parfaite 6-0, 6-0
        ELSIF v_jeux_perdus_equipe1 <= 3 THEN
          v_score_factor := 2.5; -- Très forte domination
        ELSIF v_jeux_perdus_equipe1 <= 6 THEN
          v_score_factor := 2.0; -- Forte domination
        ELSIF v_jeux_perdus_equipe1 <= 9 THEN
          v_score_factor := 1.5; -- Domination modérée
        ELSE
          v_score_factor := 1.2; -- Victoire nette
        END IF;
      ELSE
        IF v_jeux_perdus_equipe2 = 0 THEN
          v_score_factor := 3.0; -- Victoire parfaite 6-0, 6-0
        ELSIF v_jeux_perdus_equipe2 <= 3 THEN
          v_score_factor := 2.5; -- Très forte domination
        ELSIF v_jeux_perdus_equipe2 <= 6 THEN
          v_score_factor := 2.0; -- Forte domination
        ELSIF v_jeux_perdus_equipe2 <= 9 THEN
          v_score_factor := 1.5; -- Domination modérée
        ELSE
          v_score_factor := 1.2; -- Victoire nette
        END IF;
      END IF;
    END IF;
    
    -- Surprise factor
    v_surprise_factor := 1.0 + (1.0 - v_probabilite_attendue) * 1.5;
    v_surprise_factor := GREATEST(1.0, LEAST(2.5, v_surprise_factor));
    
    -- Bonus différence: fonction exponentielle plus agressive
    IF v_difference_rating > 3000 THEN
      v_difference_bonus := 2.5; -- Très grande différence
    ELSIF v_difference_rating > 2000 THEN
      v_difference_bonus := 2.0; -- Grande différence
    ELSIF v_difference_rating > 1000 THEN
      v_difference_bonus := 1.6; -- Différence moyenne
    ELSIF v_difference_rating > 500 THEN
      v_difference_bonus := 1.3; -- Petite différence
    ELSE
      v_difference_bonus := 1.0; -- Pas de bonus
    END IF;
    
    -- K-factor adaptatif selon le nombre de matchs (volatility)
    -- Nouveaux joueurs progressent beaucoup plus vite
    IF NEW.equipe1_gagnante THEN
      -- Équipe 1 gagne - utiliser leur moyenne de matchs
      IF v_team1_avg_matchs < 5 THEN
        v_k_factor_base := 150; -- Très nouveau joueur
      ELSIF v_team1_avg_matchs < 10 THEN
        v_k_factor_base := 120; -- Nouveau joueur
      ELSIF v_team1_avg_matchs < 20 THEN
        v_k_factor_base := 90; -- Joueur en développement
      ELSIF v_team1_avg_matchs < 50 THEN
        v_k_factor_base := 70; -- Joueur expérimenté
      ELSE
        v_k_factor_base := 50; -- Joueur très expérimenté
      END IF;
    ELSE
      -- Équipe 2 gagne - utiliser leur moyenne de matchs
      IF v_team2_avg_matchs < 5 THEN
        v_k_factor_base := 150;
      ELSIF v_team2_avg_matchs < 10 THEN
        v_k_factor_base := 120;
      ELSIF v_team2_avg_matchs < 20 THEN
        v_k_factor_base := 90;
      ELSIF v_team2_avg_matchs < 50 THEN
        v_k_factor_base := 70;
      ELSE
        v_k_factor_base := 50;
      END IF;
    END IF;
    
    -- Limiter les facteurs
    v_score_factor := GREATEST(1.0, LEAST(3.0, v_score_factor));
    
    -- Calculer le coefficient final
    v_coefficient := v_k_factor_base * v_score_factor * v_surprise_factor * v_difference_bonus;
    
    -- Calculate points change (même formule pour gagnants et perdants)
    v_points_team1 := ROUND(v_coefficient * (v_actual_team1 - v_expected_team1));
    v_points_team2 := ROUND(v_coefficient * (v_actual_team2 - v_expected_team2));
    
    -- Update stats for Team 1 players
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

    -- Update stats for Team 2 players
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
