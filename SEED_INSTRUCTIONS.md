# 🌱 Instructions pour Créer une Base de Données Complète de Test

## ⚠️ Problème avec les Scripts Node.js

Les scripts Node.js échouent à cause des restrictions **Row Level Security (RLS)** de Supabase. La clé API `anon` n'a pas les permissions nécessaires pour insérer dans certaines tables.

## ✅ Solution : Script SQL

Un script SQL complet a été créé qui peut être exécuté directement dans Supabase, contournant les restrictions RLS.

## 📋 Étapes pour Exécuter le Script

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. **Ouvrir le SQL Editor**
   - Allez sur https://supabase.com/dashboard/project/rmvcsgdohzgiidaxmtnq/sql
   - Ou dans votre dashboard : **SQL Editor** dans le menu de gauche

2. **Copier le script**
   - Ouvrez le fichier `supabase/seed-test-data.sql`
   - Copiez tout le contenu

3. **Exécuter le script**
   - Collez le script dans l'éditeur SQL
   - Cliquez sur **Run** ou appuyez sur `Ctrl+Enter`
   - Attendez la fin de l'exécution (peut prendre 1-2 minutes)

4. **Vérifier les résultats**
   - Le script affichera un résumé à la fin avec le nombre d'enregistrements créés

### Option 2 : Via l'API avec Service Role Key

Si vous avez accès à la clé `service_role` (⚠️ **NE JAMAIS EXPOSER CETTE CLÉ DANS LE CLIENT**), vous pouvez créer un script qui l'utilise.

## 📊 Ce que le Script Crée

Le script SQL crée :

- ✅ **Relations ligues_joueurs** : Pour toutes les ligues existantes
- ✅ **100 matchs (2v2)** : Avec scores réalistes et dates variées
- ✅ **80 défis** : Avec différents statuts (en_attente, accepte, refuse, termine)
- ✅ **150 notifications** : Réparties entre tous les joueurs
- ✅ **Statistiques mises à jour** : Victoires, défaites, matchs joués pour chaque joueur

## 🎯 Résultat Attendu

Après l'exécution, vous devriez avoir :

| Table | Nombre Approximatif |
|-------|---------------------|
| Joueurs | 55+ |
| Ligues | 3+ |
| Ligues_joueurs | ~30+ |
| Matchs | 100+ |
| Défis | 80+ |
| Notifications | 150+ |

## 🔄 Pour Régénérer les Données

Si vous voulez régénérer les données :

1. **Option 1 : Supprimer et recréer**
   ```sql
   -- Supprimer les données de test (ATTENTION: supprime tout!)
   TRUNCATE TABLE matchs, defis, notifications, ligues_joueurs CASCADE;
   ```
   Puis réexécutez le script `seed-test-data.sql`

2. **Option 2 : Exécuter à nouveau**
   - Le script utilise `ON CONFLICT DO NOTHING` pour éviter les doublons
   - Vous pouvez l'exécuter plusieurs fois sans problème

## ✅ Vérification

Après l'exécution, vérifiez avec :

```bash
npm run explore:supabase
```

Ou dans Supabase :
```sql
SELECT 
  'Joueurs' as table_name, COUNT(*) as count FROM joueurs
UNION ALL
SELECT 'Matchs', COUNT(*) FROM matchs
UNION ALL
SELECT 'Défis', COUNT(*) FROM defis
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;
```

## 🎉 Une Fois Terminé

Votre base de données sera complète avec :
- ✅ Des joueurs avec statistiques variées
- ✅ Des matchs historiques pour tester les classements
- ✅ Des défis dans tous les statuts possibles
- ✅ Des notifications pour tester les fonctionnalités
- ✅ Des relations ligues-joueurs complètes

**Tous les tests sont maintenant possibles !** 🚀

