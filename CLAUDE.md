# FillCrate - Réseau social pour passionnés de vinyles

## Vue d'ensemble du projet

FillCrate est un réseau social pour passionnés de vinyles permettant de :
- Gérer sa collection de vinyles
- Créer une wishlist
- Suivre d'autres utilisateurs
- Voir un feed social avec les acquisitions des personnes suivies
- Liker et commenter les posts
- Consulter les profils avec abonnés/abonnements
- Recevoir et consulter des notifications
- Rechercher des albums et des utilisateurs
- **Créer des albums (import Spotify ou manuel)** ✅
- **Créer des pressages vinyles** ✅

**Migration complétée** : De Firebase/Next.js vers Supabase/React+Vite

## Stack technique

- React 18 + TypeScript + Vite 7
- React Router v6 pour le routing
- Supabase (Auth + Database PostgreSQL + Realtime + Storage)
- Tailwind CSS v3 avec variables CSS custom
- Framer Motion pour les animations
- Fonts : Inter
- browser-image-compression pour avatars et covers
- **Spotify Web API** pour l'import d'albums

## Structure du projet
```
fillcrate-web/
├── src/
│   ├── components/
│   │   ├── Avatar.tsx              ✅ Adapté - Avatar avec initiales colorées
│   │   ├── Button.tsx              ✅ Copié - Composant bouton avec size (sm/md/lg)
│   │   ├── CommentItem.tsx         ✅ Créé - Affichage des commentaires
│   │   ├── Feed.tsx                ✅ Créé - Composant feed avec infinite scroll
│   │   ├── Footer.tsx              ✅ Créé - Footer du site
│   │   ├── Input.tsx               ✅ Copié - Input avec label optionnel
│   │   ├── Layout.tsx              ✅ Créé - Wrapper avec Header/Footer
│   │   ├── Navigation.tsx          ✅ Adapté - Menu avec badge notifications temps réel
│   │   ├── NotificationItem.tsx    ✅ Créé - Affichage d'une notification
│   │   ├── PostCard.tsx            ✅ Créé - Carte de post avec likes/commentaires
│   │   ├── VinylImage.tsx          ✅ Créé - Image avec placeholder SVG (opacity fix)
│   │   ├── VinylCard.tsx           ✅ Créé - Carte d'affichage d'un vinyle
│   │   ├── VinylPressingCard.tsx   ✅ Créé - Carte pressage avec titre + badges
│   │   ├── AlbumCard.tsx           ✅ Créé - Carte d'affichage d'un album (réutilisable)
│   │   ├── VinylGrid.tsx           ✅ Créé - Grille avec infinite scroll réutilisable
│   │   ├── AddVinylModal.tsx       ✅ Créé - Modal en 5 étapes avec targetType optionnel
│   │   ├── AlbumSearch.tsx         ✅ Créé - Recherche d'albums (utilise AlbumCard)
│   │   ├── VinylSelection.tsx      ✅ Créé - Sélection pressages (étape 2)
│   │   ├── VinylDetails.tsx        ✅ Créé - Détails pressage avec logique contextuelle
│   │   ├── CreateAlbumForm.tsx     ✅ Créé - Orchestrateur création album
│   │   ├── ModeChoice.tsx          ✅ Créé - Choix Spotify ou manuel
│   │   ├── SpotifyAlbumImport.tsx  ✅ Créé - Import album depuis Spotify
│   │   ├── ManualAlbumForm.tsx     ✅ Créé - Création album manuelle
│   │   ├── CreateVinylForm.tsx     ✅ Créé - Création pressage vinyle
│   │   ├── ProfileHeader.tsx       ✅ Créé - Header de profil avec stats et Follow
│   │   ├── ProfileReleases.tsx     ✅ Créé - Grille avec callback pour ouvrir modal
│   │   ├── UserListItem.tsx        ✅ Créé - Carte utilisateur avec bouton Follow
│   │   ├── SearchAlbumsTab.tsx     ✅ Créé - Onglet recherche albums (sans targetType)
│   │   ├── SearchUsersTab.tsx      ✅ Créé - Onglet recherche utilisateurs
│   │   └── EditProfileForm.tsx     ✅ Créé - Formulaire modification profil
│   │
│   ├── pages/
│   │   ├── Home.tsx                ✅ Adapté - Landing page
│   │   ├── Signup.tsx              ✅ Adapté - Inscription
│   │   ├── Login.tsx               ✅ Adapté - Connexion
│   │   ├── Feed.tsx                ✅ Créé - Page feed
│   │   ├── Profile.tsx             ✅ Créé - Page profil avec modal intégré (3 onglets)
│   │   ├── Followers.tsx           ✅ Créé - Liste des abonnés
│   │   ├── Following.tsx           ✅ Créé - Liste des abonnements
│   │   ├── Notifications.tsx       ✅ Créé - Page notifications avec auto-mark-as-read
│   │   ├── Search.tsx              ✅ Créé - Page recherche avec tabs Albums/Users
│   │   ├── Settings.tsx            ✅ Créé - Page modification profil
│   │   └── NotFound.tsx            ✅ Créé
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              ✅ Créé - Hook d'authentification Supabase
│   │   ├── useFeedPagination.ts    ✅ Créé - Hook pagination feed avec realtime
│   │   ├── useVinylsPagination.ts  ✅ Créé - Hook pagination vinyles avec infinite scroll
│   │   └── useNotifications.ts     ✅ Créé - Hook notifications avec pagination
│   │
│   ├── lib/
│   │   ├── user.ts                 ✅ Créé - Validation username + disponibilité
│   │   ├── posts.ts                ✅ Créé - CRUD posts, likes, getFeedPosts
│   │   ├── comments.ts             ✅ Créé - CRUD commentaires + realtime
│   │   ├── follows.ts              ✅ Créé - Système de follow + getFollowers/getFollowing
│   │   ├── vinyls.ts               ✅ Créé - Gestion vinyles + moveToCollection
│   │   ├── notifications.ts        ✅ Créé - CRUD notifications + realtime
│   │   ├── search.ts               ✅ Créé - Recherche d'utilisateurs
│   │   ├── date-utils.ts           ✅ Créé - Formatage dates relatives
│   │   ├── storage.ts              ✅ Créé - Upload avatars vers Storage
│   │   ├── spotify.ts              ✅ Créé - Intégration Spotify API
│   │   └── covers.ts               ✅ Créé - Upload covers albums/vinyls
│   │
│   ├── types/
│   │   ├── post.ts                 ✅ Créé - Types posts, PostWithDetails
│   │   ├── comment.ts              ✅ Créé - Types commentaires
│   │   ├── vinyl.ts                ✅ Créé - Types vinyles, albums, user_vinyls
│   │   ├── notification.ts         ✅ Créé - Types notifications
│   │   └── user.ts                 ✅ Créé - Type User (réutilisé pour recherche)
│   │
│   ├── database/
│   │   ├── README.md               ✅ Documentation SQL
│   │   └── migrations/             ✅ Migrations SQL organisées
│   │
│   ├── App.tsx                     ✅ Configuré - Routes React Router (ordre correct)
│   ├── main.tsx                    ✅ Point d'entrée
│   ├── index.css                   ✅ Styles Tailwind + variables CSS
│   └── supabaseClient.ts           ✅ Connexion Supabase
│
├── .env                            ✅ Variables d'environnement
├── .env.example                    ✅ Template pour .env
├── index.html                      ✅ Mis à jour avec fonts
├── tailwind.config.js              ✅ Configuration Tailwind
├── postcss.config.js               ✅ Configuration PostCSS
├── vite.config.ts                  ✅ Configuration Vite
├── package.json                    ✅ Dépendances installées
└── CLAUDE.md                       ✅ Ce fichier
```

