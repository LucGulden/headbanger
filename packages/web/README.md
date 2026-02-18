# HeadBanger Web - React App

Interface utilisateur HeadBanger : gestion collection vinyle + réseau social.

## Stack
- React 18 + TypeScript
- Vite
- Zustand (state)
- Socket.IO Client (notifications)

## Structure
```
src/
├── components/       # Composants UI
├── pages/            # Pages
├── guards/           # Route guards
├── hooks/            # Hooks custom
├── lib/
│   ├── api/          # Services API (backend NestJS)
│   │   ├── auth.ts
│   │   ├── storage.ts        # Upload avatars
│   │   ├── posts.ts
│   │   ├── comments.ts
│   │   └── ...
│   ├── apiClient.ts  # Client HTTP centralisé
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
VITE_API_URL=http://localhost:3001
```

## Architecture

### apiClient - HTTP centralisé

Tous les appels backend passent par `apiClient` :
```typescript
// JSON requests
await apiClient.get('/posts/feed')
await apiClient.post('/comments', { postId, content })

// File uploads (FormData)
await apiClient.upload('/storage/upload/avatar', formData)
```

### Services API (`/lib/api`)
```typescript
// Plus besoin de passer userId (extrait du JWT)
await likePost(postId)
await addComment(postId, content)
await uploadProfilePhoto(file)
```

| Service | Description |
|---------|-------------|
| `storage.ts` | Upload/delete avatars |
| `auth.ts` | signup, login, logout |
| `posts.ts` | Feed global/profil, create, delete |
| `postLikes.ts` | like, unlike, hasLiked, getCount |
| `comments.ts` | add, delete, getComments, getCount |
| `notifications.ts` | list, unreadCount, markAllAsRead |

### Stores Zustand

| Store | Responsabilité |
|-------|----------------|
| `useAuthStore` | Auth (user, loading, signUp, signIn, signOut) |
| `useUserStore` | Profil user (username, photo, bio) |
| `useNotificationsStore` | Compteur non lues + Socket.IO |

### Socket.IO - Notifications temps réel
```typescript
// Auto-connecté dans useAuthStore
socketClient.on('notification:new', handleNew)
socketClient.on('notification:deleted', handleDeleted)
socketClient.on('notification:read-all', handleReadAll)
```

### Optimistic UI (Likes & Comments)

**Pattern** : Affichage immédiat + refresh après succès
```typescript
// 1. Optimistic UI
setIsLiked(!wasLiked)
setLikesCount(wasLiked ? count - 1 : count + 1)

try {
  // 2. API call
  await likePost(postId)
  
  // 3. Refresh count réel
  const realCount = await getLikesCount(postId)
  setLikesCount(realCount)
} catch {
  // Rollback on error
  setIsLiked(wasLiked)
  setLikesCount(count)
}
```

## Routes

### Publiques (tous)
```
/vinyl/:id          # Page vinyle
/album/:id          # Page album
/artist/:id         # Page artiste
/search             # Recherche
/profile/:username  # Profil
```

### Protégées (bloquées si déco)
```
/notifications, /settings
```

## Composants clés

| Composant | Rôle |
|-----------|------|
| `PostCard` | Carte post + optimistic UI (likes/comments) |
| `EditProfileForm` | Édition profil + upload avatar |
| `Navigation` | Header avec auth state |
| `Avatar` | Avatar user avec fallback |

## Scripts
```bash
pnpm dev            # Dev avec hot reload (port 5173)
pnpm build          # Build production
pnpm lint           # ESLint
```

## Troubleshooting

**401 Unauthorized** :
- Vérifier cookies `auth_token` présents
- Vérifier `VITE_API_URL` pointe vers backend

**Socket.IO ne connecte pas** :
- Backend doit tourner
- Vérifier CORS backend autorise `http://localhost:5173`

**Types partagés non reconnus** :
```bash
cd ../../
pnpm build:shared
pnpm install
```

---

**Dernière mise à jour** : 11 Février 2026