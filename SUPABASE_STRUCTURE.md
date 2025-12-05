# 📊 Structure de la Base de Données Supabase

**URL du projet:** `https://rmvcsgdohzgiidaxmtnq.supabase.co`  
**Dernière mise à jour:** Générée automatiquement via `npm run read:supabase`

## 📋 Résumé des Tables

| Table | Enregistrements | Statut |
|-------|----------------|--------|
| `joueurs` | 30 | ✅ Données présentes |
| `divisions` | 15 | ✅ Données présentes |
| `clubs` | 8 | ✅ Données présentes |
| `ligues` | 3 | ✅ Données présentes |
| `ligues_joueurs` | 0 | 📭 Vide |
| `matchs` | 0 | 📭 Vide |
| `defis` | 0 | 📭 Vide |
| `notifications` | 0 | 📭 Vide |
| `sanctions` | 0 | 📭 Vide |

## 🗂️ Structure Détaillée

### Table: `joueurs`
**Colonnes principales:**
- `id` (UUID) - Identifiant unique
- `nom_complet` (string) - Nom complet du joueur
- `date_naissance` (date) - Date de naissance
- `sexe` (M/F) - Sexe du joueur
- `club_id` (int) - Référence au club
- `points_classement` (int) - Points de classement
- `division_id` (int) - Référence à la division
- `preference_langue` (string) - Langue préférée (fr, es, en, it)
- `victoires`, `defaites`, `matchs_joues` (int) - Statistiques
- `confidentialite` (json) - Paramètres de confidentialité
- `badges` (array) - Badges du joueur

**Exemple de données:**
```json
{
  "id": "3b7d3d01-7b45-4ec9-a59c-360c4b4ce26f",
  "nom_complet": "Sarah Johnson",
  "points_classement": 1880,
  "division_id": 7,
  "victoires": 0,
  "defaites": 4,
  "matchs_joues": 4
}
```

### Table: `divisions`
**Colonnes principales:**
- `id` (int) - Identifiant unique
- `nom` (json) - Nom multilingue {fr, es, en, it}
- `description` (json) - Description multilingue
- `niveau` (int) - Niveau de la division
- `points_minimum`, `points_maximum` (int) - Plage de points

**Exemple:**
```json
{
  "id": 1,
  "nom": {
    "fr": "Padelino Starter",
    "es": "Padelino Principiante",
    "en": "Padelino Starter",
    "it": "Padelino Principiante"
  },
  "niveau": 1,
  "points_minimum": 0,
  "points_maximum": 1000
}
```

### Table: `clubs`
**Colonnes principales:**
- `id` (int) - Identifiant unique
- `nom` (string) - Nom du club
- `pays` (string) - Pays
- `ville` (string) - Ville
- `latitude`, `longitude` (float) - Coordonnées GPS
- `statut` (string) - Statut (valide, en_attente, rejete)

### Table: `ligues`
**Colonnes principales:**
- `id` (int) - Identifiant unique
- `nom` (string) - Nom de la ligue
- `description` (string) - Description
- `format` (string) - Format (americano, paires_fixes)
- `nombre_joueurs` (int) - Nombre de joueurs
- `joueurs_ids` (array) - Liste des IDs des joueurs
- `statut` (string) - Statut (active, terminee, en_attente)
- `createur_id` (UUID) - ID du créateur

## 🛠️ Scripts Disponibles

### Explorer la base de données
```bash
npm run explore:supabase
```
Affiche un résumé rapide de toutes les tables.

### Lire la structure complète
```bash
npm run read:supabase
```
Génère un fichier `supabase-structure.json` avec toutes les données.

### Interroger une table spécifique
```bash
npm run query:supabase [nom_table]
```
Exemple: `npm run query:supabase joueurs`

## 📝 Notes

- Les tables `ligues_joueurs`, `matchs`, `defis`, `notifications`, et `sanctions` sont actuellement vides
- La table `joueurs` contient 30 joueurs avec des statistiques variées
- Les divisions sont multilingues (français, espagnol, anglais, italien)
- Les clubs sont géolocalisés avec latitude/longitude

## 🔄 Mise à jour

Pour mettre à jour cette documentation:
```bash
npm run read:supabase
```
Le fichier `supabase-structure.json` sera régénéré avec les dernières données.

