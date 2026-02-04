# FillCrate - Réseau social pour passionnés de vinyles

## Vue d'ensemble

FillCrate est un réseau social pour passionnés de vinyles : gestion de collection/wishlist, feed social, follows, likes, commentaires, notifications, recherche d'albums et utilisateurs, création d'albums (Spotify ou manuel) et de pressages vinyles.

**Stack** : React 18 + TypeScript + Vite 7 + Supabase + NestJS Backend + Tailwind CSS + Framer Motion + Zustand

## Architecture

### Approche hybride : Backend API + Supabase

FillCrate utilise une architecture hybride qui combine le meilleur des deux mondes :

**Backend NestJS (API REST)** :
- Logique métier centralisée (posts, likes, comments, follows, notifications)
- Validation et autorisation (JWT Supabase vérifié par AuthGuard)
- Endpoints propres pour web + future app mobile
- Transformations de données (snake_case DB → camelCase API)
- **Pas de `userId` dans les appels** : récupéré automatiquement du JWT

**Supabase direct** :
- Authentification (signup, login, JWT generation via `useAuth` hook)
- Realtime (likes, comments, notifications via WebSocket)
- Storage (avatars, covers avec policies RLS)
- Recherche avancée (albums, artistes pour certaines fonctions)
- Création albums/vinyles (via RPC functions)

**Flow d'authentification** :
1. `useAuth` hook → Login via Supabase Auth → JWT
2. `apiClient` récupère le JWT via `supabase.auth.getSession()`
3. Ajoute automatiquement `Authorization: Bearer <JWT>` dans les headers
4. Backend valide le JWT et récupère `userId` automatiquement

## Structure du projet
```
src/
├── components/          # Composants UI réutilisables
├── pages/               # Pages de l'application
├── guards/              # Route guards (ProtectedRoute, PublicOnlyRoute, HomeRoute)
├── hooks/               # Hooks personnalisés
│   ├── useAuth.ts       # Auth Supabase (signup, login, logout)
│   ├── useFeedPagination.ts
│   ├── useVinylsPagination.ts
│   ├── useNotifications.ts
│   └── ...
├── lib/
│   ├── api/             # Services API centralisés (Backend NestJS)
│   │   ├── apiClient.ts      # Client HTTP avec JWT auto
│   │   ├── posts.ts          # Endpoints posts
│   │   ├── postLikes.ts      # Endpoints likes
│   │   ├── comments.ts       # Endpoints commentaires
│   │   ├── notifications.ts  # Endpoints notifications
│   │   ├── follows.ts        # Endpoints follows
│   │   ├── albums.ts         # Endpoints albums
│   │   ├── vinyls.ts         # Endpoints vinyls
│   │   ├── artists.ts        # Endpoints artistes
│   │   ├── userVinyls.ts     # Endpoints collections/wishlists
│   │   └── users.ts          # Endpoints profils
│   ├── spotify.ts       # API Spotify direct
│   ├── storage.ts       # Supabase Storage direct
│   └── covers.ts        # Upload covers
├── stores/              # State management Zustand
│   ├── notificationsStore.ts
│   ├── userStore.ts
│   └── vinylStatsStore.ts
├── types/               # Types TypeScript
└── database/            # Migrations SQL
```

## Installation
```bash
# Depuis la racine du monorepo
pnpm install

# Configurer les variables d'environnement
cp .env.example .env
```

### Variables d'environnement

Créer un fichier `.env` à la racine de `packages/web/` :
```bash
# Supabase
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta-anon-key

# Backend API
VITE_API_URL=http://localhost:3001
```

En production (Vercel), configurer ces variables dans les settings du projet.

## Scripts disponibles
```bash
# Développement avec hot reload
pnpm dev

# Build pour production
pnpm build

# Preview du build
pnpm preview

# Linter
pnpm lint
pnpm lint:fix
```

## Architecture API Frontend

### Services API centralisés (`/lib/api`)

Tous les appels au backend NestJS passent par des services typés :

| Service | Description | Auth |
|---------|-------------|------|
| `apiClient.ts` | Client HTTP centralisé avec JWT automatique | - |
| `posts.ts` | Feed global/profil, création, suppression | ✅ |
| `postLikes.ts` | Like/unlike posts, vérification, compteur | ✅ |
| `comments.ts` | CRUD commentaires, compteur | ✅ |
| `notifications.ts` | Liste, compteur non lues, mark as read | ✅ |
| `follows.ts` | Follow/unfollow, listes, statistiques | ✅ |
| `albums.ts` | Récupération albums (+ Supabase direct pour search) | Public |
| `vinyls.ts` | Récupération vinyls (+ Supabase direct pour RPC) | Public |
| `artists.ts` | Récupération/recherche artistes | Public |
| `userVinyls.ts` | Collections/wishlists, ajout, suppression, déplacement | ✅ |
| `users.ts` | Profils, recherche, update profil | ✅/Public |