## 🗄️ Base de données Supabase

### Tables créées

**users**
- uid (UUID, PK, référence auth.users)
- email, username (unique), first_name, last_name
- photo_url, bio
- created_at, updated_at

**albums**
- id (UUID, PK)
- spotify_id (unique partiel, nullable pour albums manuels)
- spotify_url (nullable)
- title (NOT NULL), artist (NOT NULL)
- cover_url (NOT NULL), year (NOT NULL)
- **created_by** (UUID, FK auth.users, nullable)
- created_at

**vinyls**
- id (UUID, PK)
- album_id (FK albums, **NOT NULL**)
- title (NOT NULL), artist (NOT NULL)
- cover_url (NOT NULL)
- label (NOT NULL), catalog_number (NOT NULL)
- country (NOT NULL), format (NOT NULL), year (NOT NULL)
- **created_by** (UUID, FK auth.users, nullable)
- created_at

**user_vinyls**
- id (UUID, PK)
- user_id (FK users), release_id (FK vinyls)
- type ('collection' | 'wishlist')
- added_at
- UNIQUE(user_id, release_id, type)
- **RÈGLE MÉTIER** : Un vinyle ne peut jamais être dans collection ET wishlist simultanément

**follows**
- id (UUID, PK)
- follower_id (FK users), following_id (FK users)
- status ('active') - Tous les follows sont actifs (pas de validation)
- created_at

