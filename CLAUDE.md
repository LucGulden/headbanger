# FillCrate - Réseau social pour passionnés de vinyles

## Vue d'ensemble du projet

FillCrate est un réseau social pour passionnés de vinyles permettant de :
- Gérer sa collection de vinyles
- Créer une wishlist
- Suivre d'autres utilisateurs
- Voir un feed social avec les acquisitions des personnes suivies
- Liker et commenter les posts
- Consulter les profils avec abonnés/abonnements
- Recevoir et consulter des notifications
- **Rechercher des albums et des utilisateurs** ✅

**Migration complétée** : De Firebase/Next.js vers Supabase/React+Vite

## Stack technique

- React 18 + TypeScript + Vite 7
- React Router v6 pour le routing
- Supabase (Auth + Database PostgreSQL + Realtime)
- Tailwind CSS v3 avec variables CSS custom
- Framer Motion pour les animations
- Fonts : Inter

## Structure du projet
```
fillcrate-web/
├── src/
│   ├── components/
│   │   ├── Avatar.tsx              ✅ Adapté - Avatar avec initiales colorées
│   │   ├── Button.tsx              ✅ Copié - Composant bouton avec size (sm/md/lg)
│   │   ├── CommentItem.tsx         ✅ Créé - Affichage des commentaires
│   │   ├── Feed.tsx                ✅ Créé - Composant feed avec infinite scroll
│   │   ├── Footer.tsx              ✅ Créé - Footer du site
│   │   ├── Input.tsx               ✅ Copié - Input avec label optionnel
│   │   ├── Layout.tsx              ✅ Créé - Wrapper avec Header/Footer
│   │   ├── Navigation.tsx          ✅ Adapté - Menu avec badge notifications temps réel
│   │   ├── NotificationItem.tsx    ✅ Créé - Affichage d'une notification
│   │   ├── PostCard.tsx            ✅ Créé - Carte de post avec likes/commentaires
│   │   ├── VinylImage.tsx          ✅ Créé - Image avec placeholder SVG (opacity fix)
│   │   ├── VinylCard.tsx           ✅ Créé - Carte d'affichage d'un vinyle
│   │   ├── AlbumCard.tsx           ✅ Créé - Carte d'affichage d'un album (réutilisable)
│   │   ├── VinylGrid.tsx           ✅ Créé - Grille avec infinite scroll réutilisable
│   │   ├── AddVinylModal.tsx       ✅ Créé - Modal en 3 étapes + support initialAlbum
│   │   ├── AlbumSearch.tsx         ✅ Créé - Recherche d'albums (utilise AlbumCard)
│   │   ├── VinylSelection.tsx      ✅ Créé - Sélection pressages (étape 2)
│   │   ├── VinylDetails.tsx        ✅ Créé - Détails pressage (étape 3)
│   │   ├── ProfileHeader.tsx       ✅ Créé - Header de profil avec stats et Follow
│   │   ├── ProfileReleases.tsx     ✅ Créé - Grille de vinyles (wrapper VinylGrid)
│   │   ├── UserListItem.tsx        ✅ Créé - Carte utilisateur avec bouton Follow
│   │   ├── SearchAlbumsTab.tsx     ✅ Créé - Onglet recherche albums
│   │   └── SearchUsersTab.tsx      ✅ Créé - Onglet recherche utilisateurs
│   │
│   ├── pages/
│   │   ├── Home.tsx                ✅ Adapté - Landing page
│   │   ├── Signup.tsx              ✅ Adapté - Inscription
│   │   ├── Login.tsx               ✅ Adapté - Connexion
│   │   ├── Feed.tsx                ✅ Créé - Page feed
│   │   ├── Profile.tsx             ✅ Créé - Page profil complète (3 onglets)
│   │   ├── Collection.tsx          ✅ Créé - Page collection complète
│   │   ├── Wishlist.tsx            ✅ Créé - Page wishlist complète
│   │   ├── Followers.tsx           ✅ Créé - Liste des abonnés
│   │   ├── Following.tsx           ✅ Créé - Liste des abonnements
│   │   ├── Notifications.tsx       ✅ Créé - Page notifications avec auto-mark-as-read
│   │   ├── Search.tsx              ✅ Créé - Page recherche avec tabs Albums/Users
│   │   └── NotFound.tsx            ✅ Créé
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              ✅ Créé - Hook d'authentification Supabase
│   │   ├── useFeedPagination.ts    ✅ Créé - Hook pagination feed avec realtime
│   │   ├── useVinylsPagination.ts  ✅ Créé - Hook pagination vinyles avec infinite scroll
│   │   └── useNotifications.ts     ✅ Créé - Hook notifications avec pagination
│   │
│   ├── lib/
│   │   ├── user.ts                 ✅ Créé - Validation username + disponibilité
│   │   ├── posts.ts                ✅ Créé - CRUD posts, likes, getFeedPosts
│   │   ├── comments.ts             ✅ Créé - CRUD commentaires + realtime
│   │   ├── follows.ts              ✅ Créé - Système de follow + getFollowers/getFollowing
│   │   ├── vinyls.ts               ✅ Créé - Gestion complète des vinyles
│   │   ├── notifications.ts        ✅ Créé - CRUD notifications + realtime
│   │   ├── search.ts               ✅ Créé - Recherche d'utilisateurs
│   │   └── date-utils.ts           ✅ Créé - Formatage dates relatives
│   │
│   ├── types/
│   │   ├── post.ts                 ✅ Créé - Types posts, PostWithDetails
│   │   ├── comment.ts              ✅ Créé - Types commentaires
│   │   ├── vinyl.ts                ✅ Créé - Types vinyles, albums, user_vinyls
│   │   ├── notification.ts         ✅ Créé - Types notifications
│   │   └── user.ts                 ✅ Créé - Type User (réutilisé pour recherche)
│   │
│   ├── database/
│   │   ├── README.md               ✅ Documentation SQL
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql              ✅ Tables principales
│   │   │   ├── 002_add_username.sql                ✅ Ajout username
│   │   │   ├── 003_add_posts_system.sql            ✅ Posts, likes, commentaires
│   │   │   ├── 003_fix_user_insert_policy.sql      ✅ Fix policy INSERT users
│   │   │   ├── 006_rename_user_releases.sql        ✅ Renommage user_releases → user_vinyls
│   │   │   ├── 007_test_data.sql                   ✅ Données de test (8 albums iconiques)
│   │   │   ├── 008_remove_is_private.sql           ✅ Suppression profils privés
│   │   │   ├── 009_create_notifications.sql        ✅ Table notifications + RLS
│   │   │   └── 010_notifications_triggers.sql      ✅ Triggers automatiques notifications
│   │   ├── policies.sql            ✅ Sécurité RLS
│   │   └── seed.sql                ✅ Données de test
│   │
│   ├── App.tsx                     ✅ Configuré - Routes React Router (ordre correct)
│   ├── main.tsx                    ✅ Point d'entrée
│   ├── index.css                   ✅ Styles Tailwind + variables CSS
│   └── supabaseClient.ts           ✅ Connexion Supabase
│
├── .env                            ✅ Variables d'environnement (à remplir)
├── .env.example                    ✅ Template pour .env
├── index.html                      ✅ Mis à jour avec fonts
├── tailwind.config.js              ✅ Configuration Tailwind
├── postcss.config.js               ✅ Configuration PostCSS
├── vite.config.ts                  ✅ Configuration Vite
├── package.json                    ✅ Dépendances installées
└── CLAUDE.md                       ✅ Ce fichier
```

