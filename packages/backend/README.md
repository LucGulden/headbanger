# FillCrate Backend - API NestJS

## Vue d'ensemble

API REST pour FillCrate, réseau social pour passionnés de vinyles. Backend NestJS avec Fastify, TypeScript et Supabase.

**Stack** : NestJS + Fastify + TypeScript + Supabase + Class Validator

## Architecture

### Approche hybride : Backend API + Supabase

Le backend utilise **`SUPABASE_ANON_KEY`** (pas service_role) pour bénéficier de l'authentification JWT tout en centralisant la logique métier.

**Ce que le backend gère** :
- ✅ Validation des JWT Supabase (AuthGuard)
- ✅ Logique métier (posts, likes, comments, follows, notifications)
- ✅ Transformations de données (snake_case → camelCase)
- ✅ Actions dérivées asynchrones (notifications, posts automatiques)
- ✅ API propre pour web + mobile

**Ce que Supabase gère directement** :
- ✅ Authentification (signup, login, JWT generation)
- ✅ Realtime (WebSocket pour likes, comments, notifications)
- ✅ Storage (avatars, covers avec RLS policies)
- ✅ Row Level Security pour requêtes directes

## Structure du projet
```
src/
├── albums/              # Module Albums
├── artists/             # Module Artists
├── vinyls/              # Module Vinyls
├── user-vinyls/         # Module UserVinyls (collections/wishlists)
├── users/               # Module Users (profils)
├── follows/             # Module Follows (relations sociales)
├── posts/               # Module Posts (feed social)
├── post-likes/          # Module PostLikes
├── comments/            # Module Comments
├── notifications/       # Module Notifications
├── common/              # Code partagé
│   ├── database/
│   │   └── supabase.service.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   └── decorators/
│       └── current-user.decorator.ts
├── app.controller.ts    # Healthcheck
├── app.module.ts        # Module racine
└── main.ts              # Bootstrap Fastify
```

## Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine de `packages/backend/` :
```bash
# Supabase - IMPORTANT : Utiliser ANON_KEY, pas SERVICE_ROLE
SUPABASE_URL=https://ton-projet.supabase.co
SUPABASE_ANON_KEY=ta-anon-key

# Server
PORT=3001
NODE_ENV=development

# CORS (optionnel, pour prod)
FRONTEND_URL=http://localhost:5173
```

⚠️ **Important** : Le backend utilise `SUPABASE_ANON_KEY` pour bénéficier de l'authentification JWT. Ne pas utiliser `service_role` sauf besoins spécifiques.

### CORS

Le CORS est configuré dans `main.ts` pour accepter les requêtes depuis le frontend :
```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

En production, utiliser la variable d'environnement `FRONTEND_URL`.

## Scripts disponibles
```bash
# Développement avec hot reload
pnpm start:dev

# Build pour production
pnpm build

# Lancer en production
pnpm start:prod

# Tests
pnpm test
pnpm test:e2e
pnpm test:cov

# Linter
pnpm lint
pnpm lint:fix
```

## Authentification

### Flow d'authentification

1. **Frontend** : Login via Supabase Auth → Reçoit JWT
2. **Frontend** : Envoie requête avec `Authorization: Bearer <JWT>`
3. **Backend** : `AuthGuard` valide le JWT via Supabase
4. **Backend** : Extrait `userId` du JWT automatiquement
5. **Backend** : Exécute la logique métier avec `userId`

### Utilisation dans les controllers
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('posts')
@UseGuards(AuthGuard) // Protège toutes les routes
export class PostsController {
  
  @Get('feed')
  async getFeed(@CurrentUser() user: AuthenticatedUser) {
    // user.id contient l'UID récupéré du JWT
    return this.postsService.getGlobalFeed(user.id);
  }
}
```

**Avantages** :
- ✅ Pas de `userId` dans les body/params (sécurité)
- ✅ Validation JWT automatique
- ✅ Code plus propre et moins d'erreurs

## Modules

Chaque fonctionnalité est organisée en module NestJS (controller + service + module).

| Module | Description |
|--------|-------------|
| `AlbumsModule` | Gestion des albums (métadonnées musicales) + recherche |
| `ArtistsModule` | Gestion des artistes (recherche, récupération) |
| `VinylsModule` | Gestion des vinyles (pressings physiques) |
| `UserVinylsModule` | Collections et wishlists des utilisateurs + posts automatiques |
| `UsersModule` | Profils utilisateurs (CRUD, recherche) |
| `FollowsModule` | Relations sociales (follow/unfollow) + notifications automatiques |
| `PostsModule` | Posts sociaux (feed global et profil) |
| `PostLikesModule` | Likes sur les posts + notifications automatiques |
| `CommentsModule` | Commentaires sur les posts + notifications automatiques |
| `NotificationsModule` | Système de notifications |

