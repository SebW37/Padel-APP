# 📦 Guide d'Export du Projet

## 🎯 Export Complet

Pour exporter ce projet et continuer à le développer sur une autre plateforme (VS Code, Cursor, etc.), suivez ce guide.

---

## 📁 Structure du Projet

Voici tous les dossiers et fichiers à récupérer:

```
padel-connect/
├── app/                          # Routes de l'application
│   ├── (tabs)/                   # Navigation par onglets
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── leagues.tsx
│   │   ├── league-details.tsx
│   │   ├── players.tsx
│   │   ├── search.tsx
│   │   ├── settings.tsx
│   │   └── notifications.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
├── components/                   # Composants réutilisables
│   ├── AuthScreen.tsx
│   ├── DivisionBadge.tsx
│   ├── ScoreValidation.tsx
│   └── TeamScoreModal.tsx
├── hooks/                        # Hooks personnalisés
│   ├── useAuth.ts
│   └── useFrameworkReady.ts
├── lib/                          # Bibliothèques et utilitaires
│   ├── supabase.ts
│   ├── supabase-rn.ts
│   ├── ranking.ts
│   ├── notifications.ts
│   └── antiCheat.ts
├── scripts/                      # Scripts utilitaires
│   ├── seed-data.ts
│   ├── test-connection.ts
│   └── create-test-user.ts
├── supabase/migrations/          # Migrations de la base de données
│   └── *.sql
├── assets/                       # Images et ressources
│   └── images/
├── .env                          # Variables d'environnement
├── .env.example
├── package.json
├── tsconfig.json
├── metro.config.cjs
├── app.json
└── expo-env.d.ts
```

---

## 🔐 Configuration Supabase

### Variables d'Environnement

Créez un fichier `.env` avec ces variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://weutezvyuaavokgcpjao.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldXRlenZ5dWFhdm9rZ2NwamFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMTk5NDAsImV4cCI6MjA3OTg5NTk0MH0.Gk03WM1tIMoj-34Go3aoFbVftWL1bXzBsrCaBga2oFE

# Optional: For development
EXPO_PUBLIC_API_URL=http://localhost:54321
```

### ⚠️ IMPORTANT: Ces clés sont déjà configurées et fonctionnelles!

---

## 📊 Base de Données

### Tables Existantes

La base de données Supabase contient:

- **joueurs** (8 joueurs)
- **ligues** (3 ligues)
- **ligues_joueurs** (classements)
- **matchs** (historique des matchs)
- **divisions** (15 divisions)
- **clubs** (8 clubs)
- **defis** (système de défis)
- **equipes_2v2** (équipes de doubles)
- **notifications**

### Migrations

Toutes les migrations sont dans `supabase/migrations/`. Elles sont déjà appliquées sur la base de données active.

---

## 🚀 Installation sur Nouvelle Plateforme

### 1. Télécharger le Projet

Sur Bolt.new:
1. Cliquez sur le bouton de téléchargement/export
2. Téléchargez le ZIP complet du projet

Ou clonez via Git si disponible.

### 2. Installation des Dépendances

```bash
cd padel-connect
npm install
```

### 3. Configuration

Copiez le fichier `.env`:
```bash
cp .env.example .env
```

Puis ajoutez les variables Supabase (voir section Configuration ci-dessus).

### 4. Lancer le Projet

#### Mode Développement
```bash
npm run dev
```

#### Build Web
```bash
npm run build:web
```

#### Tester la Connexion Supabase
```bash
npm run check:supabase
```

---

## 📱 Plateformes Recommandées

### VS Code
1. Ouvrir le dossier du projet
2. Installer l'extension "Expo Tools"
3. `npm install` puis `npm run dev`

### Cursor
1. Ouvrir le dossier du projet
2. `npm install` puis `npm run dev`
3. Utiliser Cursor AI pour continuer le développement

### Android Studio / Xcode
Pour builds natifs:
```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

---

## 🔑 Compte de Test

Un compte de test est disponible:

```
Email:        test@padel.com
Mot de passe: Test123456!
```

---

## 📚 Documentation des Fichiers Clés

### `lib/supabase.ts`
Client Supabase pour l'application. Configure la connexion à la base de données.

### `hooks/useAuth.ts`
Hook d'authentification. Gère la connexion/déconnexion des utilisateurs.

### `app/(tabs)/_layout.tsx`
Configuration de la navigation par onglets avec icônes.

### `components/AuthScreen.tsx`
Écran de connexion/inscription complet avec validation.

---

## 🗃️ Données de Test

Pour régénérer les données de test:
```bash
npx tsx scripts/seed-data.ts
```

Pour créer un nouvel utilisateur:
```bash
npx tsx scripts/create-test-user.ts
```

---

## 🔧 Scripts Disponibles

```json
{
  "dev": "expo start",
  "build:web": "expo export --platform web",
  "lint": "expo lint",
  "test:supabase": "tsx scripts/test-supabase.ts",
  "check:supabase": "tsx scripts/check-supabase-connection.ts"
}
```

---

## 📦 Dépendances Principales

```json
{
  "@supabase/supabase-js": "^2.53.0",
  "expo": "^53.0.0",
  "expo-router": "~5.0.2",
  "react": "19.0.0",
  "react-native": "0.79.1"
}
```

---

## ⚡ Checklist Export

- [ ] Télécharger tous les fichiers
- [ ] Copier le fichier `.env` avec les clés Supabase
- [ ] Installer les dépendances (`npm install`)
- [ ] Tester la connexion Supabase
- [ ] Vérifier que l'app démarre (`npm run dev`)
- [ ] Tester la connexion avec `test@padel.com`

---

## 🆘 Aide et Support

### Si vous avez des erreurs:

**Erreur de connexion Supabase:**
```bash
npm run check:supabase
```

**Erreur de dépendances:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Erreur Expo:**
```bash
npx expo doctor
```

---

## 🎯 Prochaines Étapes Recommandées

1. **Exporter le projet** depuis Bolt.new
2. **Ouvrir dans votre IDE** préféré (VS Code/Cursor)
3. **Installer les dépendances** avec `npm install`
4. **Tester la connexion** avec `npm run check:supabase`
5. **Lancer le projet** avec `npm run dev`
6. **Continuer le développement** avec toutes les fonctionnalités

---

## ✅ État Actuel du Projet

- ✅ Base de données Supabase opérationnelle
- ✅ 8 joueurs de test
- ✅ 3 ligues actives
- ✅ Système d'authentification fonctionnel
- ✅ Navigation complète (5 onglets)
- ✅ Classements et statistiques
- ✅ RLS (Row Level Security) configuré
- ✅ Compte de test prêt

**Le projet est 100% fonctionnel et prêt à être exporté!**

---

*Guide créé le: 28/11/2025*
*Version: 1.0*