## 🗄️ Base de données Supabase

### Tables créées

**users**
- uid (UUID, PK, référence auth.users)
- email, username (unique), first_name, last_name
- photo_url, bio
- created_at, updated_at

**albums**
- id (UUID, PK)
- spotify_id (unique), spotify_url
- title, artist, cover_url, year
- created_at

**vinyls**
- id (UUID, PK)
- album_id (FK albums)
- title, artist, cover_url
- label, catalog_number
- country, format, year, release_year
- created_at

**user_vinyls** (renommé depuis user_releases)
- id (UUID, PK)
- user_id (FK users), release_id (FK vinyls)
- type ('collection' | 'wishlist')
- added_at
- UNIQUE(user_id, release_id, type)

**follows**
- id (UUID, PK)
- follower_id (FK users), following_id (FK users)
- status ('active') - Tous les follows sont actifs (pas de validation)
- created_at

**posts**
- id (UUID, PK)
- user_id (FK users), vinyl_id (FK vinyls)
- type ('collection_add' | 'wishlist_add')
- content (texte optionnel)
- created_at

**post_likes**
- id (UUID, PK)
- user_id (FK users), post_id (FK posts)
- created_at
- UNIQUE(user_id, post_id)

**comments**
- id (UUID, PK)
- user_id (FK users), post_id (FK posts)
- content (texte)
- created_at

**notifications**
- id (UUID, PK)
- user_id (FK users) - Destinataire de la notification
- type (ENUM: 'new_follower', 'post_like', 'post_comment')
- actor_id (FK users) - Qui a effectué l'action
- post_id (FK posts, nullable)
- comment_id (FK comments, nullable)
- read (BOOLEAN, default false)
- created_at (TIMESTAMPTZ)
- UNIQUE(user_id, type, actor_id, post_id, comment_id) - Évite les doublons

### Architecture de données - Système de vinyles

**Album** (table `albums`) = L'œuvre musicale abstraite
- Contient infos Spotify : title, artist, cover_url, year, spotify_id
- Un album peut avoir plusieurs pressages vinyles

