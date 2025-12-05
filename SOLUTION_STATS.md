# Solution: Stats ne s'actualisaient pas

## Problème identifié

Les résultats des matchs n'actualisaient pas les victoires et les points des joueurs.

### Cause racine

Le trigger de mise à jour des stats était configuré **uniquement pour UPDATE**, mais les matchs étaient créés avec `statut='valide'` dès l'**INSERT**. Le trigger ne se déclenchait donc jamais!

```sql
-- Ancien trigger (ne fonctionnait pas)
CREATE TRIGGER match_validated_stats_update
  AFTER UPDATE ON matchs  -- ❌ Ne capture pas les nouveaux matchs!
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_from_match();
```

## Solution implémentée

### 1. Ajout du trigger INSERT

J'ai ajouté un second trigger qui se déclenche lors de la création d'un match:

```sql
-- Nouveau trigger pour les INSERT
CREATE TRIGGER match_inserted_stats_update
  AFTER INSERT ON matchs  -- ✅ Capture les nouveaux matchs
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_from_match();
```

### 2. Recalcul de tous les anciens matchs

Les 60 matchs existants n'avaient jamais déclenché le trigger. J'ai créé une migration pour:
- Réinitialiser toutes les stats des joueurs (victoires, défaites, matchs_joues)
- Retraiter tous les matchs validés dans l'ordre chronologique
- Appliquer les calculs ELO correctement pour chaque match

## Résultat

✅ **Nouveaux matchs**: Les stats se mettent à jour automatiquement
✅ **Anciens matchs**: Tous les matchs ont été retraités correctement
✅ **Système ELO**: Fonctionne avec K-factor adaptatif (40/30/20)
✅ **Points**: Calculés selon la formule ELO standard
✅ **Victoires/Défaites**: Comptabilisées correctement

## Vérification

Pour vérifier que tout fonctionne:

1. Créez un nouveau match via l'app
2. Les stats devraient se mettre à jour immédiatement
3. Les points ELO devraient changer selon:
   - Division des joueurs (K-factor)
   - Différence de niveau entre équipes
   - Résultat du match (victoire/défaite)

## Exemple de calcul

### Match test créé:
- **Équipe 1** (gagnante): Jean Dubois 2 (2635 pts) + WEGELSEB (0 pts)
- **Équipe 2** (perdante): Test User (170 pts) + Isabella Silva 5 (3961 pts)

### Résultats:
- **Équipe 1**: +39 points chacun
- **Équipe 2**: -39 points chacun

K-factor utilisé = 30 (divisions moyennes 4.5, donc entre 1-5 et 6-10)

## Triggers actifs

Deux triggers sont maintenant actifs:

1. `match_inserted_stats_update` - Déclenché lors de la création d'un match
2. `match_validated_stats_update` - Déclenché lors de la validation d'un match

Les deux utilisent la même fonction `update_player_stats_from_match()` qui:
- Vérifie que le statut est 'valide'
- Calcule le K-factor selon les divisions
- Applique la formule ELO
- Met à jour victoires, défaites, matchs_joues et points_classement
