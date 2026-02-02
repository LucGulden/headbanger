# FillCrate Backend - API NestJS

## Vue d'ensemble

API REST pour FillCrate, réseau social pour passionnés de vinyles. Backend NestJS avec Fastify, TypeScript et Supabase.

**Stack** : NestJS + Fastify + TypeScript + Supabase + Class Validator

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

## Architecture

### Modules

Chaque fonctionnalité est organisée en module NestJS (controller + service + module).

| Module | Description |
|--------|-------------|
| `AlbumsModule` | Gestion des albums (métadonnées musicales) |
| `ArtistsModule` | Gestion des artistes (recherche, récupération) |
| `VinylsModule` | Gestion des vinyles (pressings physiques) |
| `UserVinylsModule` | Collections et wishlists des utilisateurs |
| `UsersModule` | Profils utilisateurs (CRUD, recherche) |
| `FollowsModule` | Relations sociales (follow/unfollow) |
| `PostsModule` | Posts sociaux (feed global et profil) |
| `PostLikesModule` | Likes sur les posts |
| `CommentsModule` | Commentaires sur les posts |
| `NotificationsModule` | Système de notifications |

### Services centralisés

| Service | Rôle |
|---------|------|
| `SupabaseService` | Client Supabase centralisé, gère l'auth JWT + RLS |

### Guards

| Guard | Rôle |
|-------|------|
| `AuthGuard` | Valide le JWT Supabase, à utiliser avec `@UseGuards(AuthGuard)` |

### Decorators

| Decorator | Rôle |
|-----------|------|
| `@CurrentUser()` | Récupère l'utilisateur authentifié dans un controller |

## Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine de `packages/backend/` :
```bash
# Supabase
SUPABASE_URL=https://ton-projet.supabase.co
SUPABASE_ANON_KEY=ta-anon-key

# Server
PORT=3001
NODE_ENV=development

# CORS (optionnel, pour prod)
FRONTEND_URL=http://localhost:5173
```

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
```

## Endpoints

### Albums

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/albums/:id` | Public | Récupère un album avec artistes |

### Artists

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/artists/:id` | Public | Récupère un artiste par ID |
| `GET` | `/artists?query=...&limit=...&offset=...` | Public | Recherche d'artistes |

### Vinyls

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/vinyls/:id` | Public | Récupère un vinyl avec artistes |

### UserVinyls (Collections/Wishlists)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/user-vinyls?type=...&limit=...&lastAddedAt=...` | ✅ | Liste des vinyles de l'utilisateur |
| `GET` | `/user-vinyls/count?type=...` | ✅ | Compte total de vinyles |
| `GET` | `/user-vinyls/stats` | ✅ | Statistiques (collection + wishlist) |
| `GET` | `/user-vinyls/check/:vinylId?type=...` | ✅ | Vérifie si vinyl dans collection/wishlist |
| `POST` | `/user-vinyls` | ✅ | Ajoute un vinyl (body: vinylId, type) |
| `DELETE` | `/user-vinyls/:vinylId?type=...` | ✅ | Retire un vinyl |
| `POST` | `/user-vinyls/:vinylId/move-to-collection` | ✅ | Déplace de wishlist → collection |

### Users (Profils)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/users/me` | ✅ | Profil de l'utilisateur connecté |
| `PUT` | `/users/me` | ✅ | Mise à jour du profil |
| `GET` | `/users/:uid` | Public | Profil par UID |
| `GET` | `/users/username/:username` | Public | Profil par username |
| `GET` | `/users/search?query=...&limit=...&offset=...` | Public | Recherche d'utilisateurs |
| `GET` | `/users/check-username?username=...` | Public | Vérifie disponibilité username |

### Follows (Relations sociales)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/follows/stats/:userId` | Public | Statistiques follow (followers/following count) |
| `GET` | `/follows/check/:userId` | ✅ | Vérifie si on suit un utilisateur |
| `POST` | `/follows/:userId` | ✅ | Suivre un utilisateur |
| `DELETE` | `/follows/:userId` | ✅ | Ne plus suivre |
| `GET` | `/follows/followers/:userId` | Public | Liste des followers |
| `GET` | `/follows/following/:userId` | Public | Liste des following |

### Posts (Feed social)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/posts/feed?userId=...&profileFeed=...&limit=...&lastCreatedAt=...` | ✅ | Feed (global ou profil) |
| `GET` | `/posts/:id` | Public | Post par ID |
| `POST` | `/posts` | ✅ | Crée un post (body: vinylId, type) |
| `DELETE` | `/posts/:id` | ✅ | Supprime un post |