**Vinyl** (table `vinyls`) = Un pressage physique spécifique
- Lié à un album via `album_id` (FK)
- Contient détails physiques : year, country, label, catalog_number, format
- Exemple : "Dark Side of the Moon" peut avoir un pressage UK 1973, US 1973, réédition 2016, etc.

**UserVinyl** (table `user_vinyls`) = Relation user ↔ vinyle
- `type` : 'collection' ou 'wishlist'
- Un user peut avoir le même vinyle dans sa collection ET sa wishlist (contrainte UNIQUE)
- Trigger automatique de création de post lors de l'ajout en collection

### Architecture de données - Système de notifications

**Notification** (table `notifications`) = Notification pour un utilisateur
- `type` : 'new_follower', 'post_like', 'post_comment'
- `actor_id` : Qui a effectué l'action
- `post_id` / `comment_id` : Références selon le type
- `read` : État de lecture
- **Triggers automatiques** :
  - Follow → Crée notification `new_follower`
  - Like → Crée notification `post_like`
  - Comment → Crée notification `post_comment`
- **Cleanup automatique** : Supprime notifications > 30 jours

### Données de test disponibles

8 albums iconiques avec plusieurs pressages chacun :
- Frank Ocean - Blonde (2 pressages)
- Pink Floyd - The Dark Side of the Moon (3 pressages)
- Daft Punk - Random Access Memories (2 pressages)
- Kendrick Lamar - good kid, m.A.A.d city (2 pressages)
- Miles Davis - Kind of Blue (2 pressages)
- The Beatles - Abbey Road (2 pressages)
- Nirvana - Nevermind (2 pressages)
- Amy Winehouse - Back to Black (2 pressages)

### Sécurité et fonctionnalités

- ✅ RLS activé sur toutes les tables
- ✅ Policies configurées (tous les profils sont publics)
- ✅ Policy INSERT sur users (fix erreur inscription)
- ✅ **Triggers notifications** :
  - `notify_new_follower` - Crée notification lors d'un follow
  - `notify_post_like` - Crée notification lors d'un like
  - `notify_post_comment` - Crée notification lors d'un commentaire
  - `delete_follower_notification` - Supprime notification lors d'un unfollow
  - `delete_like_notification` - Supprime notification lors d'un unlike
  - `delete_comment_notification` - Supprime notification lors de suppression commentaire
- ✅ Trigger `on_auth_user_created` : crée automatiquement le profil user
- ✅ Trigger `on_vinyl_added_create_post` : crée automatiquement un post quand un vinyle est ajouté à la collection
- ✅ Vue `posts_with_stats` : facilite les requêtes avec likes/comments count
- ✅ Realtime activé sur `notifications` avec :
```sql
  ALTER TABLE notifications REPLICA IDENTITY FULL;
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```
- ✅ Index optimisés pour les performances

## 🎯 Routes configurées
```
/ → Home (Landing page)
/signup → Inscription
/login → Connexion
/feed → Feed social
/collection → Collection perso
/wishlist → Wishlist perso
/profile/:username → Profil utilisateur
/profile/:username/followers → Liste des abonnés
/profile/:username/following → Liste des abonnements
/notifications → Page notifications
/search → Recherche albums et utilisateurs ✅ NOUVEAU
/* → 404 Not Found
```

**Note importante** : Ordre des routes dans App.tsx
```typescript
// Routes spécifiques AVANT la route générique
<Route path="/profile/:username/followers" element={<FollowersPage />} />
<Route path="/profile/:username/following" element={<FollowingPage />} />
<Route path="/profile/:username" element={<Profile />} />
```

Toutes les routes utilisent le Layout (Header + Footer).

## 🔧 Hooks personnalisés

### useAuth (`src/hooks/useAuth.ts`)
```typescript
{
  user: User | null
  loading: boolean
  error: AuthError | null
  signUp: ({ email, username, password }) => Promise
  signInWithPassword: (email, password) => Promise
  signInWithGoogle: () => Promise
  signOut: () => Promise
}
```

### useFeedPagination (`src/hooks/useFeedPagination.ts`)
```typescript
{
  posts: PostWithDetails[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: Error | null
  refreshing: boolean
  newPostsAvailable: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  handleDeletePost: (postId: string) => void
}
```

**Fonctionnalités :**
- Pagination cursor-based avec Supabase
- Infinite scroll
- Pull-to-refresh
- Écoute temps réel des nouveaux posts (badge de notification)

### useVinylsPagination (`src/hooks/useVinylsPagination.ts`)
```typescript
{
  vinyls: UserVinylWithDetails[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: Error | null
  total: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  removeVinylFromList: (vinylId: string) => void
}
```

