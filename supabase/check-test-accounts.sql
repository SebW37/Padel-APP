-- Script pour vérifier les comptes de test disponibles
-- À exécuter dans le SQL Editor de Supabase

-- Lister tous les comptes avec @padel.com
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  j.nom_complet,
  j.points_classement,
  CASE 
    WHEN j.id IS NULL THEN '❌ Pas de profil joueur'
    ELSE '✅ Profil joueur existe'
  END as profil_status
FROM auth.users u
LEFT JOIN joueurs j ON j.id = u.id
WHERE u.email LIKE '%@padel.com'
ORDER BY u.created_at DESC
LIMIT 20;

-- Compter les comptes
SELECT 
  COUNT(*) as total_comptes,
  COUNT(j.id) as comptes_avec_profil
FROM auth.users u
LEFT JOIN joueurs j ON j.id = u.id
WHERE u.email LIKE '%@padel.com';

