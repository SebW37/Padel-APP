-- Script pour vérifier les données de test2@padel.com
-- À exécuter dans le SQL Editor de Supabase

-- 1. Vérifier que le compte existe
SELECT 
  u.id,
  u.email,
  u.created_at,
  j.nom_complet,
  j.points_classement,
  j.victoires,
  j.defaites,
  j.matchs_joues
FROM auth.users u
LEFT JOIN joueurs j ON j.id = u.id
WHERE u.email = 'test2@padel.com';

-- 2. Compter les données liées
SELECT 
  'Ligues' as type, 
  COUNT(*) as count
FROM ligues_joueurs lj
JOIN joueurs j ON lj.joueur_id = j.id
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com'
UNION ALL
SELECT 
  'Défis', 
  COUNT(*) 
FROM defis d
JOIN joueurs j ON (d.expediteur_id = j.id OR d.destinataire_id = j.id)
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com'
UNION ALL
SELECT 
  'Notifications', 
  COUNT(*) 
FROM notifications n
JOIN joueurs j ON n.destinataire_id = j.id
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com'
UNION ALL
SELECT 
  'Matchs', 
  COUNT(*) 
FROM matchs m
JOIN joueurs j ON (m.joueur1_id = j.id OR m.joueur2_id = j.id OR m.joueur3_id = j.id OR m.joueur4_id = j.id)
JOIN auth.users u ON j.id = u.id
WHERE u.email = 'test2@padel.com';