**Fonctionnalités :**
- Pagination cursor-based pour collection/wishlist
- Infinite scroll avec Intersection Observer
- Comptage total
- Optimistic UI pour suppression

### useNotifications (`src/hooks/useNotifications.ts`)
```typescript
{
  notifications: NotificationWithDetails[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: Error | null
  unreadCount: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  handleMarkAsRead: (notificationId: string) => void
  handleMarkAllAsRead: () => Promise<void>
  handleDelete: (notificationId: string) => void
}
```

**Fonctionnalités :**
- Pagination cursor-based (LIMIT 20)
- Infinite scroll
- Compteur de notifications non lues
- Optimistic UI pour marquer comme lu/supprimer
- Écoute temps réel des nouvelles notifications

## 📚 Bibliothèques utilitaires

### posts.ts (`src/lib/posts.ts`)

- `likePost(userId, postId)` - Ajouter un like
- `unlikePost(userId, postId)` - Retirer un like
- `hasLikedPost(userId, postId)` - Vérifier si liké
- `deletePost(postId)` - Supprimer un post
- `getFeedPosts(userId, profileFeed, limit, lastPost?)` - Récupérer posts avec pagination

### comments.ts (`src/lib/comments.ts`)

- `addComment(postId, userId, content)` - Ajouter un commentaire
- `deleteComment(commentId)` - Supprimer un commentaire
- `subscribeToPostComments(postId, onData, onError)` - Écoute temps réel des commentaires

### follows.ts (`src/lib/follows.ts`)

- `getFollowStats(userId)` - Récupérer followers/following count
- `followUser(followerId, followingId)` - Suivre quelqu'un (toujours status='active')
- `unfollowUser(followerId, followingId)` - Ne plus suivre
- `isFollowing(followerId, followingId)` - Vérifier si on suit
- `getFollowers(userId)` - Récupérer la liste des abonnés
- `getFollowing(userId)` - Récupérer la liste des abonnements

### notifications.ts (`src/lib/notifications.ts`)

- `getNotifications(userId, limit, lastCreatedAt?)` - Récupérer notifications avec pagination
- `getUnreadCount(userId)` - Compter les notifications non lues
- `markAsRead(notificationId)` - Marquer une notification comme lue
- `markAllAsRead(userId)` - Marquer toutes comme lues
- `deleteNotification(notificationId)` - Supprimer une notification
- `subscribeToNotifications(userId, onNotification, onError)` - Écoute temps réel

### vinyls.ts (`src/lib/vinyls.ts`)

**Gestion de collection/wishlist :**
- `getUserVinyls(userId, type, limit, lastAddedAt?)` - Récupérer vinyles avec pagination
- `getUserVinylsCount(userId, type)` - Compter les vinyles
- `hasVinyl(userId, vinylId, type)` - Vérifier si un vinyle est possédé
- `addVinylToUser(userId, vinylId, type)` - Ajouter à collection/wishlist
- `removeVinylFromUser(userId, vinylId, type)` - Retirer de collection/wishlist
- `moveToCollection(userId, vinylId)` - Déplacer wishlist → collection
- `getVinylStats(userId)` - Stats collection/wishlist

**Recherche et exploration :**
- `searchAlbums(query, limit)` - Rechercher des albums (titre/artiste)
- `getVinylsByAlbum(albumId)` - Récupérer tous les pressages d'un album

### search.ts (`src/lib/search.ts`) ✅ NOUVEAU

- `searchUsers(query, limit)` - Rechercher des utilisateurs par username, first_name, last_name

### user.ts (`src/lib/user.ts`)

- `validateUsername(username)` - Validation regex
- `isUsernameAvailable(username)` - Vérifier disponibilité en BDD

### date-utils.ts (`src/lib/date-utils.ts`)

- `getRelativeTimeString(date)` - "il y a 2h", "il y a 3j"
- `formatDate(date)` - "31 décembre 2024"
- `formatDateTime(date)` - "31 décembre 2024 à 14:30"
- `isToday(date)` - Vérifier si aujourd'hui
- `isYesterday(date)` - Vérifier si hier

## 🔔 Système de notifications

### Flux utilisateur

1. **Action déclencheur** : Follow, like, comment
2. **Trigger SQL automatique** : Crée une notification en BDD
3. **Realtime Supabase** : Envoie la notification en temps réel
4. **Badge Navigation** : S'incrémente instantanément (+1)
5. **Page notifications** : Affiche toutes les notifications
6. **Auto-mark-as-read** : Toutes marquées comme lues dès l'ouverture de la page

### Composants

**NotificationItem**
- Avatar de l'acteur
- Message dynamique selon le type :
  - `new_follower` : "X a commencé à vous suivre"
  - `post_like` : "X a aimé votre post"
  - `post_comment` : "X a commenté votre post" + extrait
