# HeadBanger Web - React App

Interface utilisateur HeadBanger : gestion collection vinyle + réseau social.

## Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state)
- Socket.IO Client (notifications)

## Structure
```
src/
├── components/       # Composants UI
├── pages/            # Pages (VinylPage, AlbumPage, ArtistPage, etc.)
├── guards/           # Route guards
├── hooks/            # Hooks custom
├── lib/
│   ├── api/          # Services API (backend NestJS)
│   ├── socket.ts     # Socket.IO client
│   └── ...
├── stores/           # Zustand stores
│   ├── useAuthStore.ts
│   ├── useUserStore.ts
│   └── useNotificationsStore.ts
└── types/
```

## Installation
```bash
cd packages/web
pnpm install
cp .env.example .env
# Configurer .env
pnpm dev
```

## Variables d'environnement
```bash
```

## Architecture

### Services API (`/lib/api`)

Tous les appels backend passent par des services typés :
```typescript
// Plus besoin de passer userId (extrait du JWT)
await likePost(postId)
await addComment(postId, content)
await followUser(targetUserId)
await addVinylToUser(vinylId, 'collection')
```

| Service | Auth | Description |
|---------|------|-------------|
| `auth.ts` | - | signup, login, getCurrentUser, logout |
| `posts.ts` | ✅ | Feed global/profil, create, delete |
| `postLikes.ts` | ✅ | like, unlike, hasLiked, getCount |
| `comments.ts` | ✅ | add, delete, getComments, getCount |
| `notifications.ts` | ✅ | list, unreadCount, markAllAsRead |
| `follows.ts` | ✅ | follow, unfollow, isFollowing, stats |
| `albums.ts` | Public | getById, search |
| `vinyls.ts` | Public | getById |
| `artists.ts` | Public | getById, search |
| `userVinyls.ts` | ✅ | getUserVinyls, add, remove, moveToCollection |
| `users.ts` | Mixed | getCurrentUser, update, search, getByUsername |

### Stores Zustand

| Store | Responsabilité |
|-------|----------------|
| `useAuthStore` | Auth (user, loading, signUp, signIn, signOut) |
| `useUserStore` | Profil user (username, photo, bio) |
| `useNotificationsStore` | Compteur non lues + Socket.IO |

### Socket.IO - Notifications temps réel
```typescript
// Initialisation automatique dans useAuthStore
socketClient.connect(userId)

// Événements écoutés (dans notificationsStore)
socketClient.on('notification:new', handleNew)
socketClient.on('notification:deleted', handleDeleted)
socketClient.on('notification:read-all', handleReadAll)
```

**Rooms** : Auto-join `user:${userId}` côté backend

### Optimistic UI (Likes & Comments)

**Pattern sans WebSocket** : Affichage immédiat + refresh après succès
```typescript
// Like
const handleLike = async () => {
  // 1. Optimistic UI
  setIsLiked(!wasLiked)
  setLikesCount(wasLiked ? count - 1 : count + 1)
  
  try {
    // 2. API call
    await (wasLiked ? unlikePost(postId) : likePost(postId))
    
    // 3. Refresh count réel
    const realCount = await getLikesCount(postId)
    setLikesCount(realCount)
  } catch {
    // Rollback on error
    setIsLiked(wasLiked)
    setLikesCount(count)
  }
}
```

**Pourquoi ce pattern ?**
- ✅ UX fluide (update immédiate)
- ✅ Données synchronisées après action
- ✅ Moins complexe que WebSocket pour likes
- ✅ Évite les problèmes de synchro multi-users

## Routes

### Publiques (tous)
```
/vinyl/:id          # Page vinyle (détails + actions)
/album/:id          # Page album (liste vinyles)
/artist/:id         # Page artiste (discographie)
/search             # Recherche albums/artistes/users
/profile/:username  # Profil (feed/collection/wishlist)
```

### Dynamique selon auth
```
/                   # Landing (déco) / Feed (connecté)
```

### Public only (bloquées si connecté)
```
/signup, /login
```

### Protégées (bloquées si déco)
```
/notifications, /settings
```

## Composants clés

| Composant | Rôle |
|-----------|------|
| `PostCard` | Carte post + optimistic UI (likes/comments) |
| `VinylCard` | Carte vinyle (modes full/compact) |
| `AlbumCard` | Carte album (cliquable → `/album/:id`) |
| `ArtistCard` | Carte artiste (cliquable → `/artist/:id`) |
| `Navigation` | Header avec auth state |
| `LoadingSpinner` | Spinner centralisé |
| `Avatar` | Avatar user avec fallback |

## Guards

| Guard | Comportement |
|-------|--------------|
| `ProtectedRoute` | Redirect `/` si déconnecté |
| `PublicOnlyRoute` | Redirect `/` si connecté |
| `HomeRoute` | Landing ou Feed selon auth |

## Scripts
```bash
pnpm dev            # Dev avec hot reload (port 5173)
pnpm build          # Build production
pnpm preview        # Preview du build
pnpm lint           # ESLint
pnpm lint:fix       # Fix auto
```

## Pattern d'usage

### Interaction avec un post
```typescript
// Like avec refresh
await likePost(postId)
const realCount = await getLikesCount(postId)
setLikesCount(realCount)

// Comment avec refresh
const newComment = await addComment(postId, content)
setComments(prev => [...prev, newComment])
const realCount = await getCommentsCount(postId)
setCommentsCount(realCount)
```

### Ajout vinyle avec state update
```typescript
await addVinylToUser(vinylId, 'collection')
// Stores Zustand se mettent à jour via callbacks
```

## Troubleshooting

**401 Unauthorized** :
- Vérifier connexion : `useAuth()`
- Vérifier `VITE_API_URL` pointe vers backend
- Vérifier cookies `auth_token` présents

**Socket.IO ne connecte pas** :
- Backend doit tourner
- Vérifier CORS backend autorise `http://localhost:5173`

**Types partagés non reconnus** :
```bash
cd ../../
pnpm build:shared
pnpm install
```

**Compteur notifications bloqué à 0** :
- Vérifier `notificationsStore` initialisé
- Vérifier Socket.IO connecté : `socketClient.isConnected()`

---

**Dernière mise à jour** : Février 2026