# Guide: Rafraîchir les données utilisateur

## Problème

Les données de "Test User" affichées dans l'app ne correspondent pas aux vraies données dans la base de données. Cela arrive quand le navigateur conserve d'anciennes données en cache.

## Solution rapide

Une **section Debug** a été ajoutée dans **Paramètres** avec des outils pour résoudre ce problème.

## Comment utiliser

### Méthode 1: Rafraîchissement simple (recommandé)

1. Ouvrez l'app
2. Allez dans **Paramètres** (⚙️ onglet en bas)
3. Scrollez jusqu'à la section **"Debug"**
4. Cliquez sur **"Rafraîchir les données"**
5. Attendez le message de confirmation
6. Vérifiez l'encadré bleu en dessous pour voir vos vraies stats
7. Retournez à l'écran d'accueil

### Méthode 2: Vider le cache (solution complète)

Si la méthode 1 ne fonctionne pas:

1. Allez dans **Paramètres** → **Debug**
2. Cliquez sur **"Vider le cache"**
3. Confirmez l'action (vous serez déconnecté)
4. Reconnectez-vous avec vos identifiants
5. Vos vraies données s'afficheront

## Vérification

Dans la section Debug, un encadré bleu affiche:
- Votre nom
- Vos victoires actuelles
- Vos points actuels
- Votre division actuelle
- La date de dernière mise à jour

**Si ces valeurs sont correctes dans l'encadré, le problème est résolu!**

## Fonctionnalités ajoutées

### 1. Bouton "Rafraîchir les données" 🔄
- Icône: refresh (bleue)
- Recharge vos stats depuis la base de données
- Pas de déconnexion nécessaire
- Affiche "Rafraîchissement..." pendant l'opération

### 2. Bouton "Vider le cache" 🗑️
- Icône: trash (rouge)
- Déconnecte l'utilisateur
- Efface toutes les données locales
- Solution garantie pour les problèmes de cache

### 3. Encadré d'informations 📊
- Fond gris avec bordure bleue
- Affiche vos données en temps réel
- Permet de vérifier que tout est correct
- Police monospace pour les valeurs

## Capture d'écran de la section Debug

```
┌─────────────────────────────────────┐
│  Debug                              │
├─────────────────────────────────────┤
│  [🔄] Rafraîchir les données    >  │
│      Recharge les stats depuis...  │
├─────────────────────────────────────┤
│  [🗑️] Vider le cache            >  │
│      Déconnexion + effacement...   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Infos actuelles:                │ │
│ │ Nom: Test User                  │ │
│ │ Victoires: 13                   │ │
│ │ Points: 389                     │ │
│ │ Division: 3                     │ │
│ │ Dernière MAJ: 03/10/2025 10:59 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Quand utiliser chaque méthode

### Rafraîchir les données (Option 1)
Utilisez quand:
- Vos victoires ne sont pas à jour après un match
- Vos points ont changé mais l'app ne les affiche pas
- Vous voulez une mise à jour rapide sans vous déconnecter

### Vider le cache (Option 2)
Utilisez quand:
- L'option 1 ne fonctionne pas
- Vous voyez des données complètement fausses
- Vous avez changé de compte
- L'app affiche des erreurs de connexion

## Messages d'alerte

### Succès - Rafraîchissement
```
Succès
Données rafraîchies avec succès!
[OK]
```

### Succès - Cache vidé
```
Succès
Cache vidé. Reconnectez-vous pour voir vos données à jour.
[OK]
```

### Confirmation - Vider le cache
```
Vider le cache
Cela va vous déconnecter et effacer toutes les données locales. Continuer?
[Annuler]  [Confirmer]
```

## Technique

### Fichier modifié
- `app/(tabs)/settings.tsx`

### Imports ajoutés
```typescript
import { Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-rn';
```

### Hooks utilisés
```typescript
const { joueur, refreshJoueur, signOut } = useAuth();
const [refreshing, setRefreshing] = useState(false);
```

### Fonction de rafraîchissement
```typescript
const handleForceRefresh = async () => {
  setRefreshing(true);
  try {
    await refreshJoueur();
    Alert.alert('Succès', 'Données rafraîchies!');
  } finally {
    setRefreshing(false);
  }
};
```

### Fonction de nettoyage
```typescript
const handleClearCache = async () => {
  Alert.alert('Vider le cache', 'Continuer?', [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Confirmer',
      style: 'destructive',
      onPress: async () => {
        await signOut();
        localStorage?.clear();
        sessionStorage?.clear();
      }
    }
  ]);
};
```

## Styles ajoutés

```typescript
settingItemDisabled: {
  opacity: 0.5,
},
debugInfo: {
  backgroundColor: '#f3f4f6',
  padding: 16,
  borderRadius: 12,
  borderLeftWidth: 3,
  borderLeftColor: '#3b82f6',
},
debugTitle: {
  fontSize: 13,
  fontWeight: '700',
  color: '#374151',
},
debugText: {
  fontSize: 13,
  color: '#4b5563',
},
```

## Prochaines étapes

Si le problème persiste après avoir utilisé ces deux options:

1. Vérifiez la console du navigateur pour les erreurs
2. Assurez-vous que Supabase est bien configuré
3. Essayez un hard refresh: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
4. Ouvrez l'app en mode navigation privée

## Support

Pour toute question ou problème persistant, vérifiez:
- Les logs de la console (F12)
- L'encadré Debug dans Paramètres
- Le fichier `FIX_USER_STATS.md` pour plus de détails techniques