- Aperçu vinyle (12x12) pour post_like/post_comment
- Date relative
- Badge "non lu" (point orange)
- Animations Framer Motion

**Page Notifications**
- Header : "Notifications" + compteur non lues
- Liste avec infinite scroll
- Empty state : 🔔 "Aucune notification"
- Auto-mark-as-read au chargement
- Event `notifications-read` pour synchroniser le badge

**Navigation Badge**
- Icône cloche avec badge rouge
- Count en temps réel (écoute Realtime)
- Affiche "9+" si > 9
- Passe à 0 dès l'ouverture de `/notifications`
- Synchronisation via event custom `window.dispatchEvent('notifications-read')`

### Fonctionnalités

- ✅ Création automatique par triggers SQL
- ✅ Temps réel avec Supabase Realtime
- ✅ Badge dans Navigation (+1 instantané)
- ✅ Pagination cursor-based (20 par page)
- ✅ Auto-mark-as-read au chargement de la page
- ✅ Compteur de non lues
- ✅ Animations fluides
- ✅ Empty states
- ✅ Cleanup automatique (> 30 jours)

### Triggers SQL automatiques

**Follow** → `notify_new_follower()`
- Déclenché sur INSERT dans `follows` avec `status='active'`
- Crée notification si on ne se suit pas soi-même

**Like** → `notify_post_like()`
- Déclenché sur INSERT dans `post_likes`
- Récupère `post_author_id` depuis `posts`
- Crée notification si on ne like pas son propre post

**Comment** → `notify_post_comment()`
- Déclenché sur INSERT dans `comments`
- Récupère `post_author_id` depuis `posts`
- Crée notification si on ne commente pas son propre post

**Cleanup** → Triggers de suppression
- Unfollow → Supprime notification `new_follower`
- Unlike → Supprime notification `post_like`
- Delete comment → Supprime notification `post_comment`

## 🔍 Système de recherche ✅ NOUVEAU

### Flux utilisateur

**Page Search** (`/search`)
1. Input de recherche partagé entre les onglets
2. Deux onglets : Albums et Utilisateurs
3. Recherche instantanée avec debounce (300ms)
4. Placeholder dynamique selon l'onglet actif

### Onglet Albums

**SearchAlbumsTab** :
- Recherche dans la BDD locale (table `albums`)
- Affichage en grille avec `AlbumCard`
- Clic sur album → ouvre `AddVinylModal` à l'étape 2

**AlbumCard** :
- Composant réutilisable extrait de `AlbumSearch`
- Props : `album` et `onClick` callback
- Affiche cover, titre, artiste, année
- Hover effect avec scale

**Modal** :
- Disponible pour users connectés ET non-connectés
- Utilisateurs connectés : peuvent ajouter le vinyle
- Utilisateurs non-connectés : peuvent voir les pressages (découverte)

### Onglet Utilisateurs

**SearchUsersTab** :
- Recherche par username, first_name, last_name (ILIKE)
- Affichage en liste avec `UserListItem`
- Bouton "Suivre" intégré
- Lien vers profil cliquable

**UserListItem** (réutilisé) :
- Avatar + username + nom complet + bio
- Link vers `/profile/:username`
- Bouton Follow/Unfollow optionnel

### Composants
```
Search.tsx (Page principale)
  ├── Input de recherche (partagé)
  ├── Tabs (Albums / Utilisateurs)
  │
  ├── SearchAlbumsTab
  │     ├── Recherche avec debounce
  │     ├── Loading skeletons
  │     ├── AlbumCard (map sur résultats)
  │     └── AddVinylModal (avec initialAlbum)
  │
  └── SearchUsersTab
        ├── Recherche avec debounce
        ├── Loading skeletons
        └── UserListItem (map sur résultats)
```

### Fonctionnalités

- ✅ Recherche instantanée (debounce 300ms)
- ✅ Tabs avec indicateur visuel
- ✅ Placeholder dynamique
- ✅ Loading skeletons personnalisés
- ✅ Empty states par onglet
- ✅ Compteur de résultats
- ✅ Gestion d'erreurs
- ✅ Modal disponible pour tous (connectés et non-connectés)

## 🎨 Système de vinyles - Modal en 3 étapes

### Flux utilisateur

Le modal `AddVinylModal` guide l'utilisateur à travers 3 étapes avec des animations fluides (Framer Motion) :

**Étape 1 - AlbumSearch** : Recherche d'albums
- Barre de recherche avec debounce (300ms)
- Affichage en grille des albums trouvés (utilise `AlbumCard`)
- Recherche par titre ou artiste dans la BDD locale

**Étape 2 - VinylSelection** : Sélection d'un pressage
- Header avec l'album sélectionné
- Liste de tous les pressages vinyles disponibles
- Badges de statut ("En collection", "En wishlist") en temps réel
- Affichage des infos : année, pays, format

