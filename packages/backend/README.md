# HeadBanger Backend - API NestJS

API REST avec Socket.IO pour HeadBanger.

## Stack
- NestJS + Fastify
- Socket.IO (notifications temps réel)
- Redis (sessions + cache)
- Supabase (DB + Auth + Storage)

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
├── storage/           # Upload avatars (Supabase Storage)
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
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Authentification

### Flow
1. Frontend → POST /auth/login (email, password)
2. Backend → Supabase Auth (signInWithPassword)
3. Supabase → Backend (JWT Supabase)
4. Backend → Redis (stocke JWT Supabase dans session)
5. Backend → Frontend (JWT backend dans cookie httpOnly)

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

### Événements émis
| Événement | Données | Quand |
|-----------|---------|-------|
| `notification:new` | `Notification` | Like, comment, follow |
| `notification:deleted` | `{ type, actorId, ... }` | Unlike, uncomment, unfollow (si non lue) |
| `notification:read-all` | `{ userId }` | Mark all as read |

## Storage - Avatars

### Upload
- Endpoint : `POST /storage/upload/avatar`
- Compression côté frontend (WebP, 256x256, <500KB)
- Stockage : Supabase Storage bucket `avatars`
- Nom fichier : `userId.webp` (upsert écrase ancien)

### RLS Supabase
```sql
-- Lecture publique
bucket_id = 'avatars'

-- Insert/Update/Delete : nom = userId.webp
name = auth.uid()::text || '.webp'
```

## Pattern RLS (Row Level Security)

### Problème
Supabase RLS nécessite `auth.uid()` pour filtrer/autoriser.

### Solution
Utiliser le token Supabase de l'utilisateur :
```typescript
// ❌ Client anonyme (RLS bloque)
const supabase = this.supabaseService.getClient()

// ✅ Client authentifié (RLS passe)
const supabase = this.supabaseService.getClientWithAuth(token)
```

### Services concernés
- `NotificationsService`
- `FollowsService`
- `PostLikesService`
- `CommentsService`
- `StorageService`
- `UsersService` (updateUserProfile)

## Endpoints principaux

### Auth
- `POST /auth/signup` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/logout` - Déconnexion
- `GET /auth/me` - User actuel

### Storage
- `POST /storage/upload/avatar` - Upload avatar
- `DELETE /storage/avatar` - Supprimer avatar

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

### Users
- `GET /users/me` - Profil actuel
- `PUT /users/profile` - Mettre à jour profil
- `GET /users/search` - Rechercher users

## Scripts
```bash
pnpm run start:dev     # Dev avec hot reload
pnpm run build         # Build production
pnpm run lint          # ESLint
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

---

**Dernière mise à jour** : 11 Février 2026