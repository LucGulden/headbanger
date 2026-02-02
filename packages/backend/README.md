# FillCrate Backend - API NestJS

## Vue d'ensemble

API REST pour FillCrate, réseau social pour passionnés de vinyles. Backend NestJS avec Fastify, TypeScript et Supabase.

**Stack** : NestJS + Fastify + TypeScript + Supabase + Class Validator

## Structure du projet

```
src/
├── albums/              # Module Albums
│   ├── albums.controller.ts
│   ├── albums.service.ts
│   └── albums.module.ts
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

| Module | Endpoints | Description |
|--------|-----------|-------------|
| `AlbumsModule` | `GET /albums/:id` | Récupération d'albums avec artistes |
| `AppController` | `GET /health` | Healthcheck pour Railway/monitoring |

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

### Public

| Méthode | Route | Description | Réponse |
|---------|-------|-------------|---------|
| `GET` | `/health` | Healthcheck | `{ status: 'ok', timestamp: '...' }` |
| `GET` | `/albums/:id` | Récupère un album avec artistes | `Album` |

### Protégés (require `@UseGuards(AuthGuard)`)

Aucun endpoint protégé pour le moment. Pour protéger un endpoint :

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('protected')
export class ProtectedController {
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return { userId: user.id, email: user.email };
  }
}
```

## Types partagés

Les types sont importés depuis `@fillcrate/shared` :

```typescript
import { Album } from '@fillcrate/shared';
```

Pour ajouter un nouveau type, l'ajouter dans `packages/shared/src/types/index.ts`.

## Patterns et conventions

### Transformation DB → camelCase

Les données de Supabase (snake_case) sont transformées en camelCase dans les services :

```typescript
private transformAlbumData(data: any): Album {
  const artists = data.album_artists
    .sort((a, b) => a.position - b.position)
    .map((aa) => aa.artists.name)
    .join(', ');

  return {
    id: data.id,
    spotifyId: data.spotify_id,  // snake_case → camelCase
    title: data.title,
    artist: artists,
    coverUrl: data.cover_url,    // snake_case → camelCase
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
```

### Validation

Les DTOs utilisent `class-validator` pour la validation automatique :

```typescript
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  artistId: string;
}
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

---

**Dernière mise à jour** : 2 février 2026