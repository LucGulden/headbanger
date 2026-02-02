# FillCrate - Réseau social pour passionnés de vinyles

Monorepo pour FillCrate, application web permettant aux passionnés de vinyles de gérer leur collection, découvrir de nouveaux albums et interagir avec une communauté.

## Vue d'ensemble

FillCrate est organisé en monorepo avec trois packages :

- **`@fillcrate/web`** : Frontend React avec TypeScript, Vite et Tailwind CSS
- **`@fillcrate/backend`** : API REST NestJS avec Fastify et Supabase
- **`@fillcrate/shared`** : Types TypeScript partagés entre tous les projets

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
│   │   ├── package.json
│   │   └── README.md
│   └── web/                 # Frontend React
│       ├── src/
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
SUPABASE_ANON_KEY=ta-anon-key
PORT=3001
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

## Architecture

### @fillcrate/shared

Package de types TypeScript partagés entre frontend et backend. C'est la **single source of truth** pour tous les contrats de données.

**Types disponibles** :
- `Album` : Structure d'un album avec artistes
- *(À ajouter progressivement : Vinyl, User, Post, etc.)*

**Utilisation** :
```typescript
import { Album } from '@fillcrate/shared';
```

### @fillcrate/backend

API REST NestJS avec Fastify. Expose des endpoints pour gérer albums, vinyles, utilisateurs, posts, etc.

**Endpoints disponibles** :
- `GET /health` : Healthcheck
- `GET /albums/:id` : Récupérer un album avec artistes

**Documentation complète** : [`packages/backend/README.md`](packages/backend/README.md)

### @fillcrate/web

Application React avec Vite, TypeScript, Tailwind CSS et Zustand. Interface utilisateur pour gérer collections, découvrir albums et interagir avec la communauté.

**Features** :
- Gestion collection/wishlist
- Feed social avec posts, likes, commentaires
- Recherche d'albums (Spotify/MusicBrainz)
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

### Connecter frontend au backend

```typescript
// packages/web/src/lib/api/albums.ts
export async function getAlbum(id: string): Promise<Album> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/albums/${id}`);
  if (!response.ok) throw new Error('Failed to fetch album');
  return response.json();
}
```

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

## Déploiement

### Frontend (Vercel)

- Framework : Vite
- Build command : Géré par `vercel.json`
- Variables d'env : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

### Backend (Railway)

- Builder : Nixpacks
- Build command : Géré par `railway.toml` et `nixpacks.toml`
- Variables d'env : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PORT`, `FRONTEND_URL`, `NODE_ENV`

### Migration Turborepo (optionnel)

Pour optimiser les builds et déploiements séparés, installer Turborepo :

```bash
pnpm add -Dw turbo
```

Voir la documentation Turborepo pour la configuration complète.

## Structure Git

```bash
# Un seul repository Git à la racine
fillcrate/
├── .git/
├── .gitignore
└── packages/
    ├── shared/
    ├── backend/
    └── web/
```

## Troubleshooting

### "Cannot find module @fillcrate/shared"

```bash
# Builder shared et réinstaller
pnpm build:shared
pnpm install
```

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

**Dernière mise à jour** : 2 février 2026