**posts**
- id (UUID, PK)
- user_id (FK users), vinyl_id (FK vinyls)
- type ('collection_add' | 'wishlist_add')
- content (texte optionnel)
- created_at

**post_likes**
- id (UUID, PK)
- user_id (FK users), post_id (FK posts)
- created_at
- UNIQUE(user_id, post_id)

**comments**
- id (UUID, PK)
- user_id (FK users), post_id (FK posts)
- content (texte)
- created_at

**notifications**
- id (UUID, PK)
- user_id (FK users) - Destinataire de la notification
- type (ENUM: 'new_follower', 'post_like', 'post_comment')
- actor_id (FK users) - Qui a effectué l'action
- post_id (FK posts, nullable)
- comment_id (FK comments, nullable)
- read (BOOLEAN, default false)
- created_at (TIMESTAMPTZ)
- UNIQUE(user_id, type, actor_id, post_id, comment_id) - Évite les doublons

### Buckets Storage

**avatars**
- Structure : `{userId}/avatar.webp`
- Public : oui
- Policies : SELECT public, INSERT/UPDATE/DELETE pour owner

**covers**
- Structure : `albums/{albumId}.webp` et `vinyls/{vinylId}.webp`
- Public : oui
- Policies : SELECT public, INSERT/UPDATE/DELETE pour authenticated

### Types TypeScript correspondants
```typescript
export interface Album {
  id: string;
  spotify_id: string | null;
  spotify_url: string | null;
  title: string;
  artist: string;
  cover_url: string;
  year: number;
  created_by: string | null;
  created_at: string;
}

export interface Vinyl {
  id: string;
  album_id: string;
  title: string;
  artist: string;
  cover_url: string;
  year: number;
  label: string;
  catalog_number: string;
  country: string;
  format: string;
  created_by: string | null;
  created_at: string;
}

export interface UserVinyl {
  id: string;
  user_id: string;
  release_id: string;
  type: UserVinylType;
  added_at: string;
}

export interface UserVinylWithDetails extends UserVinyl {
  vinyl: Vinyl;
}

export type UserVinylType = 'collection' | 'wishlist';
```

### Architecture de données - Système de vinyles

**Album** (table `albums`) = L'œuvre musicale abstraite
- Contient infos Spotify (optionnel) : title, artist, cover_url, year, spotify_id
- Un album peut avoir plusieurs pressages vinyles
- Peut être créé via import Spotify ou manuellement

**Vinyl** (table `vinyls`) = Un pressage physique spécifique
- Lié à un album via `album_id` (FK, NOT NULL)
- Contient détails physiques : year, country, label, catalog_number, format
- Titre personnalisable (éditions spéciales, anniversaires)
- Cover personnalisable (par défaut = cover album)
- Exemple : "Dark Side of the Moon" peut avoir un pressage UK 1973, US 1973, réédition 2016, etc.