### Services centralisés

| Service | Rôle |
|---------|------|
| `SupabaseService` | Client Supabase centralisé avec support JWT |

### Guards

| Guard | Rôle |
|-------|------|
| `AuthGuard` | Valide le JWT Supabase, à utiliser avec `@UseGuards(AuthGuard)` |

### Decorators

| Decorator | Rôle |
|-----------|------|
| `@CurrentUser()` | Récupère l'utilisateur authentifié (uid + token) dans un controller |

## Pattern Light vs Complet

Les services suivent un pattern d'optimisation pour les performances :

| Méthode | Type retourné | Usage |
|---------|---------------|-------|
| `findById()` | Type complet avec relations | Page détaillée |
| `searchXxx()` | Type Light sans relations | Recherche, listes |

**Exemples** :
```typescript
// Albums
findById(id) → Album (avec vinyls: VinylLight[])
searchAlbums(query) → AlbumLight[] (sans vinyls)

// Artists  
findById(id) → Artist (avec albums: AlbumLight[])
searchArtists(query) → ArtistLight[] (sans albums)
```

**Gain de performance** :
- Recherche : 1 requête au lieu de 20+
- Transfert de données : 4x moins
- UX : Résultats instantanés

## Endpoints

### Albums

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/albums/search?query=...&limit=...&offset=...` | Public | Recherche d'albums → `AlbumLight[]` |
| `GET` | `/albums/:id` | Public | Récupère un album → `Album` (avec vinyls) |

⚠️ **Important** : Route `/search` AVANT route `/:id` dans le controller.

### Artists

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/artists/search?query=...&limit=...&offset=...` | Public | Recherche d'artistes → `ArtistLight[]` |
| `GET` | `/artists/:id` | Public | Récupère un artiste → `Artist` (avec albums) |

⚠️ **Important** : Route `/search` AVANT route `/:id` dans le controller.

### Vinyls

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/vinyls/:id` | Public | Récupère un vinyl → `Vinyl` |

### UserVinyls (Collections/Wishlists)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/user-vinyls?type=...&limit=...&lastAddedAt=...` | ✅ | Liste des vinyles (userId du JWT) |
| `GET` | `/user-vinyls/count?type=...` | ✅ | Compte total de vinyles |
| `GET` | `/user-vinyls/stats` | ✅ | Statistiques (collection + wishlist) |
| `GET` | `/user-vinyls/check/:vinylId?type=...` | ✅ | Vérifie si vinyl possédé |
| `POST` | `/user-vinyls` | ✅ | Ajoute un vinyl (body: vinylId, type) + post auto |
| `DELETE` | `/user-vinyls/:vinylId?type=...` | ✅ | Retire un vinyl |
| `POST` | `/user-vinyls/:vinylId/move-to-collection` | ✅ | Déplace wishlist → collection |

### Users (Profils)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/users/me` | ✅ | Profil de l'utilisateur connecté (userId du JWT) |
| `PUT` | `/users/me` | ✅ | Mise à jour du profil (userId du JWT) |
| `GET` | `/users/:uid` | Public | Profil par UID |
| `GET` | `/users/username/:username` | Public | Profil par username |
| `GET` | `/users/search?query=...&limit=...&offset=...` | Public | Recherche d'utilisateurs |
| `GET` | `/users/check-username?username=...` | Public | Vérifie disponibilité username |

### Follows (Relations sociales)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/follows/stats/:userId` | Public | Statistiques follow (followers/following count) |
| `GET` | `/follows/check/:userId` | ✅ | Vérifie si on suit (userId du JWT) |
| `POST` | `/follows/:userId` | ✅ | Suivre (userId du JWT) + notification auto |
| `DELETE` | `/follows/:userId` | ✅ | Ne plus suivre (userId du JWT) + supprime notif |
| `GET` | `/follows/followers/:userId` | Public | Liste des followers |
| `GET` | `/follows/following/:userId` | Public | Liste des following |