### PostLikes

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST` | `/post-likes/:postId` | ✅ | Like un post |
| `DELETE` | `/post-likes/:postId` | ✅ | Unlike un post |
| `GET` | `/post-likes/check/:postId` | ✅ | Vérifie si on a liké |
| `GET` | `/post-likes/count/:postId` | Public | Nombre de likes |

### Comments

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/comments/post/:postId` | Public | Liste des commentaires d'un post |
| `GET` | `/comments/post/:postId/count` | Public | Nombre de commentaires |
| `POST` | `/comments` | ✅ | Ajoute un commentaire (body: postId, content) |
| `DELETE` | `/comments/:id` | ✅ | Supprime un commentaire |

### Notifications

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/notifications?limit=...&lastCreatedAt=...` | ✅ | Liste des notifications |
| `GET` | `/notifications/unread-count` | ✅ | Nombre de non lues |
| `PUT` | `/notifications/mark-all-read` | ✅ | Marque toutes comme lues |
| `PUT` | `/notifications/:id/read` | ✅ | Marque une notification comme lue |

### Healthcheck

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/health` | Public | Healthcheck pour monitoring |

## Types partagés

Les types sont importés depuis `@fillcrate/shared` :
```typescript
import { 
  Album, 
  Artist, 
  ArtistLight, 
  Vinyl, 
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

Pour ajouter un nouveau type, l'ajouter dans `packages/shared/src/types/index.ts`.

### Types principaux

| Type | Description |
|------|-------------|
| `Album` | Album complet avec artistes |
| `Artist` | Artiste complet |
| `ArtistLight` | Artiste minimal (id, name, imageUrl) |
| `Vinyl` | Vinyl avec artistes (array) |
| `User` | Utilisateur complet |
| `UserLight` | Utilisateur minimal (uid, username, photoUrl) |
| `UserVinyl` | Relation user-vinyl avec vinyl complet |
| `AlbumLight` | Album minimal (id, title, artists, coverUrl) |
| `PostWithDetails` | Post avec user, album, likes/comments count |
| `Comment` | Commentaire avec user |
| `Notification` | Notification avec actor, post, comment |
| `FollowStats` | Statistiques follow (followersCount, followingCount) |
| `VinylStats` | Statistiques vinyl (collectionCount, wishlistCount) |

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
    year: data.year,
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

## Supabase RLS

Le backend utilise `SUPABASE_ANON_KEY` + JWT user pour respecter les Row Level Security policies.

### Mode anonyme (requêtes publiques)
```typescript
const supabase = this.supabaseService.getClient();
const { data } = await supabase.from('albums').select('*');
```

### Mode authentifié (requêtes avec RLS)
```typescript
@UseGuards(AuthGuard)
@Get('my-data')
myData(@CurrentUser() user: AuthenticatedUser) {
  const supabase = this.supabaseService.getClientWithAuth(user.token);
  const { data } = await supabase.from('user_data').select('*');
  // RLS policies s'appliquent avec le token user
}
```

## Points d'attention

1. **Fastify vs Express** : Ce projet utilise Fastify (plus performant), adapter les middlewares si nécessaire
2. **Validation globale** : Les erreurs de validation retournent des messages génériques au client, logs détaillés côté serveur
3. **JWT Supabase** : Toujours vérifier via `supabase.auth.getUser(token)`, ne pas parser manuellement
4. **CORS** : Mettre à jour l'origin en production
5. **Healthcheck** : Railway/Render utilisent `/health` pour vérifier que l'app est up
6. **Types partagés** : Ne jamais dupliquer les types, toujours importer depuis `@fillcrate/shared`
7. **Artistes** : Toujours triés par `position` avant affichage (pour collaborations)
8. **Pagination** : Utiliser cursor-based avec `lastCreatedAt` ou `lastAddedAt` pour infinite scroll

## Déploiement

### Railway

Le projet est configuré pour Railway avec `railway.toml` et `nixpacks.toml`.

Variables d'environnement à configurer :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `PORT` (3001 recommandé)
- `FRONTEND_URL` (URL Vercel en prod)
- `NODE_ENV=production`

### Render

Build command : `cd ../.. && pnpm install && pnpm build:backend`  
Start command : `cd packages/backend && node dist/main.js`

## Style d'interaction préféré

- ✅ Un module = un dossier (controller + service + module)
- ✅ Services pour la logique métier, controllers minimalistes
- ✅ Transformation DB → camelCase dans les services
- ✅ Imports depuis `@fillcrate/shared` pour les types
- ✅ DTOs pour validation des inputs
- ✅ Pagination cursor-based pour infinite scroll
- ✅ Types Light (User, Artist, Album) pour optimiser les réponses

## Fonctionnalités futures

- [ ] WebSocket avec Socket.IO pour realtime (likes, comments, notifications)
- [ ] Rate limiting par utilisateur
- [ ] Cache Redis pour les requêtes fréquentes
- [ ] Image upload/resize pour avatars
- [ ] Recherche full-text avec ElasticSearch
- [ ] Analytics et metrics (Prometheus)

---

**Dernière mise à jour** : 2 février 2026