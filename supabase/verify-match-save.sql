-- Script pour vérifier que les matchs sont bien enregistrés
-- À exécuter après avoir saisi un résultat de défi

-- 1. Voir les derniers matchs créés
SELECT 
  m.id,
  m.date_match,
  m.score,
  m.statut,
  m.equipe1_gagnante,
  j1.nom_complet as joueur1,
  j2.nom_complet as joueur2,
  j3.nom_complet as joueur3,
  j4.nom_complet as joueur4,
  m.created_at
FROM matchs m
JOIN joueurs j1 ON m.joueur1_id = j1.id
JOIN joueurs j2 ON m.joueur2_id = j2.id
JOIN joueurs j3 ON m.joueur3_id = j3.id
JOIN joueurs j4 ON m.joueur4_id = j4.id
ORDER BY m.created_at DESC
LIMIT 10;

-- 2. Voir les défis terminés récemment
SELECT 
  d.id,
  d.statut,
  d.message,
  e.nom_complet as expediteur,
  dest.nom_complet as destinataire,
  d.updated_at
FROM defis d
JOIN joueurs e ON d.expediteur_id = e.id
JOIN joueurs dest ON d.destinataire_id = dest.id
WHERE d.statut = 'termine'
ORDER BY d.updated_at DESC
LIMIT 10;

-- 3. Vérifier que les statistiques des joueurs sont mises à jour
SELECT 
  j.nom_complet,
  j.matchs_joues,
  j.victoires,
  j.defaites,
  j.points_classement,
  j.updated_at
FROM joueurs j
WHERE j.matchs_joues > 0
ORDER BY j.updated_at DESC
LIMIT 10;


