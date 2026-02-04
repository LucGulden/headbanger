# FillCrate - Réseau social pour passionnés de vinyles

Monorepo pour FillCrate, application web permettant aux passionnés de vinyles de gérer leur collection, découvrir de nouveaux albums et interagir avec une communauté.

## Vue d'ensemble

FillCrate est organisé en monorepo avec trois packages :

- **`@fillcrate/web`** : Frontend React avec TypeScript, Vite et Tailwind CSS
- **`@fillcrate/backend`** : API REST NestJS avec Fastify et Supabase
- **`@fillcrate/shared`** : Types TypeScript partagés entre tous les projets

## Architecture

### Approche hybride Backend + Supabase

FillCrate utilise une architecture hybride qui combine le meilleur des deux mondes :

**Backend NestJS (API REST)** :
- Logique métier centralisée (posts, likes, comments, follows, notifications)
- Validation et autorisation (JWT Supabase vérifié par AuthGuard)
- Endpoints propres pour frontend web + future app mobile
- Transformations de données (snake_case DB → camelCase API)

**Supabase direct** :
- Realtime (likes, comments, notifications via WebSocket)
- Storage (avatars, covers avec policies RLS)
- Recherche avancée (albums, artistes, utilisateurs)
- Certaines mutations de données (création albums/vinyles)

**Authentification** :
- Supabase Auth génère les JWT
- Frontend envoie JWT dans headers `Authorization: Bearer <token>`
- Backend valide JWT via `AuthGuard` et récupère `userId` automatiquement
- Pas de `userId` dans les appels API protégés (récupéré du JWT)

## Structure du monorepo
```
fillcrate/
├── packages/
│   ├── shared/              # Types partagés
│   │   ├── src/
│   │   │   └── types/
│   │   │       └── index.ts
│   │   └── package.json
│   ├── backend/             # API NestJS
│   │   ├── src/
│   │   │   ├── albums/
│   │   │   ├── artists/
│   │   │   ├── vinyls/
│   │   │   ├── user-vinyls/
│   │   │   ├── users/
│   │   │   ├── follows/
│   │   │   ├── posts/
│   │   │   ├── post-likes/
│   │   │   ├── comments/
│   │   │   ├── notifications/
│   │   │   └── common/
│   │   │       ├── database/
│   │   │       ├── guards/
│   │   │       └── decorators/
│   │   ├── package.json
│   │   └── README.md
│   └── web/                 # Frontend React
│       ├── src/
│       │   ├── lib/
│       │   │   └── api/    # Services API centralisés
│       │   │       ├── apiClient.ts
│       │   │       ├── posts.ts
│       │   │       ├── postLikes.ts
│       │   │       ├── comments.ts
│       │   │       ├── notifications.ts
│       │   │       ├── follows.ts
│       │   │       ├── albums.ts
│       │   │       ├── vinyls.ts
│       │   │       ├── artists.ts
│       │   │       ├── userVinyls.ts
│       │   │       └── users.ts
│       │   ├── components/
│       │   ├── pages/
│       │   └── stores/
│       ├── package.json
│       └── README.md
├── package.json             # Root avec workspaces
├── pnpm-workspace.yaml
└── README.md
```

## Prérequis

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (installer avec `npm install -g pnpm`)
- **Supabase** : Projet configuré avec les tables nécessaires

## Installation
```bash
# Cloner le repository
git clone https://github.com/ton-username/fillcrate.git
cd fillcrate

# Installer toutes les dépendances
pnpm install

# Configurer les variables d'environnement
# Backend : packages/backend/.env
# Web : packages/web/.env
```

### Configuration des variables d'environnement

**`packages/backend/.env`** :
```bash
SUPABASE_URL=https://ton-projet.supabase.co
SUPABASE_ANON_KEY=ta-anon-key  # Pas service_role !
PORT=3001
NODE_ENV=development
```

**`packages/web/.env`** :
```bash
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta-anon-key
VITE_API_URL=http://localhost:3001
```

## Scripts disponibles

### Développement
```bash
# Lancer frontend + backend en parallèle
pnpm dev

# Lancer uniquement le frontend (http://localhost:5173)
pnpm dev:web

# Lancer uniquement le backend (http://localhost:3001)
pnpm dev:backend
```

### Build
```bash
# Builder tous les packages
pnpm build

# Builder un package spécifique
pnpm build:shared      # Types partagés
pnpm build:web         # Frontend
pnpm build:backend     # Backend
```

### Autres commandes
```bash
# Nettoyer tous les builds et node_modules
pnpm clean

# Réinstaller toutes les dépendances
pnpm install:all
```

## Architecture détaillée

### @fillcrate/shared

Package de types TypeScript partagés entre frontend et backend. C'est la **single source of truth** pour tous les contrats de données.

**Types disponibles** :
- `Album`, `AlbumLight` : Structures d'albums avec artistes
- `Vinyl` : Pressages vinyles avec artistes
- `Artist`, `ArtistLight` : Artistes musicaux
- `User`, `UserLight` : Utilisateurs et profils
- `UserVinyl` : Relations user-vinyl (collection/wishlist)
- `PostWithDetails` : Posts sociaux avec détails
- `Comment` : Commentaires
- `Notification` : Notifications
- `FollowStats`, `VinylStats` : Statistiques

**Utilisation** :
```typescript
import { Album, User, PostWithDetails } from '@fillcrate/shared';
```

### @fillcrate/backend

API REST NestJS avec Fastify. Centralise la logique métier et expose des endpoints pour gérer albums, vinyles, utilisateurs, posts, etc.