**UserVinyl** (table `user_vinyls`) = Relation user ↔ vinyle
- `type` : 'collection' ou 'wishlist'
- **RÈGLE IMPORTANTE** : Un vinyle ne peut JAMAIS être dans collection ET wishlist en même temps
- Contrainte UNIQUE(user_id, release_id, type)
- Trigger automatique de création de post lors de l'ajout en collection

### Sécurité et fonctionnalités

- ✅ RLS activé sur toutes les tables
- ✅ Policies configurées (tous les profils sont publics)
- ✅ Policy INSERT sur users (fix erreur inscription)
- ✅ **Policy UPDATE sur albums** (pour updateAlbumCover)
- ✅ **Policy UPDATE sur vinyls** (pour updateVinylCover)
- ✅ **Triggers notifications** :
  - `notify_new_follower` - Crée notification lors d'un follow
  - `notify_post_like` - Crée notification lors d'un like
  - `notify_post_comment` - Crée notification lors d'un commentaire
  - `delete_follower_notification` - Supprime notification lors d'un unfollow
  - `delete_like_notification` - Supprime notification lors d'un unlike
  - `delete_comment_notification` - Supprime notification lors de suppression commentaire
- ✅ Trigger `on_auth_user_created` : crée automatiquement le profil user
- ✅ Trigger `on_vinyl_added_create_post` : crée automatiquement un post quand un vinyle est ajouté à la collection
- ✅ Vue `posts_with_stats` : facilite les requêtes avec likes/comments count
- ✅ Realtime activé sur `notifications`
- ✅ Index optimisés pour les performances
- ✅ **Confirmation email désactivée** (connexion directe après inscription)

## 🎯 Routes configurées
```
/ → Home (Landing page)
/signup → Inscription
/login → Connexion
/feed → Feed social
/profile/:username → Profil utilisateur (3 onglets : feed/collection/wishlist)
/profile/:username/followers → Liste des abonnés
/profile/:username/following → Liste des abonnements
/notifications → Page notifications
/search → Recherche albums et utilisateurs
/settings → Modification du profil
/* → 404 Not Found
```

**Note importante** : Ordre des routes dans App.tsx
```typescript
// Routes spécifiques AVANT la route générique
<Route path="/profile/:username/followers" element={<FollowersPage />} />
<Route path="/profile/:username/following" element={<FollowingPage />} />
<Route path="/profile/:username" element={<Profile />} />
```

**Pages supprimées** : `/collection` et `/wishlist` (remplacées par les onglets du profil)

## 🎨 Système de création d'albums et pressages

### Flux utilisateur

Le modal `AddVinylModal` guide l'utilisateur à travers **5 étapes** avec des animations fluides (Framer Motion) :

**Étape 1 - albumSearch** : Recherche d'albums dans BDD locale
- Barre de recherche avec debounce (300ms)
- Affichage en grille des albums trouvés (utilise `AlbumCard`)
- Bouton "Vous ne trouvez pas ? Créer un album"

**Étape 2 - createAlbum** : Création d'un nouvel album
- `ModeChoice` : Choix entre Spotify ou Manuel
- `SpotifyAlbumImport` : Recherche Spotify + import automatique
- `ManualAlbumForm` : Saisie manuelle avec upload cover

**Étape 3 - vinylSelection** : Sélection d'un pressage
- Header avec l'album sélectionné
- Liste des pressages existants (utilise `VinylPressingCard`)
- Bouton "Ajouter un pressage"
- Badges de statut ("En collection", "En wishlist")

**Étape 4 - createVinyl** : Création d'un nouveau pressage
- Titre personnalisable (prérempli avec titre album)
- Année du pressage (prérempli avec année album)
- Label, numéro de catalogue (obligatoires)
- Pays, format (select avec options)
- Cover alternative optionnelle

**Étape 5 - vinylDetails** : Confirmation et détails
- Cover grand format
- Détails complets : label, numéro de catalogue, pays, format
- Badges de statut et de réédition
- **Boutons contextuels intelligents** (voir section suivante)