### Posts (Feed social)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/posts/feed?limit=...&lastCreatedAt=...` | ✅ | Feed global (userId du JWT) |
| `GET` | `/posts/profile/:userId?limit=...&lastCreatedAt=...` | Public | Feed profil |
| `GET` | `/posts/:id` | Public | Post par ID |
| `POST` | `/posts` | ✅ | Crée un post (userId du JWT) |
| `DELETE` | `/posts/:id` | ✅ | Supprime un post (userId du JWT) |

### PostLikes

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/post-likes/:postId` | ✅ | Like (userId du JWT) + notification auto |
| `DELETE` | `/post-likes/:postId` | ✅ | Unlike (userId du JWT) + supprime notif |
| `GET` | `/post-likes/check/:postId` | ✅ | Vérifie si on a liké (userId du JWT) |
| `GET` | `/post-likes/count/:postId` | Public | Nombre de likes |

### Comments

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/comments/post/:postId` | Public | Liste des commentaires |
| `GET` | `/comments/post/:postId/count` | Public | Nombre de commentaires |
| `POST` | `/comments` | ✅ | Ajoute (userId du JWT) + notification auto |
| `DELETE` | `/comments/:id` | ✅ | Supprime (userId du JWT) + supprime notif |

### Notifications

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/notifications?limit=...&lastCreatedAt=...` | ✅ | Liste (userId du JWT) |
| `GET` | `/notifications/unread-count` | ✅ | Nombre de non lues (userId du JWT) |
| `PUT` | `/notifications/mark-all-read` | ✅ | Marque toutes comme lues (userId du JWT) |

### Healthcheck

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/health` | Public | Healthcheck pour monitoring |

## Types partagés

Les types sont importés depuis `@fillcrate/shared` :
```typescript
import { 
  Album, 
  AlbumLight,
  Artist, 
  ArtistLight, 
  Vinyl,
  VinylLight,
  User, 
  UserLight,
  UserVinyl,
  PostWithDetails,
  Comment,
  Notification,
  FollowStats,
  VinylStats
} from '@fillcrate/shared';
```

**Pattern Light vs Complet** :
```typescript
// Album
interface AlbumLight {
  id, title, artists, coverUrl, year
}

interface Album extends AlbumLight {
  vinyls: VinylLight[]  // ← Relation ajoutée
}

// Artist
interface ArtistLight {
  id, name, imageUrl
}

interface Artist extends ArtistLight {
  spotifyId?: string | null;
  albums: AlbumLight[]  // ← Relation ajoutée
}
```

## Patterns et conventions

### Transformation DB → camelCase

Les données de Supabase (snake_case) sont transformées en camelCase dans les services :
```typescript
private transformVinylData(data: any): Vinyl {
  const artists: ArtistLight[] = (data.vinyl_artists || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((va: any) => ({
      id: va.artist?.id,
      name: va.artist?.name,
      imageUrl: va.artist?.image_url,
    }))
    .filter((artist: ArtistLight) => artist.id && artist.name);

  return {
    id: data.id,
    title: data.title,
    artists: artists,
    coverUrl: data.cover_url,
    // ...
  };
}
```

### Gestion des erreurs

Utiliser les exceptions NestJS :
```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';

if (!album) {
  throw new NotFoundException('Album not found');
}

if (exists) {
  throw new BadRequestException('Already exists');
}
```

### Validation avec DTOs

Les DTOs utilisent `class-validator` pour la validation automatique :
```typescript
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username?: string;

  @IsString()
  @MaxLength(200)
  bio?: string;
}
```

### Pagination cursor-based

Pour les listes avec pagination infinie :
```typescript
let query = supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(limit);

if (lastCreatedAt) {
  query = query.lt('created_at', lastCreatedAt);
}
```

Frontend utilise `lastCreatedAt` du dernier item pour charger la page suivante.

### Pagination offset-based

Pour la recherche (albums, artistes) :
```typescript
const { data, error } = await supabase
  .from('albums')
  .select('*')
  .ilike('title', searchTerm)
  .order('title', { ascending: true })
  .range(offset, offset + limit - 1);
```

Frontend utilise `offset` incrémental (0, 20, 40...).

### Gestion des actions dérivées