### apiClient - Client HTTP centralisé

Le `apiClient` gère automatiquement :
- Récupération du JWT via `supabase.auth.getSession()`
- Ajout du header `Authorization: Bearer <token>`
- Ajout de `Content-Type: application/json` seulement si body présent
- Gestion des erreurs HTTP
```typescript
// Exemple d'utilisation
import { apiClient } from './apiClient'

// GET request
const posts = await apiClient.get<PostWithDetails[]>('/posts/feed?limit=20')

// POST request avec body
const post = await apiClient.post<PostWithDetails>('/posts', { 
  vinylId: '123',
  type: 'collection_add'
})

// DELETE request
await apiClient.delete(`/posts/${postId}`)
```

### Pattern d'utilisation

**Avant (ancien pattern Supabase direct)** :
```typescript
// ❌ userId passé en paramètre
await addVinylToUser(userId, vinylId, 'collection')
await likePost(userId, postId)
await followUser(currentUserId, targetUserId)
```

**Après (nouveau pattern API centralisée)** :
```typescript
// ✅ userId récupéré automatiquement du JWT
await addVinylToUser(vinylId, 'collection')
await likePost(postId)
await followUser(targetUserId)
```

**Endpoints publics** (inchangés) :
```typescript
// ✅ Toujours avec userId car public
await getFollowStats(userId)
await getUserByUsername(username)
await getAlbumById(albumId)
```

## State Management

### Architecture Zustand

Trois stores centralisés gèrent l'état global de l'application :

| Store | Localisation | Responsabilité |
|-------|--------------|----------------|
| `notificationsStore` | `/stores/notificationsStore.ts` | Compteur de notifications non lues + subscription temps réel |
| `userStore` | `/stores/userStore.ts` | Données du profil utilisateur connecté (photo, username, bio) |
| `vinylStatsStore` | `/stores/vinylStatsStore.ts` | Compteurs collection/wishlist de l'utilisateur connecté |

### Cycle de vie des stores

**Initialisation** : `App.tsx` initialise tous les stores au login :
```typescript
useEffect(() => {
  if (user) {
    initializeNotifications(user.id)  // ⚠️ userId requis pour Supabase Realtime filter
    initializeUser(user.id)           // ⚠️ Pourrait devenir getCurrentUser() à terme
    initializeVinylStats(user.id)     // ⚠️ Pourrait devenir getVinylStats() à terme
  } else {
    cleanupNotifications()
    cleanupUser()
    cleanupVinylStats()
  }
}, [user])
```

**Mise à jour** : Les composants appellent les actions du store après mutation API :
```typescript
// Ajout en collection
await addVinylToUser(vinylId, 'collection') // Plus besoin de userId
incrementCollection()

// Déplacement wishlist → collection
await moveToCollection(vinylId) // Plus besoin de userId
decrementWishlist()
incrementCollection()

// Modification du profil
await updateUserProfile(updates) // Plus besoin de userId
updateAppUser(updates)
```

**Consommation** : Les composants s'abonnent aux stores via hooks :
```typescript
const { unreadCount } = useNotificationsStore()
const { appUser } = useUserStore()
const { stats } = useVinylStatsStore()
```

## Authentification

### Hook useAuth

Le hook `useAuth` gère l'authentification via Supabase Auth :
```typescript
const { 
  user,           // User Supabase (uid, email)
  loading,        // État de chargement
  error,          // Erreurs auth
  signUp,         // Inscription
  signInWithPassword, // Connexion
  signOut         // Déconnexion
} = useAuth()
```

**Important** : Supabase Auth reste la source d'authentification. Le backend NestJS valide juste les JWT, il ne gère pas le signup/login.

### Guards

| Guard | Rôle |
|-------|------|
| `ProtectedRoute` | Bloque l'accès si non connecté → redirect `/` |
| `PublicOnlyRoute` | Bloque l'accès si connecté → redirect `/` |
| `HomeRoute` | Route `/` dynamique : Landing si déconnecté, Feed si connecté |

## Composants clés

### Composants de données

