# Versioning Supabase

Ce document explique comment le schéma et les données Supabase sont versionnés dans ce projet.

## Structure

### Migrations (`supabase/migrations/`)
Toutes les migrations de schéma sont stockées dans `supabase/migrations/` avec un format de nommage :
```
YYYYMMDDHHMMSS_description.sql
```

**⚠️ Important** : Les migrations sont appliquées dans l'ordre chronologique. Ne jamais modifier une migration déjà appliquée en production.

### Scripts utilitaires (`supabase/`)
Les scripts SQL utilitaires (seed, vérification, etc.) sont dans le dossier `supabase/` :
- `seed-test-data.sql` : Script de seeding complet
- `create-30-defis-test2.sql` : Création de défis fictifs
- `update-league-ranking.sql` : Mise à jour du système de classement de ligue
- `check-*.sql` : Scripts de vérification
- `link-data-to-*.sql` : Scripts de liaison de données

## Workflow

### Créer une nouvelle migration

1. **Créer le fichier de migration** :
   ```bash
   # Format : YYYYMMDDHHMMSS_description.sql
   # Exemple : 20251003130000_add_ligue_type_and_challenge.sql
   ```

2. **Écrire le SQL** dans le fichier

3. **Tester localement** (si possible avec Supabase CLI)

4. **Appliquer dans Supabase Dashboard** :
   - Aller dans SQL Editor
   - Copier/coller le contenu
   - Exécuter

5. **Commit dans Git** :
   ```bash
   git add supabase/migrations/YYYYMMDDHHMMSS_description.sql
   git commit -m "feat: ajout de [description]"
   ```

### Scripts utilitaires

Les scripts utilitaires peuvent être modifiés librement car ils ne modifient pas le schéma :
- Scripts de seed
- Scripts de vérification
- Scripts de liaison de données

## Migrations existantes

### Migrations de base (créées par bolt.new)
- `20250911190715_fading_surf.sql` à `20250911190853_proud_mouse.sql` : Schéma initial

### Migrations fonctionnalités
- `20251002194830_fix_defis_update_policy.sql` : Correction des politiques RLS pour défis
- `20251002202949_add_2v2_teams_and_scores.sql` : Ajout du support 2v2
- `20251002210642_create_ligues_joueurs_table.sql` : Création de la table ligues_joueurs
- `20251003045156_add_termine_status_to_defis.sql` : Ajout du statut "termine" aux défis
- `20251003063436_add_player_stats_columns.sql` : Ajout des colonnes de statistiques joueurs
- `20251003063457_add_match_validation_trigger.sql` : Trigger de validation de match
- `20251003081916_fix_match_trigger_on_insert.sql` : Correction du trigger
- `20251003083440_add_complete_defi_policy.sql` : Politique RLS pour compléter défis
- `20251003103117_implement_elo_rating_system.sql` : Système ELO initial
- `20251003105208_add_match_insert_trigger.sql` : Trigger d'insertion de match
- `20251003105347_recalculate_all_player_stats.sql` : Recalcul des stats
- `20251003120000_improve_elo_with_score_bonus.sql` : Amélioration ELO avec bonus score
- `20251003130000_add_ligue_type_and_challenge.sql` : Types de ligue et défis dans ligues

## Scripts à exécuter manuellement

Certains scripts doivent être exécutés manuellement dans Supabase Dashboard :

1. **`supabase/update-league-ranking.sql`** : Système de classement de ligue
   - À exécuter une fois pour créer les fonctions et triggers

2. **`supabase/create-30-defis-test2.sql`** : Création de défis fictifs
   - Script de test, à exécuter selon les besoins

## Bonnes pratiques

1. ✅ **Toujours versionner les migrations** dans Git
2. ✅ **Documenter les migrations** avec des commentaires SQL
3. ✅ **Tester les migrations** avant de les appliquer en production
4. ❌ **Ne jamais modifier** une migration déjà appliquée
5. ✅ **Créer une nouvelle migration** pour corriger un problème
6. ✅ **Utiliser des transactions** dans les migrations quand possible

## Synchronisation avec Supabase

Pour synchroniser le schéma local avec Supabase :

1. **Via Supabase Dashboard** (recommandé pour ce projet) :
   - Copier/coller les migrations dans SQL Editor
   - Exécuter dans l'ordre chronologique

2. **Via Supabase CLI** (si installé) :
   ```bash
   supabase db push
   ```

## Notes

- Le fichier `.env` contient les credentials Supabase et n'est **PAS versionné** (dans `.gitignore`)
- Les migrations sont appliquées manuellement via le Dashboard Supabase
- Tous les scripts SQL sont versionnés dans Git pour traçabilité


