# HeadBanger Backend - API NestJS

API REST avec Socket.IO pour HeadBanger.

## Stack
- NestJS + Fastify
- Socket.IO (notifications temps réel)
- Redis (sessions + cache)
- Supabase (DB + Auth)

## Structure
```
src/
├── auth/              # JWT validation, guards, decorators
├── users/             # Profils utilisateurs
├── follows/           # Relations sociales
├── posts/             # Feed social
├── post-likes/        # Likes sur posts
├── comments/          # Commentaires
├── notifications/     # Notifications (CRUD + Socket.IO)
├── albums/            # Albums musicaux
├── vinyls/            # Pressages vinyles
├── artists/           # Artistes
├── user-vinyls/       # Collections/wishlists
├── events/            # Socket.IO émissions
├── redis/             # Gestion Redis
└── common/
    └── database/      # SupabaseService
```

## Installation
```bash
cd packages/backend
pnpm install
cp .env.example .env
# Configurer .env
pnpm run start:dev
```

## Variables d'environnement
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx          # PAS service_role !
JWT_SECRET=xxx                  # Même que Supabase JWT secret
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                 # Optionnel en dev
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
COOKIE_DOMAIN=localhost
```

## Authentification

### Flow
1. Web login via Supabase Auth → JWT
2. Web envoie JWT dans cookie `auth_token` (httpOnly)
3. `AuthGuard` valide JWT + vérifie session Redis
4. `@CurrentUser()` decorator extrait `userId` automatiquement

### Decorators disponibles
```typescript
@CurrentUser()    // → { id: string }
@CurrentToken()   // → string (Supabase JWT)
@CurrentSession() // → Session object
```

### Utilisation
```typescript
@Post()
@UseGuards(AuthGuard)
async createPost(
  @CurrentUser() user: AuthenticatedUser,
  @CurrentToken() token: string,
  @Body() dto: CreatePostDto,
) {
  // user.id disponible automatiquement
  // token pour appels Supabase avec RLS
}
```

## Socket.IO - Notifications temps réel

### Architecture
```typescript
// EventsService émet les événements
this.eventsService.emitToUser(userId, 'notification:new', notification)
this.eventsService.emitToUser(userId, 'notification:deleted', { ... })
this.eventsService.emitToUser(userId, 'notification:read-all', { ... })
```

### Rooms
- Auto-join : `user:${userId}` (backend au connect)
- Utilisé pour : notifications uniquement

### Événements émis
| Événement | Données | Quand |
|-----------|---------|-------|
| `notification:new` | `Notification` | Like, comment, follow |
| `notification:deleted` | `{ type, actorId, ... }` | Unlike, uncomment, unfollow (si non lue) |
| `notification:read-all` | `{ userId }` | Mark all as read |

## Pattern RLS (Row Level Security)

### Problème
Supabase RLS nécessite `auth.uid()` pour filtrer/autoriser.

### Solution
Utiliser le token Supabase de l'utilisateur :
```typescript
// ❌ Client anonyme (RLS bloque ou filtre silencieusement)
const supabase = this.supabaseService.getClient()

// ✅ Client authentifié (RLS passe)
const supabase = this.supabaseService.getClientWithAuth(token)
```

### Services concernés
- `NotificationsService` : READ (select), UPDATE (mark as read), DELETE
- `FollowsService` : INSERT (follow), DELETE (unfollow)
- `PostLikesService` : INSERT (like), DELETE (unlike)
- `CommentsService` : INSERT (comment), DELETE (own comment)

### Pattern type
```typescript
async likePost(userId: string, postId: string, token: string) {
  const supabase = this.supabaseService.getClientWithAuth(token)
  await supabase.from('post_likes').insert({ user_id: userId, post_id: postId })
  
  // Émettre notification si nécessaire
  await this.notificationsService.createNotification(
    postAuthorId,
    'post_like',
    userId,
    token,  // ← Toujours passer le token
    postId,
  )
}
```

## Endpoints principaux

### Auth
- `POST /auth/signup` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/logout` - Déconnexion
- `GET /auth/me` - User actuel

### Posts
- `GET /posts/feed` - Feed global
- `GET /posts/profile/:userId` - Feed profil
- `POST /posts` - Créer post
- `DELETE /posts/:id` - Supprimer post

### Likes & Comments
- `POST /post-likes/:postId` - Like
- `DELETE /post-likes/:postId` - Unlike
- `POST /comments` - Ajouter commentaire
- `DELETE /comments/:id` - Supprimer commentaire

### Notifications
- `GET /notifications` - Liste notifications
- `GET /notifications/unread-count` - Compteur non lues
- `PUT /notifications/mark-all-read` - Marquer toutes lues

### Follows
- `POST /follows/:userId` - Follow
- `DELETE /follows/:userId` - Unfollow
- `GET /follows/check/:userId` - Vérifier si suit

### Collections
- `GET /user-vinyls` - Liste collection/wishlist
- `POST /user-vinyls` - Ajouter vinyle
- `DELETE /user-vinyls/:vinylId` - Retirer vinyle
- `PATCH /user-vinyls/:vinylId/move-to-collection` - Déplacer wishlist → collection

## Scripts
```bash
pnpm run start:dev     # Dev avec hot reload
pnpm run build         # Build production
pnpm run start:prod    # Lancer production
pnpm run lint          # ESLint
pnpm run test          # Tests unitaires
```

## Troubleshooting

**RLS bloque requêtes** :
- Vérifier que `token` est passé aux services
- Utiliser `getClientWithAuth(token)` au lieu de `getClient()`

**Socket.IO ne connecte pas** :
- Vérifier `FRONTEND_URL` dans `.env`
- Vérifier CORS configuré dans `main.ts`

**Redis erreur** :
- Vérifier Redis actif : `redis-cli ping`
- Vérifier `REDIS_HOST` et `REDIS_PORT`

---

**Dernière mise à jour** : Février 2026