| Composant | Rôle |
|-----------|------|
| `AddVinylModal` | Modal 5 étapes : albumSearch → createAlbum → vinylSelection → createVinyl → vinylDetails |
| `AlbumSearch` | Recherche filtrée par artiste (filtrage client sur les albums de l'artiste) |
| `VinylCard` | Carte vinyle avec `variant`: `'full'` ou `'compact'` |
| `VinylGrid` | Grille avec infinite scroll, utilise VinylCard en mode compact |
| `VinylDetails` | Détails vinyle avec actions contextuelles selon `targetType` et `isOwnProfile` |
| `ProfileVinyls` | Affiche collection/wishlist, écoute `vinylStatsStore` pour rafraîchir |
| `PostCard` | Carte post avec optimistic UI et subscriptions temps réel (likes, commentaires) |
| `CommentItem` | Item commentaire avec support mode `isPending` |

### Composants de recherche

| Composant | Rôle |
|-----------|------|
| `SearchAlbumsTab` | Recherche d'albums avec infinite scroll (pagination offset-based) |
| `SearchArtistsTab` | Recherche d'artistes avec infinite scroll (pagination offset-based) |
| `SearchUsersTab` | Recherche d'utilisateurs avec infinite scroll (pagination offset-based) |

### Composants UI

| Composant | Rôle |
|-----------|------|
| `LoadingSpinner` | Spinner de chargement centralisé avec options fullScreen et taille |
| `Avatar` | Avatar utilisateur avec fallback |
| `Button` | Bouton réutilisable avec variants |
| `AlbumCard` | Carte album (titre, artiste, année) |

## Routes

### Routes publiques (accessibles déconnecté ET connecté)
```
/search                     Recherche albums (par titre), artistes, utilisateurs
/profile/:username          Profil (3 onglets : feed/collection/wishlist)
/profile/:username/followers|following
```

### Route dynamique selon auth
```
/                           Landing si déconnecté, Feed si connecté
```

### Routes "public only" (bloquées si connecté)
```
/signup, /login             Auth
```

### Routes protégées (bloquées si déconnecté)
```
/notifications              
/settings                   Modification profil
```

## Logique contextuelle AddVinylModal

### Props
```typescript
interface AddVinylModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;                       // ⚠️ Encore nécessaire pour certaines vérifications
  targetType?: 'collection' | 'wishlist';
  initialAlbum?: Album;
  initialStep?: ModalStep;
  initialVinyl?: Vinyl;
  isOwnProfile?: boolean;
  artist?: Artist;
}
```

### Comportement VinylDetails

| Contexte | Condition | Actions |
|----------|-----------|---------|
| Mon profil > Collection | - | "Retirer de ma collection" |
| Mon profil > Wishlist | - | "J'ai acheté !" + "Retirer de ma wishlist" |
| Profil autre / Search | En collection | Message "déjà possédé" |
| Profil autre / Search | En wishlist | "Déplacer vers la collection" |
| Profil autre / Search | Non possédé | 2 boutons : collection + wishlist |

## Realtime (Supabase WebSocket)

Certaines fonctionnalités utilisent encore Supabase Realtime en direct :

| Feature | Pourquoi Realtime |
|---------|-------------------|
| Likes sur posts | Mise à jour instantanée du compteur |
| Commentaires | Nouveaux commentaires apparaissent en temps réel |
| Notifications | Compteur non lu mis à jour instantanément |

**Future migration** : Socket.IO dans le backend pour unifier le realtime.

## Patterns et conventions

### Modal avec état initial
```typescript
<AddVinylModal
  key={isModalOpen ? 'open' : 'closed'}  // Force remount pour reset
  initialStep="createAlbum"
  artist={selectedArtist}
/>
```

### VinylImage
```typescript
// ✅ Utiliser opacity (pas hidden avec loading="lazy")
<img 
  className={loaded ? 'opacity-100' : 'opacity-0'} 
  loading="lazy" 
/>
```

### Optimistic UI
```typescript
// Pattern pour likes/comments
const handleLike = async () => {
  // 1. Update UI immédiatement
  setIsLiked(!isLiked)
  setLikesCount(likesCount + 1)
  
  try {
    // 2. Appel API
    await likePost(postId) // Plus besoin de userId
  } catch (error) {
    // 3. Rollback si erreur
    setIsLiked(isLiked)
    setLikesCount(likesCount)
  }
}
```

## Variables CSS
```css
--background: #1A1A1A
--background-light: #242424
--background-lighter: #2A2A2A
--foreground: #F5F5F5
--foreground-muted: #A0A0A0
--primary: #E67E22 (orange)
--secondary: #8B4513 (marron)
```

## Libs utilitaires

### API Backend (via apiClient)

| Fichier | Fonctions clés | Note |
|---------|----------------|------|
| `posts.ts` | getGlobalFeed, getProfileFeed, createPost, deletePost | userId du JWT |
| `postLikes.ts` | likePost, unlikePost, hasLikedPost, getLikesCount | userId du JWT |
| `comments.ts` | addComment, deleteComment, getComments | userId du JWT |
| `notifications.ts` | getNotifications, getUnreadCount, markAllAsRead | userId du JWT |
| `follows.ts` | followUser, unfollowUser, isFollowing, getFollowers | userId du JWT pour actions |
| `userVinyls.ts` | getUserVinyls, addVinylToUser, removeVinylFromUser, moveToCollection | userId du JWT |
| `users.ts` | getCurrentUser, updateUserProfile, searchUsers, getUserByUsername | userId du JWT pour /me |
| `albums.ts` | getAlbumById, searchAlbums (Supabase), createAlbum (Supabase RPC) | Public + Supabase |
| `vinyls.ts` | getVinylById, getVinylsByAlbum (Supabase), createVinyl (Supabase RPC) | Public + Supabase |
| `artists.ts` | getArtistById, searchArtists | Public |

### Autres services

| Fichier | Fonctions clés |
|---------|----------------|
| `spotify.ts` | searchSpotifyAlbums, getSpotifyAlbum (Client Credentials Flow) |
| `covers.ts` | uploadAlbumCover, uploadVinylCover (compression WebP 600px) |
| `storage.ts` | uploadProfilePhoto (Supabase Storage) |

## Points d'attention

1. **Ordre des routes** : Spécifiques AVANT génériques dans React Router
2. **Policies Supabase** : INSERT sur users, UPDATE sur albums/vinyls
3. **Règle collection/wishlist** : Jamais les deux en même temps
4. **Images** : opacity au lieu de hidden avec lazy loading
5. **Modal reset** : Utiliser `key` pour forcer le remount
6. **Covers Spotify** : URL stockée directement (pas de copie)
7. **Route guards** : ProtectedRoute gère le loading centralisé
8. **State management** : Zustand pour état global, pas d'events custom
9. **Realtime** : Activer les tables dans Supabase publication
10. **API calls** : Ne jamais passer `userId` dans les appels backend protégés
11. **useAuth** : Source unique d'authentification (Supabase Auth)
12. **Types partagés** : Toujours importer depuis `@fillcrate/shared`

## Style d'interaction préféré

- ✅ Questions de clarification AVANT de coder
- ✅ Procéder étape par étape avec validation
- ✅ Modifications ciblées plutôt que fichiers complets
- ✅ Un composant = un fichier
- ✅ Réutiliser l'existant
- ✅ Imports depuis `@fillcrate/shared` pour les types

## Déploiement (Vercel)

### Configuration

Le projet est configuré pour Vercel avec `vercel.json`.

Variables d'environnement à configurer dans Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (URL du backend Railway en prod)

Build settings :
- Framework Preset : Vite
- Build Command : `pnpm build` (géré par vercel.json)
- Output Directory : `dist`

## Migration notes

### Différences avec l'ancien code

**Ancien pattern (Supabase direct)** :
```typescript
import { addVinylToUser } from '../lib/vinyls'
await addVinylToUser(userId, vinylId, 'collection')
```

**Nouveau pattern (Backend API)** :
```typescript
import { addVinylToUser } from '../lib/api/userVinyls'
await addVinylToUser(vinylId, 'collection') // Plus de userId
```

### Checklist de migration

- [ ] Remplacer tous les imports `from '../lib/xxx'` par `from '../lib/api/xxx'`
- [ ] Retirer les paramètres `userId` des appels API protégés
- [ ] Utiliser `getCurrentUser()` au lieu de `getUserByUid(currentUser.id)`
- [ ] Vérifier que `apiClient` récupère bien le JWT
- [ ] Tester toutes les fonctionnalités protégées

## Troubleshooting

### Erreur 401 Unauthorized

Vérifier que :
- L'utilisateur est bien connecté (`useAuth`)
- Le JWT est récupéré par `apiClient` via `supabase.auth.getSession()`
- Le backend utilise bien `SUPABASE_ANON_KEY`

### Compteur notifications non synchronisé

- Vérifier que `notificationsStore` est initialisé dans `App.tsx`
- Vérifier la subscription Supabase Realtime

### Images ne chargent pas

- Vérifier les policies Supabase Storage
- Utiliser `opacity-0` → `opacity-100` avec `loading="lazy"`

### Types TypeScript non reconnus
```bash
# Rebuilder le package shared
cd ../../
pnpm build:shared
pnpm install
```

---

**Dernière mise à jour** : 4 février 2026