Les actions dérivées (notifications, posts automatiques) sont gérées de manière asynchrone et non-bloquante :
```typescript
// Exemple : PostLikesService
async likePost(userId: string, postId: string): Promise<void> {
  // 1. Action principale (bloquante)
  await this.createLike(userId, postId);
  
  // 2. Action dérivée (async, non-bloquante)
  this.createLikeNotification(userId, postId);
}

private async createLikeNotification(userId: string, postId: string): Promise<void> {
  try {
    const post = await this.getPost(postId);
    if (userId === post.userId) return; // Pas de self-notification
    
    await this.notificationsService.createNotification(
      post.userId,
      'post_like',
      userId,
      postId
    );
  } catch (error) {
    this.logger.error('Failed to create notification', error);
    // Ne pas faire échouer le like
  }
}
```

**Principes** :
- ✅ Actions principales = synchrones et bloquantes
- ✅ Actions dérivées = asynchrones et non-bloquantes
- ✅ Logging des erreurs sur actions dérivées
- ✅ Ne jamais faire échouer l'action principale

### Injection de dépendances entre services

Les services utilisent l'injection de dépendances NestJS pour communiquer :
```typescript
// post-likes.service.ts
@Injectable()
export class PostLikesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}
}
```

### Ordre des routes dans les controllers

⚠️ **Critique** : Les routes spécifiques doivent être AVANT les routes génériques :

```typescript
@Controller('albums')
export class AlbumsController {
  // ✅ CORRECT : /search AVANT /:id
  @Get('search')
  async search() { ... }

  @Get(':id')
  async getById() { ... }
}

// ❌ INCORRECT : /:id AVANT /search
// NestJS interprèterait "search" comme un ID !
```

## Points d'attention

1. **SUPABASE_ANON_KEY** : Ne pas utiliser service_role, le backend a besoin de l'auth JWT
2. **Fastify vs Express** : Ce projet utilise Fastify (plus performant)
3. **Validation globale** : Les erreurs de validation retournent des messages génériques
4. **JWT Supabase** : Toujours vérifier via `supabase.auth.getUser(token)`
5. **CORS** : Mettre à jour l'origin en production
6. **Types partagés** : Ne jamais dupliquer, toujours importer depuis `@fillcrate/shared`
7. **Pagination** : Cursor-based pour posts, offset-based pour recherche
8. **Logique métier** : Dans les services NestJS, pas dans les triggers SQL
9. **Actions dérivées** : Toujours asynchrones et non-bloquantes
10. **userId du JWT** : Jamais dans les params/body, toujours via `@CurrentUser()`
11. **Ordre des routes** : `/search` AVANT `/:id`
12. **Pattern Light/Complet** : `findById()` retourne complet, `searchXxx()` retourne Light

## Déploiement

### Railway

Le projet est configuré pour Railway avec `railway.toml` et `nixpacks.toml`.

Variables d'environnement à configurer :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (pas service_role !)
- `PORT` (3001 recommandé)
- `FRONTEND_URL` (URL Vercel en prod)
- `NODE_ENV=production`

## Décisions architecturales

### Pourquoi ANON_KEY et pas SERVICE_ROLE ?

**ANON_KEY permet** :
- ✅ Valider les JWT Supabase (AuthGuard)
- ✅ RLS fonctionnel si besoin
- ✅ Sécurité via guards et logique métier
- ✅ Traçabilité des actions utilisateur

**SERVICE_ROLE serait nécessaire pour** :
- ❌ Bypasser complètement RLS (pas notre besoin)
- ❌ Actions admin sans contexte utilisateur (pas notre cas)

### Pourquoi la logique est dans les services ?

**Avantages** :
- ✅ Testabilité unitaire
- ✅ Visibilité et documentation du code
- ✅ Flexibilité (throttling, préférences, etc.)
- ✅ Gestion d'erreur et monitoring
- ✅ API centralisée pour web + mobile

**Triggers SQL** :
- ✅ Seulement pour housekeeping (`updated_at`)

### Pourquoi le pattern Light/Complet ?

**Problème** :
- Recherche de 20 albums avec tous les vinyles = 21+ requêtes
- Trop de données transférées
- UX lente

**Solution** :
- `searchAlbums()` → `AlbumLight[]` (sans vinyles) = 1 requête
- `findById()` → `Album` (avec vinyles) = 2 requêtes
- Recherche 20x plus rapide, 4x moins de données

## Fonctionnalités futures

- [ ] WebSocket avec Socket.IO pour realtime complet
- [ ] Rate limiting par utilisateur
- [ ] Cache Redis pour requêtes fréquentes
- [ ] Image upload/resize pour avatars
- [ ] Analytics et metrics (Prometheus)
- [ ] Groupement de notifications (throttling)

---

**Dernière mise à jour** : 5 février 2026