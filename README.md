# FillCrate - Réseau social pour passionnés de vinyles

Monorepo pour FillCrate : gestion de collection vinyle, feed social, follows, likes, commentaires, notifications temps réel.

## Stack technique

- **Web** : React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend** : NestJS + Fastify + Socket.IO + Redis
- **Database** : Supabase (PostgreSQL + Auth + Storage)
- **Shared** : Types TypeScript partagés

## Structure
```
fillcrate/
├── packages/
│   ├── shared/          # Types partagés (@fillcrate/shared)
│   ├── backend/         # API NestJS + Socket.IO
│   └── web/        # React app
├── pnpm-workspace.yaml
└── package.json
```

## Installation rapide
```bash
# Cloner et installer
git clone <repo>
cd fillcrate
pnpm install

# Configurer .env dans backend/ et web/

# Lancer en dev (web + backend)
pnpm dev
```

## Architecture clé

### Authentification
1. Web → Supabase Auth (signup/login) → JWT
2. Backend valide JWT via `AuthGuard` + récupère `userId`
3. Tous les endpoints protégés : `userId` auto-extrait du JWT

### Temps réel (Socket.IO)
- ✅ **Notifications** : Temps réel via Socket.IO
  - `notification:new` (like, comment, follow)
  - `notification:deleted` (unlike, uncomment, unfollow)
  - `notification:read-all`
- ❌ **Likes/Comments** : Optimistic UI + refresh après action

### Pattern API
```typescript
// ❌ AVANT (avec userId explicite)
await likePost(userId, postId)

// ✅ MAINTENANT (userId du JWT)
await likePost(postId)
```

## Scripts
```bash
pnpm dev              # Lancer web + backend
pnpm dev:web          # Web seul (port 5173)
pnpm dev:backend      # Backend seul (port 3001)
pnpm build            # Build tous les packages
pnpm build:shared     # Build types partagés
```

## Variables d'environnement

**Backend** (`packages/backend/.env`) :
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
JWT_SECRET=xxx
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
NODE_ENV=development
```

**Web** (`packages/web/.env`) :
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=http://localhost:3001
```

## Base de données (Supabase)

**Tables principales** :
- `users`, `artists`, `albums`, `vinyls`
- `user_vinyls` (collections/wishlists)
- `posts`, `post_likes`, `comments`, `follows`, `notifications`

**RLS (Row Level Security)** :
- Web utilise Supabase avec RLS actif
- Backend utilise token user pour respecter RLS

## Déploiement

**Web (Vercel)** :
- Framework : Vite
- Variables : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

**Backend (Railway)** :
- Runtime : Node.js
- Variables : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET`, `REDIS_URL`, `PORT`

## Troubleshooting

**Types partagés non reconnus** :
```bash
pnpm build:shared && pnpm install
```

**Port déjà utilisé** : Changer dans `.env`

**401 Unauthorized** : Vérifier JWT Supabase + `SUPABASE_ANON_KEY` backend

---

**Dernière mise à jour** : Février 2026