**Étape 3 - VinylDetails** : Confirmation et détails
- Cover grand format
- Détails complets : label, numéro de catalogue, pays, format
- Badges de statut et de réédition
- Bouton de confirmation (masqué si déjà possédé)

### Props AddVinylModal
```typescript
interface AddVinylModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
  targetType: 'collection' | 'wishlist'
  initialAlbum?: Album // ✅ NOUVEAU : permet de sauter l'étape 1
}
```

**Comportement avec `initialAlbum`** :
- Si `undefined` : démarre à l'étape 1 (AlbumSearch)
- Si fourni : démarre à l'étape 2 (VinylSelection)

**IMPORTANT** : Utiliser une `key` dans le parent pour forcer le remount du modal :
```typescript
<AddVinylModal
  key={isModalOpen ? 'modal-open' : 'modal-closed'} // Force reset
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={handleSuccess}
  userId={user.id}
  targetType="collection"
  initialAlbum={selectedAlbum} // undefined ou Album
/>
```

### Fonctionnalités

- ✅ Animations fluides entre les étapes
- ✅ Bouton retour pour naviguer entre les étapes
- ✅ Vérification temps réel du statut des vinyles
- ✅ Messages de succès/erreur
- ✅ Loading states et skeletons
- ✅ Empty states avec emojis
- ✅ Fermeture automatique après succès (1.5s)
- ✅ Support `initialAlbum` pour sauter l'étape 1

## 👤 Système de profils et follows

### Pages de profil

**Profile** (`/profile/:username`)
- Header avec avatar, stats, et bouton Follow/Unfollow
- 3 onglets : Feed, Collection, Wishlist
- Stats cliquables menant vers Followers/Following
- **Note** : Tous les profils sont publics (plus de profils privés)

**Followers** (`/profile/:username/followers`)
- Liste des abonnés avec boutons Follow/Unfollow
- Empty state si aucun abonné
- Lien retour vers le profil

**Following** (`/profile/:username/following`)
- Liste des abonnements avec boutons Follow/Unfollow
- Empty state si aucun abonnement
- Lien retour vers le profil

### Composants de profil

