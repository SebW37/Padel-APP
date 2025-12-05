-- Script pour désactiver temporairement RLS sur les tables principales
-- ⚠️ ATTENTION: Ceci désactive la sécurité. À utiliser uniquement pour le développement/test
-- À exécuter dans le SQL Editor de Supabase

-- Désactiver RLS sur les tables principales
ALTER TABLE joueurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ligues DISABLE ROW LEVEL SECURITY;
ALTER TABLE ligues_joueurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE matchs DISABLE ROW LEVEL SECURITY;
ALTER TABLE defis DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Afficher un message de confirmation
SELECT 'RLS désactivé sur toutes les tables principales' as status;

-- Pour réactiver RLS plus tard, utilisez:
-- ALTER TABLE joueurs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ligues ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ligues_joueurs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matchs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE defis ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

