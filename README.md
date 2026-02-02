# FillCrate Monorepo

Monorepo pour l'application FillCrate - Réseau social pour passionnés de vinyles.

## Structure

```
fillcrate/
├── packages/
│   ├── shared/      # Types partagés entre tous les projets
│   ├── backend/     # API NestJS
│   ├── web/         # Frontend React/Vite
│   └── mobile/      # Future app React Native
```

## Prérequis

- Node.js >= 18
- pnpm >= 8 (installer avec `npm install -g pnpm`)

## Installation

```bash
# Installer toutes les dépendances
pnpm install
```

## Développement

```bash
# Lancer backend + web en parallèle
pnpm dev

# Lancer uniquement le backend
pnpm dev:backend

# Lancer uniquement le frontend
pnpm dev:web
```

## Build

```bash
# Build tous les packages
pnpm build

# Build un package spécifique
pnpm build:shared
pnpm build:backend
pnpm build:web
```

## Structure des packages

### @fillcrate/shared

Types TypeScript partagés entre tous les projets. C'est la single source of truth pour les contrats de données.

### @fillcrate/backend

API NestJS avec Fastify, Supabase et TypeScript.

### @fillcrate/web

Frontend React avec TypeScript, Vite, Tailwind CSS et Zustand.

## Scripts utiles

```bash
pnpm clean              # Nettoyer tous les builds
pnpm install:all        # Réinstaller toutes les dépendances
```

## Utilisation des types partagés

```typescript
// Dans n'importe quel package
import { Album, Vinyl, User } from '@fillcrate/shared';
```