**ProfileHeader**
- Avatar avec gradient de cover (orange → marron)
- Infos utilisateur : username, nom complet, bio
- Stats : vinyles, wishlist, abonnés, abonnements (cliquables)
- Bouton "Modifier le profil" (si c'est son propre profil)
- Bouton "Suivre" / "Abonné" (si profil d'un autre utilisateur)
- Logique de follow/unfollow intégrée (pas de composant séparé)

**ProfileReleases**
- Wrapper autour de `VinylGrid`
- Props : `userId`, `type` (collection/wishlist), `isOwnProfile`, `username`
- Gère les empty states personnalisés
- Affiche le compteur total de vinyles
- Bouton de suppression si `isOwnProfile = true`

**UserListItem**
- Avatar + username + nom complet + bio
- Lien cliquable vers `/profile/:username`
- Bouton Follow/Unfollow optionnel (`showFollowButton`)
- Logique de follow/unfollow intégrée

## 🎨 Variables CSS
```css
--background: #1A1A1A
--background-light: #242424
--background-lighter: #2A2A2A
--foreground: #F5F5F5
--foreground-muted: #A0A0A0
--primary: #E67E22 (orange)
--secondary: #8B4513 (marron)
```

## ⚙️ Configuration Supabase

**Client** (`src/supabaseClient.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Variables d'environnement** (`.env`):
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

## 🔑 Bonnes pratiques du projet

### Imports React Router
```typescript
import { Link, useNavigate } from 'react-router-dom'
// Link avec "to" (pas "href")
// useNavigate() (pas useRouter de Next.js)
```

### Accès aux données utilisateur
```typescript
const username = user?.user_metadata?.username || user?.email?.split('@')[0]
const avatar_url = user?.user_metadata?.avatar_url
const userId = user?.id // (pas user?.uid comme Firebase)
```

### Queries Supabase
```typescript
// ✅ Bon - Vérifier l'existence
const { data } = await supabase.from('users').select('*').eq('username', username)
return !data || data.length === 0

// ❌ Éviter .single() pour vérifier l'existence (erreur PGRST116)
const { data } = await supabase.from('users').select('*').single()
```

### Supabase Realtime
```typescript
// Pattern standard pour les subscriptions
const channel = supabase
  .channel('channel-name')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'table_name',
    filter: 'column=eq.value'
  }, callback)
  .subscribe()

return () => channel.unsubscribe()
```

### Activer Realtime sur une table
```sql
-- Via SQL Editor dans Supabase
ALTER TABLE table_name REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE table_name;
```

### Debounce pour recherche
```typescript
// Pattern avec useEffect et setTimeout
useEffect(() => {
  if (!query || query.length < 2) return;
  
  const timer = setTimeout(async () => {
    // Recherche ici
  }, 300);
  
  return () => clearTimeout(timer);
}, [query]);
```

### VinylImage - Fix loading lazy
```typescript
// ✅ BON : Utiliser opacity au lieu de hidden
<div className="relative">
  <div className={`absolute inset-0 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
    <Placeholder />
  </div>
  <img className={imageLoaded ? 'opacity-100' : 'opacity-0'} loading="lazy" />
</div>

// ❌ MAUVAIS : hidden empêche le chargement avec loading="lazy"
<img className={imageLoaded ? '' : 'hidden'} loading="lazy" />
```

### Event custom pour synchronisation
```typescript
// Émettre l'event
window.dispatchEvent(new Event('event-name'))

// Écouter l'event
const handler = () => { /* action */ }
window.addEventListener('event-name', handler)
return () => window.removeEventListener('event-name', handler)
```

### HTML - Règles de nesting
```typescript
// ❌ MAUVAIS : <p> ne peut pas contenir <div>
<p className="text">
  <div>Content</div>
</p>

// ✅ BON : Utiliser div partout
<div className="text">
  <div>Content</div>
</div>
```

### Modal avec état initial ✅ NOUVEAU
```typescript
// Pattern pour modal avec état de départ différent
const [isOpen, setIsOpen] = useState(false)
const [initialData, setInitialData] = useState<Data | undefined>()

<Modal
  key={isOpen ? 'open' : 'closed'} // Force remount pour reset
  isOpen={isOpen}
  initialData={initialData}
  ...
/>
```

### Réutilisation de composants ✅ NOUVEAU
```typescript
// Extraire la logique d'affichage dans un composant dédié
// Exemple : AlbumCard utilisé dans AlbumSearch ET SearchAlbumsTab

interface AlbumCardProps {
  album: Album
  onClick: (album: Album) => void
}

// Dans le parent
<AlbumCard album={album} onClick={handleClick} />
```

## ⚠️ Points d'attention

1. **Ordre des routes** : Les routes spécifiques (`/profile/:username/followers`) doivent être AVANT les routes génériques (`/profile/:username`)

2. **Policy INSERT** : La table `users` nécessite une policy INSERT pour permettre au trigger de créer des profils

3. **Trigger automatique de posts** : Un post est créé automatiquement quand un vinyle est ajouté à la collection

4. **Triggers notifications** : Les notifications sont créées automatiquement (follow, like, comment)

5. **URLs de profil** : On utilise `username` et non `userId` (UUID) dans les URLs

6. **OAuth** : Le code est prêt pour Google/Facebook OAuth, mais il faut activer les providers dans le dashboard Supabase

7. **Images vinyles** : Utiliser `opacity` au lieu de `hidden` pour éviter les problèmes avec `loading="lazy"`

8. **Realtime** : Penser à activer Realtime sur les nouvelles tables avec `ALTER TABLE ... REPLICA IDENTITY FULL`

9. **Profils privés** : Le système a été simplifié - tous les profils sont publics

10. **Follows** : Tous les follows sont actifs immédiatement (`status='active'`), pas de système de validation

11. **Modal reset** : Utiliser `key` pour forcer le remount au lieu de `useEffect` avec setState

12. **Composants réutilisables** : Extraire la logique d'affichage (ex: AlbumCard, VinylCard) pour éviter la duplication

## ✅ Ce qui fonctionne

1. ✅ Navigation avec Header/Footer sur toutes les pages
2. ✅ Page d'accueil (Home)
3. ✅ Formulaire d'inscription avec validation username
4. ✅ Formulaire de connexion
5. ✅ Page Feed avec infinite scroll et pull-to-refresh
6. ✅ PostCard avec likes et commentaires
7. ✅ Système de likes optimiste (UI instantanée)
8. ✅ Système de commentaires temps réel
9. ✅ Hook useAuth pour l'authentification
10. ✅ Base de données complète avec RLS
11. ✅ Page Collection avec infinite scroll
12. ✅ Page Wishlist avec infinite scroll
13. ✅ Modal d'ajout en 3 étapes avec animations
14. ✅ Recherche d'albums dans la BDD
15. ✅ Sélection de pressages avec badges de statut
16. ✅ Détails complets avant ajout
17. ✅ Suppression de vinyles
18. ✅ Déplacement wishlist → collection
19. ✅ Page Profile complète avec 3 onglets
20. ✅ ProfileHeader avec bouton Follow/Unfollow
21. ✅ ProfileReleases réutilisant VinylGrid
22. ✅ Page Followers avec liste d'abonnés
23. ✅ Page Following avec liste d'abonnements
24. ✅ UserListItem avec bouton Follow
25. ✅ Images de vinyles affichées correctement
26. ✅ Système de notifications complet
27. ✅ Badge notifications temps réel dans Navigation
28. ✅ Page notifications avec auto-mark-as-read
29. ✅ Triggers automatiques pour notifications
30. ✅ Event custom pour synchronisation badge
31. ✅ **Page Search avec tabs Albums/Utilisateurs**
32. ✅ **AlbumCard composant réutilisable**
33. ✅ **SearchAlbumsTab avec recherche instantanée**
34. ✅ **SearchUsersTab avec recherche instantanée**
35. ✅ **AddVinylModal avec support initialAlbum**

## 🐛 Bugs corrigés

1. ✅ **Images vinyles ne s'affichaient pas** (problème `loading="lazy"` + `hidden`)
   - Solution : Utiliser `opacity` et `absolute positioning`

2. ✅ **Erreur "Database error saving new user"** lors de l'inscription
   - Solution : Ajout de la policy INSERT sur la table `users`

3. ✅ **Page 404 sur `/profile/:username/followers` et `/profile/:username/following`**
   - Solution : Ordre correct des routes (spécifiques avant génériques)

4. ✅ **Erreur UUID vide dans useNotifications**
   - Solution : Protection avec early return si `userId` vide

5. ✅ **Erreur HTML `<p>` ne peut pas contenir `<div>`**
   - Solution : Utiliser `<div>` au lieu de `<p>` pour le message de notification

6. ✅ **Realtime notifications ne fonctionnait pas**
   - Solution : Activer Realtime sur la table `notifications` avec SQL

7. ✅ **Warning "setState synchronously within an effect"**
   - Solution : Retirer le useEffect de reset du count (inutile car badge caché si pas de user)

8. ✅ **Warning "Calling setState synchronously within an effect"** (AddVinylModal)
   - Solution : Utiliser `key` pour forcer le remount au lieu de `useEffect`

## ⏳ Tâches prioritaires

### Court terme
1. ⏳ Page de settings/modification profil
2. ⏳ Filtres/tri dans Collection/Wishlist
3. ⏳ **Refactoriser VinylSelection pour utiliser VinylCard** (comme AlbumSearch utilise AlbumCard)

### Moyen terme
4. ⏳ Configurer OAuth (Google, Facebook) dans Supabase
5. ⏳ Créer système d'ajout de nouveaux albums/vinyles dans la BDD (admin)
6. ⏳ Implémenter les settings utilisateur
7. ⏳ Statistiques de collection (par genre, année, label)
8. ⏳ Notifications push pour nouvelles notifications
9. ⏳ Import/Export de collection

## 📝 Notes techniques importantes

### Triggers automatiques
- `on_auth_user_created` : Crée automatiquement une entrée dans `users` quand un utilisateur s'inscrit
- `on_vinyl_added_create_post` : Crée automatiquement un post dans le feed quand un vinyle est ajouté en collection
- `notify_new_follower` : Crée notification lors d'un follow
- `notify_post_like` : Crée notification lors d'un like
- `notify_post_comment` : Crée notification lors d'un commentaire

### Vite 7 et Tailwind
- Vite 7 nécessite Tailwind v3 (pas v4 qui demande Vite 5/6)
- PostCSS configuré pour Tailwind
- Variables CSS custom dans `index.css`

### TypeScript
- Mode strict activé
- Types organisés dans `src/types/`
- Interfaces bien définies pour tous les composants

### Performance
- Infinite scroll avec Intersection Observer
- Pagination cursor-based (pas d'offset)
- Optimistic UI pour likes/comments/suppressions/notifications
- Batch queries pour les stats (likes/comments)
- Index DB optimisés
- Debounce sur recherche (300ms)

### Animations
- Framer Motion pour les transitions du modal
- Transitions fluides entre les étapes (slide left/right)
- AnimatePresence pour les changements de composants
- Animations dans NotificationItem (fade in, slide out)

## 🚀 Commandes utiles
```bash
# Développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview

# Linter
npm run lint
```

## 🎯 Prochaines fonctionnalités à implémenter

1. **Modification de profil** (bio, photo, username)
2. **Filtres et tri** dans Collection/Wishlist (par année, artiste, date d'ajout)
3. **Refactoriser VinylSelection** pour utiliser VinylCard
4. **Notifications push** pour nouvelles notifications
5. **Partage de profil/vinyles** (liens publics)
6. **Statistiques de collection** (par genre, année, label)
7. **Import/Export** de collection
8. **Mode sombre/clair** (actuellement dark only)
9. **Système d'ajout de nouveaux albums/vinyles** dans la BDD (admin/modération)
10. **Pagination côté serveur** pour très grandes collections (>1000 vinyles)

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [React Router v6](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Framer Motion](https://www.framer.com/motion/)

---

**Dernière mise à jour** : 10 janvier 2026