### Logique contextuelle du modal AddVinylModal

**Props du modal :**
```typescript
interface AddVinylModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  targetType?: UserVinylType; // Optionnel - définit le contexte
  initialAlbum?: Album;
}
```

**Comportement selon le contexte :**

1. **Depuis Profil > Onglet Collection** (`targetType='collection'`)
   - Vinyle non possédé → Bouton "Ajouter à ma collection"
   - En wishlist → Bouton "Déplacer vers la collection" (retire automatiquement de wishlist)
   - En collection → Message "déjà possédé"

2. **Depuis Profil > Onglet Wishlist** (`targetType='wishlist'`)
   - Vinyle non possédé → Bouton "Ajouter à ma wishlist"
   - En collection OU wishlist → Message "déjà possédé"

3. **Depuis Page Search** (`targetType=undefined`)
   - Vinyle non possédé → **Deux boutons** : "Ajouter à ma collection" ET "Ajouter à ma wishlist"
   - En wishlist → Bouton "Déplacer vers la collection"
   - En collection → Message "déjà possédé"

### Architecture des composants
```
AddVinylModal (targetType?: UserVinylType)
├── AlbumSearch (recherche BDD locale)
│   └── Bouton "Créer un album" → createAlbum
├── CreateAlbumForm (orchestrateur)
│   ├── ModeChoice (Spotify ou Manuel)
│   ├── SpotifyAlbumImport
│   │   └── Recherche Spotify → createAlbum en BDD
│   └── ManualAlbumForm
│       └── Upload cover → createAlbum en BDD
├── VinylSelection (liste pressages)
│   └── Bouton "Ajouter un pressage" → createVinyl
├── CreateVinylForm
│   └── Upload cover optionnelle → createVinyl en BDD
└── VinylDetails (confirmation, logique contextuelle)
    ├── Props: album, vinyl, userId, onConfirm, targetType?
    ├── onConfirm: (type: UserVinylType) => void
    └── Boutons selon contexte (1 ou 2 boutons)
```

### Composants de création

**VinylDetails** - Étape finale avec logique contextuelle
```typescript
interface VinylDetailsProps {
  vinyl: Vinyl;
  album: Album;
  userId: string;
  onConfirm: (type: UserVinylType) => void; // Type passé au callback
  targetType?: UserVinylType; // Optionnel - définit le contexte
}
```
- Vérifie automatiquement si vinyle en collection/wishlist
- Affiche 1 ou 2 boutons selon `targetType` et statut possédé
- Gère le déplacement wishlist → collection via `moveToCollection()`

**CreateAlbumForm** - Orchestrateur
```typescript
interface CreateAlbumFormProps {
  onAlbumCreated: (album: Album) => void;
  onCancel: () => void;
  userId: string;
}
```

**ModeChoice** - Choix du mode
```typescript
interface ModeChoiceProps {
  onSelectSpotify: () => void;
  onSelectManual: () => void;
  onCancel: () => void;
}
```

**SpotifyAlbumImport** - Import Spotify
```typescript
interface SpotifyAlbumImportProps {
  onAlbumCreated: (album: Album) => void;
  onBack: () => void;
  userId: string;
}
```
- Recherche dans Spotify API
- Vérifie si album existe déjà (par spotify_id)
- Crée album avec URL Spotify comme cover_url
- Stocke created_by

**ManualAlbumForm** - Saisie manuelle
```typescript
interface ManualAlbumFormProps {
  onAlbumCreated: (album: Album) => void;
  onBack: () => void;
  userId: string;
}
```
- Champs : titre, artiste, année, cover (obligatoire)
- Upload cover vers Storage bucket `covers`
- Stocke created_by

**CreateVinylForm** - Création pressage
```typescript
interface CreateVinylFormProps {
  album: Album;
  onVinylCreated: (vinyl: Vinyl) => void;
  onCancel: () => void;
  userId: string;
}
```
- Titre personnalisable (prérempli)
- Année préremplie avec album.year
- Champs obligatoires : year, label, catalog_number, country, format
- Cover alternative optionnelle (défaut = album.cover_url)
- Stocke created_by

