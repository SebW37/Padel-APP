# 🔐 Identifiants de Connexion

## ✅ Compte Test Créé

Un compte utilisateur de test a été créé avec succès dans Supabase.

---

## 📧 Identifiants

```
Email:        test@padel.com
Mot de passe: Test123456!
```

---

## ✅ Configuration

### Auth Supabase
- ✅ Compte créé dans `auth.users`
- ✅ Email confirmé automatiquement
- ✅ Dernière connexion: 28/11/2025 09:56 UTC
- ✅ User ID: `cb668d89-d7a1-42b4-a2d3-7846a2196f8a`

### Profil Joueur
- ✅ Profil créé dans table `joueurs`
- ✅ Nom: Test User
- ✅ Points: 1200
- ✅ Division: Padelino Starter
- ✅ Victoires: 0
- ✅ Défaites: 0
- ✅ Matchs joués: 0

---

## 🚀 Utilisation

### Dans l'app
1. Ouvrir l'application
2. Aller à l'écran de connexion
3. Entrer:
   - **Email**: `test@padel.com`
   - **Mot de passe**: `Test123456!`
4. Cliquer sur "Se connecter"

### Test de connexion via script
```bash
npx tsx scripts/create-test-user.ts
```

---

## 🔍 Vérification

Pour vérifier que le compte existe:

```sql
SELECT 
  u.email,
  j.nom_complet,
  j.points_classement,
  d.nom->>'fr' as division
FROM auth.users u
JOIN joueurs j ON j.id = u.id
JOIN divisions d ON d.id = j.division_id
WHERE u.email = 'test@padel.com';
```

**Résultat**: ✅ Compte trouvé et actif

---

## 📝 Notes

- L'email est **déjà confirmé** (pas besoin de vérification)
- Le compte peut se connecter **immédiatement**
- Le profil joueur est **complet** et fonctionnel
- L'utilisateur peut accéder à toutes les fonctionnalités de l'app

---

## ⚠️ Important

Ces identifiants sont pour **TEST UNIQUEMENT**. 
Pour la production, chaque utilisateur devra créer son propre compte.

---

**Status: PRÊT À UTILISER ✅**

*Créé le: 28/11/2025 à 09:56 UTC*
