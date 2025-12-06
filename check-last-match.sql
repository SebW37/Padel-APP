-- Script pour vérifier le dernier match enregistré
-- À exécuter dans le SQL Editor de Supabase

-- 1. Voir les 5 derniers matchs créés avec les détails complets
SELECT 
  m.id,
  m.date_match,
  m.score,
  m.statut,
  m.equipe1_gagnante,
  m.created_at,
  j1.nom_complet as joueur1_equipe1,
  j2.nom_complet as joueur2_equipe1,
  j3.nom_complet as joueur1_equipe2,
  j4.nom_complet as joueur2_equipe2,
  CASE 
    WHEN m.equipe1_gagnante THEN j1.nom_complet || ' & ' || j2.nom_complet
    ELSE j3.nom_complet || ' & ' || j4.nom_complet
  END as equipe_gagnante
FROM matchs m
JOIN joueurs j1 ON m.joueur1_id = j1.id
JOIN joueurs j2 ON m.joueur2_id = j2.id
JOIN joueurs j3 ON m.joueur3_id = j3.id
JOIN joueurs j4 ON m.joueur4_id = j4.id
ORDER BY m.created_at DESC
LIMIT 5;

-- 2. Chercher spécifiquement le match avec "Test User 2" et "Marie Laurent 15"
SELECT 
  m.id,
  m.date_match,
  m.score,
  m.statut,
  m.equipe1_gagnante,
  m.created_at,
  j1.nom_complet as joueur1_equipe1,
  j2.nom_complet as joueur2_equipe1,
  j3.nom_complet as joueur1_equipe2,
  j4.nom_complet as joueur2_equipe2
FROM matchs m
JOIN joueurs j1 ON m.joueur1_id = j1.id
JOIN joueurs j2 ON m.joueur2_id = j2.id
JOIN joueurs j3 ON m.joueur3_id = j3.id
JOIN joueurs j4 ON m.joueur4_id = j4.id
WHERE (
  (j1.nom_complet LIKE '%Marie Laurent 15%' OR j2.nom_complet LIKE '%Marie Laurent 15%')
  AND (j1.nom_complet LIKE '%Carlos Martinez%' OR j2.nom_complet LIKE '%Carlos Martinez%')
  AND (j3.nom_complet LIKE '%Test User 2%' OR j4.nom_complet LIKE '%Test User 2%')
  AND (j3.nom_complet LIKE '%Sofia Rodriguez%' OR j4.nom_complet LIKE '%Sofia Rodriguez%')
)
OR (
  (j3.nom_complet LIKE '%Marie Laurent 15%' OR j4.nom_complet LIKE '%Marie Laurent 15%')
  AND (j3.nom_complet LIKE '%Carlos Martinez%' OR j4.nom_complet LIKE '%Carlos Martinez%')
  AND (j1.nom_complet LIKE '%Test User 2%' OR j2.nom_complet LIKE '%Test User 2%')
  AND (j1.nom_complet LIKE '%Sofia Rodriguez%' OR j2.nom_complet LIKE '%Sofia Rodriguez%')
)
ORDER BY m.created_at DESC
LIMIT 5;

-- 3. Vérifier les statistiques mises à jour pour "Test User 2"
SELECT 
  j.nom_complet,
  j.matchs_joues,
  j.victoires,
  j.defaites,
  j.points_classement,
  j.updated_at
FROM joueurs j
WHERE j.nom_complet = 'Test User 2';

-- 4. Compter le nombre total de matchs
SELECT COUNT(*) as total_matchs FROM matchs WHERE statut = 'valide';