**VinylPressingCard** - Carte pressage
```typescript
interface VinylPressingCardProps {
  vinyl: Vinyl;
  albumCoverUrl?: string;
  inCollection?: boolean;
  inWishlist?: boolean;
  onClick: () => void;
}
```
- Affiche : titre, cover, badges statut, année, pays, format
- Affiche label et catalog_number

**ProfileReleases** - Affichage collection/wishlist dans profil
```typescript
interface ProfileReleasesProps {
  userId: string;
  type: UserVinylType;
  isOwnProfile: boolean;
  username: string;
  onOpenAddVinyl?: () => void; // Callback pour ouvrir le modal
}
```
- Bouton dans empty state qui ouvre le modal (au lieu de rediriger)
- Écoute l'event `vinyl-added` pour rafraîchir automatiquement

### Variables d'environnement requises
```env
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
VITE_SPOTIFY_CLIENT_ID=xxx
VITE_SPOTIFY_CLIENT_SECRET=xxx
```

## 📚 Bibliothèques utilitaires

### spotify.ts (`src/lib/spotify.ts`)

- `searchSpotifyAlbums(query, limit)` - Recherche albums sur Spotify
- `getSpotifyAlbum(spotifyId)` - Récupère détails d'un album

**Fonctionnement :**
- Client Credentials Flow (pas besoin de login utilisateur)
- Token en cache avec expiration automatique
- Retourne `SpotifyAlbumResult` avec coverUrl, title, artist, year

### covers.ts (`src/lib/covers.ts`)

- `uploadAlbumCover(albumId, file)` - Upload cover album vers Storage
- `uploadVinylCover(vinylId, file)` - Upload cover vinyl vers Storage
- `generateImagePreview(file)` - Preview locale avant upload

**Fonctionnement :**
- Compression automatique (600px max, WebP, 0.5MB)
- Structure : `covers/albums/{id}.webp` et `covers/vinyls/{id}.webp`
- Cache 1 an

### vinyls.ts (`src/lib/vinyls.ts`)

**Gestion de collection/wishlist :**
- `getUserVinyls(userId, type, limit, lastAddedAt?)` - Récupérer vinyles avec pagination
- `getUserVinylsCount(userId, type)` - Compter les vinyles
- `hasVinyl(userId, vinylId, type)` - Vérifier si un vinyle est possédé
- `addVinylToUser(userId, vinylId, type)` - Ajouter à collection/wishlist
- `removeVinylFromUser(userId, vinylId, type)` - Retirer de collection/wishlist
- `moveToCollection(userId, vinylId)` - **Déplacer wishlist → collection** (retire de wishlist, ajoute à collection)
- `getVinylStats(userId)` - Stats collection/wishlist

**Recherche et exploration :**
- `searchAlbums(query, limit)` - Rechercher des albums (titre/artiste)
- `getVinylsByAlbum(albumId)` - Récupérer tous les pressages d'un album
- `getAlbumBySpotifyId(spotifyId)` - Vérifier si album existe déjà

**Création :**
- `createAlbum(input: CreateAlbumInput)` - Créer un album
- `createVinyl(input: CreateVinylInput)` - Créer un pressage
- `updateAlbumCover(albumId, coverUrl)` - Mettre à jour cover album
- `updateVinylCover(vinylId, coverUrl)` - Mettre à jour cover vinyl
```typescript
interface CreateAlbumInput {
  title: string;
  artist: string;
  year: number | null;
  coverUrl: string | null;
  spotifyId?: string | null;
  spotifyUrl?: string | null;
  createdBy: string;
}

interface CreateVinylInput {
  albumId: string;
  title: string;
  artist: string;
  year: number;
  label: string;
  catalogNumber: string;
  country: string;
  format: string;
  coverUrl: string;
  createdBy: string;
}
```

### storage.ts (`src/lib/storage.ts`)