**Modules disponibles** :
- Albums, Artists, Vinyls
- UserVinyls (collections/wishlists)
- Users (profils)
- Follows (relations sociales)
- Posts, PostLikes, Comments
- Notifications

**Authentification** :
- Valide JWT Supabase via `AuthGuard`
- Récupère automatiquement `userId` du token
- `@CurrentUser()` decorator pour accéder à l'utilisateur authentifié

**Documentation complète** : [`packages/backend/README.md`](packages/backend/README.md)

### @fillcrate/web

Application React avec Vite, TypeScript, Tailwind CSS et Zustand. Interface utilisateur pour gérer collections, découvrir albums et interagir avec la communauté.

**Architecture API frontend** :
```
src/lib/api/
├── apiClient.ts      # Client HTTP centralisé avec JWT auto
├── posts.ts          # Endpoints posts
├── postLikes.ts      # Endpoints likes
├── comments.ts       # Endpoints commentaires
├── notifications.ts  # Endpoints notifications
├── follows.ts        # Endpoints follows
├── albums.ts         # Endpoints albums
├── vinyls.ts         # Endpoints vinyls
├── artists.ts        # Endpoints artistes
├── userVinyls.ts     # Endpoints collections/wishlists
└── users.ts          # Endpoints profils
```

**Features** :
- Gestion collection/wishlist (via backend)
- Feed social avec posts, likes, commentaires (via backend)
- Realtime pour likes/comments (via Supabase WebSocket)
- Recherche d'albums/artistes/utilisateurs
- Profils utilisateurs
- Notifications temps réel
- Infinite scroll

**Documentation complète** : [`packages/web/README.md`](packages/web/README.md)

## Workflow de développement

### Ajouter un nouveau type

1. Éditer `packages/shared/src/types/index.ts`
2. Exporter le nouveau type
3. Builder shared : `pnpm build:shared`
4. Utiliser le type dans web ou backend :
```typescript
   import { MonNouveauType } from '@fillcrate/shared';
```

### Ajouter un nouveau endpoint backend

1. Créer un nouveau module dans `packages/backend/src/`
2. Créer controller + service + module
3. Importer le module dans `app.module.ts`
4. Utiliser les types depuis `@fillcrate/shared`
5. Créer le service API correspondant dans `packages/web/src/lib/api/`

### Connecter frontend au backend
```typescript
// packages/web/src/lib/api/albums.ts
import { apiClient } from './apiClient'
import type { Album } from '@fillcrate/shared'

export async function getAlbumById(albumId: string): Promise<Album> {
  return apiClient.get<Album>(`/albums/${albumId}`)
}
```

Le `apiClient` gère automatiquement :
- Ajout du JWT dans les headers
- Gestion des erreurs
- Content-Type (uniquement si body présent)

## Technologies

| Package | Technologies |
|---------|-------------|
| **shared** | TypeScript |
| **backend** | NestJS, Fastify, Supabase, TypeScript, Class Validator |
| **web** | React 18, TypeScript, Vite 7, Tailwind CSS, Zustand, Framer Motion, Supabase |

## Base de données

Supabase PostgreSQL avec les tables suivantes :

- `users` : Profils utilisateurs
- `artists` : Artistes musicaux
- `albums` : Albums musicaux
- `vinyls` : Pressages vinyles spécifiques
- `user_vinyls` : Collections et wishlists
- `posts` : Publications sociales
- `post_likes`, `comments`, `follows`, `notifications`

Relations :
- Albums ↔ Artists (many-to-many via `album_artists`)
- Vinyls ↔ Artists (many-to-many via `vinyl_artists`)
- Users ↔ Vinyls (many-to-many via `user_vinyls`)

**Row Level Security (RLS)** :
- Frontend → Supabase : RLS actif 🔒 (Realtime, Storage)
- Backend → Supabase : Sécurité implémentée dans les services

## Déploiement

### Frontend (Vercel)

- Framework : Vite
- Build command : Géré par `vercel.json`
- Variables d'env : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

### Backend (Railway)

- Builder : Nixpacks
- Build command : Géré par `railway.toml` et `nixpacks.toml`
- Variables d'env : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PORT`, `FRONTEND_URL`, `NODE_ENV`

## Troubleshooting

### "Cannot find module @fillcrate/shared"
```bash
# Builder shared et réinstaller
pnpm build:shared
pnpm install
```

### Erreur 401 sur les endpoints backend

Vérifier que :
- Le JWT Supabase est valide
- `apiClient` récupère bien le token via `supabase.auth.getSession()`
- Le backend utilise bien `SUPABASE_ANON_KEY` (pas service_role)

### Port déjà utilisé

Changer les ports dans les fichiers `.env` respectifs.

### Erreurs TypeScript
```bash
# Redémarrer le serveur TypeScript dans VSCode
Ctrl+Shift+P > TypeScript: Restart TS Server
```

### Dépendances manquantes
```bash
# Nettoyer et réinstaller
pnpm clean
pnpm install
```

## Contribution

1. Créer une branche depuis `main`
2. Développer la feature
3. Tester localement : `pnpm dev`
4. Builder pour vérifier : `pnpm build`
5. Commit et push
6. Ouvrir une Pull Request

## Ressources

- [Documentation NestJS](https://docs.nestjs.com/)
- [Documentation React](https://react.dev/)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation pnpm Workspaces](https://pnpm.io/workspaces)
- [Documentation Vite](https://vitejs.dev/)

## Licence

Privé - Tous droits réservés

---

**Dernière mise à jour** : 4 février 2026