# Configuration Firestore pour Groovr

## Déployer les règles de sécurité

Les règles de sécurité Firestore sont définies dans `firestore.rules`. Pour les déployer:

### Option 1: Via Firebase Console (Recommandé pour le développement)

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet Groovr
3. Dans le menu latéral, allez à **Firestore Database** > **Règles**
4. Copiez-collez le contenu du fichier `firestore.rules`
5. Cliquez sur **Publier**

### Option 2: Via Firebase CLI

```bash
# Installer Firebase CLI si ce n'est pas déjà fait
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser Firebase dans le projet (si pas déjà fait)
firebase init firestore

# Déployer les règles
firebase deploy --only firestore:rules
```

## Structure des collections

Les règles autorisent les collections suivantes:

### `/users/{userId}`
- **Lecture**: Publique (tout le monde peut lire les profils)
- **Écriture**: Seulement le propriétaire du profil

### `/albums/{albumId}`
- **Lecture**: Publique
- **Écriture**: Tout utilisateur authentifié (pour le cache Spotify automatique)

### `/collections/{userId}/albums/{albumId}`
- **Lecture**: Propriétaire ou si profil public
- **Écriture**: Seulement le propriétaire

### `/wishlists/{userId}/albums/{albumId}`
- **Lecture**: Propriétaire ou si profil public
- **Écriture**: Seulement le propriétaire

### `/posts/{postId}` (Phase 7)
- **Lecture**: Utilisateurs authentifiés
- **Création**: Utilisateurs authentifiés (avec userId matching)
- **Modification/Suppression**: Seulement l'auteur

### `/likes/{likeId}` (Phase 7)
- **Lecture**: Utilisateurs authentifiés
- **Création**: Utilisateurs authentifiés
- **Suppression**: Seulement le créateur

### `/comments/{commentId}` (Phase 7)
- **Lecture**: Utilisateurs authentifiés
- **Création**: Utilisateurs authentifiés
- **Modification/Suppression**: Seulement l'auteur

### `/follows/{followId}` (Phase 7)
- **Lecture**: Utilisateurs authentifiés
- **Création/Suppression**: Seulement le follower

## Vérifier que les règles fonctionnent

Après déploiement, testez:

1. **Test de lecture publique des albums**:
   - Déconnectez-vous et essayez d'accéder à un profil public
   - Devrait fonctionner

2. **Test de cache Spotify**:
   - Connectez-vous
   - Faites une recherche d'album sur `/search`
   - Vérifiez dans la console serveur les logs `[Cache]`
   - Les albums doivent avoir un `firestoreId` dans la réponse

3. **Test d'écriture protégée**:
   - Essayez de modifier le profil d'un autre utilisateur
   - Devrait échouer avec une erreur de permission

## En cas d'erreur "Permission denied"

Si vous voyez des erreurs de permission dans la console:

1. Vérifiez que les règles sont bien déployées
2. Vérifiez que l'utilisateur est bien authentifié (token valide)
3. Regardez les logs détaillés dans Firebase Console > Firestore Database > Règles > Tester
4. Assurez-vous que la collection existe dans Firestore (peut nécessiter une première écriture manuelle)

## Mode test (ATTENTION: À UTILISER SEULEMENT EN DÉVELOPPEMENT)

Si vous voulez tester sans authentification (⚠️ DANGEREUX):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ NE JAMAIS UTILISER EN PRODUCTION
    }
  }
}
```

**NE JAMAIS déployer ces règles en production!**