- `uploadProfilePhoto(userId, file)` - Upload avatar vers Storage
- `deleteProfilePhoto(userId)` - Supprimer avatar
- `generateImagePreview(file)` - Preview locale

## 🔔 Système de notifications

### Flux utilisateur

1. **Action déclencheur** : Follow, like, comment
2. **Trigger SQL automatique** : Crée une notification en BDD
3. **Realtime Supabase** : Envoie la notification en temps réel
4. **Badge Navigation** : S'incrémente instantanément (+1)
5. **Page notifications** : Affiche toutes les notifications
6. **Auto-mark-as-read** : Toutes marquées comme lues dès l'ouverture de la page

### Triggers SQL automatiques

**Follow** → `notify_new_follower()`
**Like** → `notify_post_like()`
**Comment** → `notify_post_comment()`
**Cleanup** → Triggers de suppression (unfollow, unlike, delete comment)

## 🔍 Système de recherche

### Page Search (`/search`)

**SearchAlbumsTab** :
- Recherche dans la BDD locale (table `albums`)
- Affichage en grille avec `AlbumCard`
- Clic sur album → ouvre `AddVinylModal` **sans targetType** (2 boutons si non possédé)

**SearchUsersTab** :
- Recherche par username, first_name, last_name (ILIKE)
- Affichage en liste avec `UserListItem`
- Bouton "Suivre" intégré

## 🎨 Variables CSS
```css
--background: #1A1A1A
--background-light: #242424
--background-lighter: #2A2A2A
--foreground: #F5F5F5
--foreground-muted: #A0A0A0
--primary: #E67E22 (orange)
--secondary: #8B4513 (marron)
```

## 🔑 Bonnes pratiques du projet

### Séparation des composants
- Un composant = un fichier
- Extraire les sous-composants réutilisables (AlbumCard, VinylPressingCard, ModeChoice...)

### Synchronisation entre composants
Pattern utilisé : **Custom Events** (pas de Redux/Context)
```typescript
// Émettre un event
window.dispatchEvent(new Event('profile-updated'))

// Écouter un event
useEffect(() => {
  const handler = () => { /* ... */ }
  window.addEventListener('profile-updated', handler)
  return () => window.removeEventListener('profile-updated', handler)
}, [])
```

Events actifs :
- `profile-updated` : synchronise Navigation après modification profil
- `notifications-read` : reset le badge notifications
- `vinyl-added` : rafraîchit les listes collection/wishlist dans ProfileReleases

### Upload d'images
```typescript
// Avatars
import { uploadProfilePhoto } from '../lib/storage'
const photoUrl = await uploadProfilePhoto(userId, file)

// Covers albums
import { uploadAlbumCover } from '../lib/covers'
const coverUrl = await uploadAlbumCover(albumId, file)
// Puis : await updateAlbumCover(albumId, coverUrl)

// Covers vinyls
import { uploadVinylCover } from '../lib/covers'
const coverUrl = await uploadVinylCover(vinylId, file)
// Puis : await updateVinylCover(vinylId, coverUrl)
```

### Deux types de User
- `User` de Supabase Auth (`useAuth`) : authentification, `user.id`, `user.email`
- `User` de `types/user.ts` : données profil depuis `public.users`

### Modal avec état initial
```typescript
// Pattern pour modal avec état de départ différent
<AddVinylModal
  key={isOpen ? 'open' : 'closed'} // Force remount pour reset
  isOpen={isOpen}
  initialAlbum={selectedAlbum}
  targetType={activeTab} // Ou undefined depuis Search
  ...
/>
```

### VinylImage - Fix loading lazy
```typescript
// ✅ BON : Utiliser opacity au lieu de hidden
<img className={imageLoaded ? 'opacity-100' : 'opacity-0'} loading="lazy" />

// ❌ MAUVAIS : hidden empêche le chargement avec loading="lazy"
<img className={imageLoaded ? '' : 'hidden'} loading="lazy" />
```

## ⚠️ Points d'attention

