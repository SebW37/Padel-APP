/*
  # Ajouter le type de ligue et le système de défi dans les ligues

  1. Nouveau champ pour le type de ligue
    - `type_ligue` (enum: manuelle, automatique)
    - Détermine si les joueurs peuvent créer des matchs ou s'ils sont créés automatiquement

  2. Nouveau champ pour les défis de ligue
    - `ligue_id` dans la table `defis` (nullable)
    - Permet de lier un défi à une ligue spécifique

  3. Types de ligues
    - `manuelle`: Les joueurs peuvent créer des défis/matchs librement
    - `automatique`: Les matchs sont créés automatiquement selon un calendrier
*/

-- Ajouter le type enum pour le type de ligue
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ligue_type') THEN
    CREATE TYPE ligue_type AS ENUM ('manuelle', 'automatique');
  END IF;
END $$;

-- Ajouter le champ type_ligue à la table ligues
ALTER TABLE ligues 
ADD COLUMN IF NOT EXISTS type_ligue ligue_type NOT NULL DEFAULT 'manuelle';

-- Ajouter le champ ligue_id à la table defis
ALTER TABLE defis 
ADD COLUMN IF NOT EXISTS ligue_id integer REFERENCES ligues(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_defis_ligue_id ON defis(ligue_id);

-- Commentaires
COMMENT ON COLUMN ligues.type_ligue IS 'Type de ligue: manuelle (joueurs créent les matchs) ou automatique (matchs créés automatiquement)';
COMMENT ON COLUMN defis.ligue_id IS 'ID de la ligue si le défi est lié à une ligue';

