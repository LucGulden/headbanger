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

### Logique métier et actions dérivées

**Architecture basée sur les services** : Toute la logique métier est gérée dans les services NestJS, pas dans des triggers SQL. Cela permet :
- ✅ **Testabilité** : Chaque comportement est testable unitairement
- ✅ **Visibilité** : La logique est explicite dans le code
- ✅ **Flexibilité** : Facile d'ajouter des conditions, du throttling, des préférences utilisateur
- ✅ **Débogage** : Logs, gestion d'erreur, monitoring

**Actions dérivées automatiques** :
- **Notifications** : Créées/supprimées automatiquement par les services lors des interactions sociales
- **Posts automatiques** : Créés lors de l'ajout d'un vinyl en collection/wishlist
- **Logging asynchrone** : Les actions non-critiques ne bloquent pas les opérations principales

**Trigger SQL restant** :
- `update_users_updated_at` : Mise à jour automatique du champ `updated_at` (housekeeping)

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
pnpm lint:fix
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
| `POST` | `/user-vinyls` | ✅ | Ajoute un vinyl (body: vinylId, type) + crée post automatiquement |
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
| `POST` | `/follows/:userId` | ✅ | Suivre un utilisateur + notification automatique |
| `DELETE` | `/follows/:userId` | ✅ | Ne plus suivre + supprime notification |
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
| `POST` | `/post-likes/:postId` | ✅ | Like un post + notification automatique |
| `DELETE` | `/post-likes/:postId` | ✅ | Unlike un post + supprime notification |
| `GET` | `/post-likes/check/:postId` | ✅ | Vérifie si on a liké |
| `GET` | `/post-likes/count/:postId` | Public | Nombre de likes |

### Comments

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/comments/post/:postId` | Public | Liste des commentaires d'un post |
| `GET` | `/comments/post/:postId/count` | Public | Nombre de commentaires |
| `POST` | `/comments` | ✅ | Ajoute un commentaire (body: postId, content) + notification automatique |
| `DELETE` | `/comments/:id` | ✅ | Supprime un commentaire + supprime notification |

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

### Gestion des notifications et actions dérivées

Les actions dérivées (notifications, posts automatiques) sont gérées dans les services de manière asynchrone et non-bloquante :
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
    // Récupérer l'auteur du post
    const post = await this.getPost(postId);
    
    // Ne pas notifier si on like son propre post
    if (userId === post.userId) return;
    
    // Créer la notification
    await this.notificationsService.createNotification(
      post.userId,
      'post_like',
      userId,
      postId
    );
  } catch (error) {
    this.logger.error('Failed to create notification', error);
    // Ne pas faire échouer le like si la notification échoue
  }
}
```

**Principes** :
- ✅ Actions principales = synchrones et bloquantes
- ✅ Actions dérivées = asynchrones et non-bloquantes
- ✅ Logging des erreurs sur actions dérivées
- ✅ Ne jamais faire échouer l'action principale si l'action dérivée échoue

### Injection de dépendances entre services

Les services utilisent l'injection de dépendances NestJS pour communiquer :
```typescript
// post-likes.service.ts
@Injectable()
export class PostLikesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService, // Injection
  ) {}
}
```

**Modules à configurer** :
```typescript
// post-likes.module.ts
@Module({
  imports: [NotificationsModule], // Importer le module
  providers: [PostLikesService],
  exports: [PostLikesService],
})
export class PostLikesModule {}

// notifications.module.ts
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService], // Exporter le service
})
export class NotificationsModule {}
```

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
9. **Logique métier** : Toujours dans les services NestJS, jamais dans des triggers SQL (sauf housekeeping automatique)
10. **Actions dérivées** : Toujours asynchrones et non-bloquantes pour ne pas impacter l'action principale
11. **Notifications** : Gérées automatiquement par les services lors des interactions sociales
12. **Posts automatiques** : Créés automatiquement lors de l'ajout d'un vinyl en collection/wishlist

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
- ✅ Logique métier dans les services, pas dans les triggers SQL
- ✅ Actions dérivées asynchrones et non-bloquantes
- ✅ Injection de dépendances pour communication inter-services

## Décisions architecturales

### Pourquoi la logique est dans les services et pas dans les triggers SQL ?

**Avantages de la logique dans les services** :
- ✅ **Testabilité** : Chaque comportement peut être testé unitairement
- ✅ **Visibilité** : La logique métier est explicite et documentée dans le code
- ✅ **Flexibilité** : Facile d'ajouter des conditions (préférences utilisateur, throttling, etc.)
- ✅ **Gestion d'erreur** : Logs détaillés, retry, monitoring
- ✅ **Évolutivité** : Ajout facile de webhooks, emails, push notifications
- ✅ **API centralisée** : Logique partagée pour web + mobile + futures plateformes

**Quand utiliser des triggers SQL** :
- ✅ Housekeeping automatique (`updated_at`, `created_at`)
- ✅ Contraintes de données strictes
- ✅ Cascades de suppression (safety net)

**Triggers SQL actuels** :
- `update_users_updated_at` : Mise à jour automatique du timestamp `updated_at`

## Fonctionnalités futures

- [ ] WebSocket avec Socket.IO pour realtime (likes, comments, notifications)
- [ ] Rate limiting par utilisateur
- [ ] Cache Redis pour les requêtes fréquentes
- [ ] Image upload/resize pour avatars
- [ ] Recherche full-text avec ElasticSearch
- [ ] Analytics et metrics (Prometheus)
- [ ] Groupement de notifications (throttling)
- [ ] Préférences utilisateur pour notifications

### Gestion des posts et vinyles

**Règle importante** : Les posts ne sont jamais supprimés automatiquement, même si le vinyl est retiré de la collection/wishlist.

**Pourquoi ?**
- Les posts sont des **événements historiques** (journal d'activité), pas des **états actuels**
- Les likes et commentaires associés sont préservés
- La timeline reste cohérente

**Cas d'usage** :
- Retirer un vinyl → Le post reste visible
- Déplacer wishlist → collection → 2 posts (wishlist_add + collection_add)
- Racheter un vinyl vendu → Nouveau post, l'ancien reste visible

**Pour supprimer un post** : L'utilisateur doit utiliser l'endpoint `DELETE /posts/:id` manuellement.
---

**Dernière mise à jour** : 2 février 2026