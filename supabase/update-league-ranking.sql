/*
  # Mise à jour du classement de ligue basé sur les victoires

  Cette fonction met à jour le classement de ligue après chaque match.
  Le classement est basé sur les VICTOIRES et POINTS de ligue, pas sur les points ELO.
*/

-- Fonction pour mettre à jour le classement de ligue après un match
CREATE OR REPLACE FUNCTION update_league_ranking_after_match()
RETURNS TRIGGER AS $$
DECLARE
  v_ligue_id integer;
  v_joueur1_won boolean;
  v_joueur2_won boolean;
  v_joueur3_won boolean;
  v_joueur4_won boolean;
BEGIN
  -- Seulement pour les matchs validés
  IF NEW.statut = 'valide' AND (OLD.statut IS NULL OR OLD.statut != 'valide') THEN
    
    -- Déterminer qui a gagné
    v_joueur1_won := NEW.equipe1_gagnante;
    v_joueur2_won := NEW.equipe1_gagnante;
    v_joueur3_won := NOT NEW.equipe1_gagnante;
    v_joueur4_won := NOT NEW.equipe1_gagnante;
    
    -- Mettre à jour les stats de ligue pour chaque joueur
    -- Points de ligue: +3 pour victoire, +1 pour défaite
    -- Victoires/Défaites: incrémenter selon le résultat
    
    -- Joueur 1
    UPDATE ligues_joueurs
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = victoires + CASE WHEN v_joueur1_won THEN 1 ELSE 0 END,
      defaites = defaites + CASE WHEN NOT v_joueur1_won THEN 1 ELSE 0 END,
      points = points + CASE WHEN v_joueur1_won THEN 3 ELSE 1 END
    WHERE joueur_id = NEW.joueur1_id
      AND ligue_id IN (
        SELECT ligue_id FROM ligues_joueurs 
        WHERE joueur_id IN (NEW.joueur1_id, NEW.joueur2_id, NEW.joueur3_id, NEW.joueur4_id)
        GROUP BY ligue_id
        HAVING COUNT(DISTINCT joueur_id) >= 2
      );
    
    -- Joueur 2
    UPDATE ligues_joueurs
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = victoires + CASE WHEN v_joueur2_won THEN 1 ELSE 0 END,
      defaites = defaites + CASE WHEN NOT v_joueur2_won THEN 1 ELSE 0 END,
      points = points + CASE WHEN v_joueur2_won THEN 3 ELSE 1 END
    WHERE joueur_id = NEW.joueur2_id
      AND ligue_id IN (
        SELECT ligue_id FROM ligues_joueurs 
        WHERE joueur_id IN (NEW.joueur1_id, NEW.joueur2_id, NEW.joueur3_id, NEW.joueur4_id)
        GROUP BY ligue_id
        HAVING COUNT(DISTINCT joueur_id) >= 2
      );
    
    -- Joueur 3
    UPDATE ligues_joueurs
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = victoires + CASE WHEN v_joueur3_won THEN 1 ELSE 0 END,
      defaites = defaites + CASE WHEN NOT v_joueur3_won THEN 1 ELSE 0 END,
      points = points + CASE WHEN v_joueur3_won THEN 3 ELSE 1 END
    WHERE joueur_id = NEW.joueur3_id
      AND ligue_id IN (
        SELECT ligue_id FROM ligues_joueurs 
        WHERE joueur_id IN (NEW.joueur1_id, NEW.joueur2_id, NEW.joueur3_id, NEW.joueur4_id)
        GROUP BY ligue_id
        HAVING COUNT(DISTINCT joueur_id) >= 2
      );
    
    -- Joueur 4
    UPDATE ligues_joueurs
    SET 
      matchs_joues = matchs_joues + 1,
      victoires = victoires + CASE WHEN v_joueur4_won THEN 1 ELSE 0 END,
      defaites = defaites + CASE WHEN NOT v_joueur4_won THEN 1 ELSE 0 END,
      points = points + CASE WHEN v_joueur4_won THEN 3 ELSE 1 END
    WHERE joueur_id = NEW.joueur4_id
      AND ligue_id IN (
        SELECT ligue_id FROM ligues_joueurs 
        WHERE joueur_id IN (NEW.joueur1_id, NEW.joueur2_id, NEW.joueur3_id, NEW.joueur4_id)
        GROUP BY ligue_id
        HAVING COUNT(DISTINCT joueur_id) >= 2
      );
    
    -- Recalculer les positions dans chaque ligue affectée
    -- Pour chaque ligue où au moins 2 joueurs ont joué
    FOR v_ligue_id IN (
      SELECT DISTINCT ligue_id 
      FROM ligues_joueurs 
      WHERE joueur_id IN (NEW.joueur1_id, NEW.joueur2_id, NEW.joueur3_id, NEW.joueur4_id)
    ) LOOP
      -- Mettre à jour les positions selon les points (victoires en cas d'égalité)
      WITH ranked AS (
        SELECT 
          id,
          ROW_NUMBER() OVER (
            ORDER BY points DESC, victoires DESC, matchs_joues ASC
          ) as new_position
        FROM ligues_joueurs
        WHERE ligue_id = v_ligue_id
      )
      UPDATE ligues_joueurs lj
      SET position = r.new_position
      FROM ranked r
      WHERE lj.id = r.id;
    END LOOP;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS match_validated_league_ranking_update ON matchs;
CREATE TRIGGER match_validated_league_ranking_update
  AFTER UPDATE ON matchs
  FOR EACH ROW
  EXECUTE FUNCTION update_league_ranking_after_match();

