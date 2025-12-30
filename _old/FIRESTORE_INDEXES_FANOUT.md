# Index Firestore requis pour l'architecture Fan-out

## ⚠️ IMPORTANT : Index à créer AVANT d'utiliser l'application

L'architecture fan-out nécessite plusieurs index Firestore pour fonctionner correctement.

---

## 📋 Index à créer manuellement

### 1. Collection Group "posts" (pour deletePost)

**Collection ID:** `posts` (Collection Group)
**Champs indexés:**
- `postId` (Ascending)

**Utilisation:** Permet de trouver tous les pointeurs d'un post dans tous les feeds lors de la suppression

**Comment créer:**
1. Firebase Console → Firestore Database → Indexes
2. Cliquer "Create Index"
3. Sélectionner "Collection group"
4. Collection ID: `posts`
5. Ajouter le champ: `postId` (Ascending)
6. Query scope: Collection group

---

### 2. user_feeds/{userId}/posts - Tri par date

**Collection:** `user_feeds/{userId}/posts`
**Champs indexés:**
- `createdAt` (Descending)

**Utilisation:** Charger le feed d'un utilisateur trié par date (du plus récent au plus ancien)

**Comment créer:**
1. Firebase Console → Firestore Database → Indexes
2. Cliquer "Create Index"
3. Sélectionner "Collection"
4. Collection ID: `posts` (sous-collection)
5. Collection path: `user_feeds/{userId}/posts`
6. Ajouter le champ: `createdAt` (Descending)

**Note:** Cet index est probablement créé automatiquement lors de la première requête. Firebase vous donnera un lien direct dans l'erreur.

---

### 3. user_feeds/{userId}/posts - Cleanup par userId

**Collection:** `user_feeds/{userId}/posts`
**Champs indexés:**
- `userId` (Ascending)

**Utilisation:** Nettoyer tous les posts d'un utilisateur spécifique lors d'un unfollow

**Comment créer:**
1. Firebase Console → Firestore Database → Indexes
2. Cliquer "Create Index"
3. Collection ID: `posts` (sous-collection)
4. Collection path: `user_feeds/{userId}/posts`
5. Ajouter le champ: `userId` (Ascending)

---

## 🚀 Création automatique via l'application

La méthode la plus simple :

1. **Lancez l'application** et utilisez toutes les fonctionnalités
2. **Observez la console** du navigateur
3. Firebase vous donnera des **erreurs avec liens directs** pour créer les index manquants
4. **Cliquez sur les liens** pour créer automatiquement les index

Exemple d'erreur :
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

---

## 📊 Index existants (déjà créés)

Ces index devraient déjà exister depuis les phases précédentes :

### Posts
- `userId` (Asc) + `createdAt` (Desc)

### Likes
- `postId` (Asc) + `userId` (Asc)
- `postId` (Asc) + `createdAt` (Desc)

### Comments
- `postId` (Asc) + `createdAt` (Asc)

### Follows
- `followingId` (Asc) + `status` (Asc) + `createdAt` (Desc)
- `followerId` (Asc) + `status` (Asc) + `createdAt` (Desc)

---

## 🧪 Tester les index

Après avoir créé les index :

1. **Créer un post** → Vérifier qu'il apparaît dans votre feed
2. **Follow quelqu'un** → Vérifier que ses posts apparaissent
3. **Unfollow** → Vérifier que ses posts disparaissent
4. **Supprimer un post** → Vérifier qu'il disparaît de tous les feeds

---

## ⏱️ Temps de création

- Les index prennent généralement **2-5 minutes** à se construire
- Pendant ce temps, les requêtes peuvent échouer
- Rafraîchir la page une fois les index créés

---

## 💡 Conseil

Si vous voyez une erreur "index required", **c'est normal !** C'est la façon dont Firebase vous guide pour créer les bons index. Cliquez simplement sur le lien fourni dans l'erreur.
