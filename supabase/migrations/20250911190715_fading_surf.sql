/*
  # Création du système de divisions

  1. Nouvelles Tables
    - `divisions`
      - `id` (integer, primary key)
      - `nom` (jsonb, multilingue)
      - `description` (jsonb, multilingue)
      - `niveau` (integer, 1-15)
      - `points_minimum` (integer)
      - `points_maximum` (integer)

  2. Sécurité
    - Enable RLS sur `divisions`
    - Politique de lecture publique
*/

CREATE TABLE IF NOT EXISTS divisions (
  id integer PRIMARY KEY,
  nom jsonb NOT NULL,
  description jsonb NOT NULL,
  niveau integer NOT NULL CHECK (niveau >= 1 AND niveau <= 15),
  points_minimum integer NOT NULL DEFAULT 0,
  points_maximum integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertion des 15 divisions
INSERT INTO divisions (id, nom, description, niveau, points_minimum, points_maximum) VALUES
(1, '{"fr": "Padelino Starter", "es": "Padelino Principiante", "en": "Padelino Starter", "it": "Padelino Principiante"}', '{"fr": "Débutants complets", "es": "Principiantes completos", "en": "Complete beginners", "it": "Principianti completi"}', 1, 0, 99),
(2, '{"fr": "Rookie Padel", "es": "Rookie Padel", "en": "Rookie Padel", "it": "Rookie Padel"}', '{"fr": "Juste commencé", "es": "Recién comenzado", "en": "Just started", "it": "Appena iniziato"}', 2, 100, 249),
(3, '{"fr": "Court Beginner", "es": "Principiante de Pista", "en": "Court Beginner", "it": "Principiante Campo"}', '{"fr": "Premiers matchs sérieux", "es": "Primeros partidos serios", "en": "First serious matches", "it": "Prime partite serie"}', 3, 250, 499),
(4, '{"fr": "Rising Star", "es": "Estrella Emergente", "en": "Rising Star", "it": "Stella Nascente"}', '{"fr": "Progression visible", "es": "Progreso visible", "en": "Visible progress", "it": "Progresso visibile"}', 4, 500, 799),
(5, '{"fr": "Fast Breaker", "es": "Rompedor Rápido", "en": "Fast Breaker", "it": "Veloce Attaccante"}', '{"fr": "Bon niveau amateur", "es": "Buen nivel amateur", "en": "Good amateur level", "it": "Buon livello amatoriale"}', 5, 800, 1199),
(6, '{"fr": "Court Warrior", "es": "Guerrero de Pista", "en": "Court Warrior", "it": "Guerriero Campo"}', '{"fr": "Joueur confirmé local", "es": "Jugador confirmado local", "en": "Confirmed local player", "it": "Giocatore confermato locale"}', 6, 1200, 1699),
(7, '{"fr": "Baseline Master", "es": "Maestro de Fondo", "en": "Baseline Master", "it": "Maestro Fondo Campo"}', '{"fr": "Joueur régional", "es": "Jugador regional", "en": "Regional player", "it": "Giocatore regionale"}', 7, 1700, 2299),
(8, '{"fr": "Net Strategist", "es": "Estratega de Red", "en": "Net Strategist", "it": "Stratega Rete"}', '{"fr": "Excellents déplacements", "es": "Excelentes movimientos", "en": "Excellent movements", "it": "Movimenti eccellenti"}', 8, 2300, 2999),
(9, '{"fr": "Smash Specialist", "es": "Especialista en Smash", "en": "Smash Specialist", "it": "Specialista Smash"}', '{"fr": "Attaquant redoutable", "es": "Atacante temible", "en": "Formidable attacker", "it": "Attaccante temibile"}', 9, 3000, 3799),
(10, '{"fr": "Elite Padel", "es": "Elite Padel", "en": "Elite Padel", "it": "Elite Padel"}', '{"fr": "Joueur avancé", "es": "Jugador avanzado", "en": "Advanced player", "it": "Giocatore avanzato"}', 10, 3800, 4699),
(11, '{"fr": "Challenger Pro", "es": "Challenger Pro", "en": "Challenger Pro", "it": "Challenger Pro"}', '{"fr": "Niveau amateur tournois", "es": "Nivel amateur torneos", "en": "Tournament amateur level", "it": "Livello amatoriale tornei"}', 11, 4700, 5699),
(12, '{"fr": "Padel Ace", "es": "As del Padel", "en": "Padel Ace", "it": "Asso Padel"}', '{"fr": "Expertise tactique", "es": "Experiencia táctica", "en": "Tactical expertise", "it": "Esperienza tattica"}', 12, 5700, 6799),
(13, '{"fr": "Pro Circuit", "es": "Circuito Pro", "en": "Pro Circuit", "it": "Circuito Pro"}', '{"fr": "Semi-pro", "es": "Semi-pro", "en": "Semi-pro", "it": "Semi-pro"}', 13, 6800, 7999),
(14, '{"fr": "Master Padel", "es": "Maestro Padel", "en": "Master Padel", "it": "Maestro Padel"}', '{"fr": "National", "es": "Nacional", "en": "National", "it": "Nazionale"}', 14, 8000, 9499),
(15, '{"fr": "Grand Slam Legend", "es": "Leyenda Grand Slam", "en": "Grand Slam Legend", "it": "Leggenda Grand Slam"}', '{"fr": "Meilleur niveau mondial", "es": "Mejor nivel mundial", "en": "World class level", "it": "Livello mondiale"}', 15, 9500, 99999);

-- Enable RLS
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Divisions are publicly readable"
  ON divisions
  FOR SELECT
  TO public
  USING (true);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_divisions_updated_at
  BEFORE UPDATE ON divisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();