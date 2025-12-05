-- Script pour réactiver RLS sur les tables principales
-- À exécuter quand vous voulez remettre la sécurité en place

ALTER TABLE joueurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ligues ENABLE ROW LEVEL SECURITY;
ALTER TABLE ligues_joueurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchs ENABLE ROW LEVEL SECURITY;
ALTER TABLE defis ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

SELECT 'RLS réactivé sur toutes les tables principales' as status;