1. **Ordre des routes** : Les routes spécifiques doivent être AVANT les routes génériques
2. **Policy INSERT** : La table `users` nécessite une policy INSERT
3. **Policy UPDATE** : Les tables `albums` et `vinyls` nécessitent une policy UPDATE
4. **Trigger automatique de posts** : Un post est créé automatiquement quand un vinyle est ajouté à la collection
5. **URLs de profil** : On utilise `username` et non `userId` dans les URLs
6. **Images vinyles** : Utiliser `opacity` au lieu de `hidden` avec `loading="lazy"`
7. **Realtime** : Penser à activer Realtime sur les nouvelles tables
8. **Modal reset** : Utiliser `key` pour forcer le remount
9. **Covers Spotify** : On stocke l'URL Spotify directement (pas de copie)
10. **VinylDetails** : Reçoit `album` en prop pour calculer `isReissue` et `targetType?` pour la logique contextuelle
11. **Règle collection/wishlist** : Un vinyle ne peut JAMAIS être dans les deux en même temps
12. **targetType optionnel** : Ne PAS passer `targetType` depuis Search pour activer les 2 boutons

## ✅ Ce qui fonctionne

1. ✅ Navigation avec Header/Footer sur toutes les pages
2. ✅ Formulaires inscription/connexion
3. ✅ Page Feed avec infinite scroll et pull-to-refresh
4. ✅ PostCard avec likes et commentaires temps réel
5. ✅ **Page Profile avec 3 onglets (feed/collection/wishlist)**
6. ✅ **Modal AddVinylModal intégré dans le profil**
7. ✅ **Logique contextuelle intelligente (1 ou 2 boutons selon contexte)**
8. ✅ **Déplacement wishlist → collection avec fonction dédiée**
9. ✅ Modal d'ajout en 5 étapes avec animations
10. ✅ **Création d'albums via Spotify**
11. ✅ **Création d'albums manuelle avec upload cover**
12. ✅ **Création de pressages avec tous champs obligatoires**
13. ✅ **Titre personnalisable pour éditions spéciales**
14. ✅ **Cover personnalisable pour pressages**
15. ✅ Pages Followers/Following
16. ✅ Système de notifications complet temps réel
17. ✅ Page Search avec tabs Albums/Utilisateurs
18. ✅ Page Settings modification profil

## 🐛 Bugs corrigés

1. ✅ **Images vinyles ne s'affichaient pas** → opacity au lieu de hidden
2. ✅ **Erreur inscription** → policy INSERT sur users
3. ✅ **Page 404 sur followers/following** → ordre des routes
4. ✅ **Cover albums non sauvegardée** → ajout updateAlbumCover + policy UPDATE
5. ✅ **Cover vinyls non sauvegardée** → ajout updateVinylCover + policy UPDATE
6. ✅ **isReissue cassé** → passage de album en prop à VinylDetails
7. ✅ **Pages Collection/Wishlist redondantes** → supprimées, remplacées par onglets profil
8. ✅ **Boutons d'ajout non contextuels** → logique intelligente avec targetType optionnel

## ⏳ Ce qu'il reste à faire

### V2 (reporté)
- ⏳ Filtres/tri dans Collection/Wishlist
- ⏳ Statistiques de collection
- ⏳ Notifications push natives
- ⏳ Import/Export collection
- ⏳ OAuth Google/Facebook
- ⏳ Modération/gestion des doublons

## 📝 Style d'interaction préféré avec Claude

**Ce qui fonctionne bien :**
- 🎯 Poser des questions de clarification AVANT de coder
- 🎯 Procéder étape par étape avec validation
- 🎯 Privilégier la réutilisation de l'existant
- 🎯 **Donner des modifications ciblées plutôt que des fichiers complets**
- 🎯 **Séparer les composants (un composant = un fichier)**
- 🎯 Anticiper les besoins futurs

**Approche de travail :**
1. Analyser le besoin et poser les bonnes questions
2. Proposer un plan d'implémentation clair
3. Valider le plan avant de commencer
4. Implémenter étape par étape
5. Tester et ajuster si nécessaire

---

**Dernière mise à jour** : 23 janvier 2026