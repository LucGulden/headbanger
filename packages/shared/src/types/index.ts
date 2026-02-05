/**
 * Types partagés entre backend, web et mobile
 * Single source of truth pour tous les contrats de données
 */

// ============================================
// ALBUMS
// ============================================
// Album minimal pour les posts
export interface AlbumLight {
  id: string;
  title: string;
  artists: ArtistLight[];
  coverUrl: string;
  year: number;
}

/**
 * Album complet
 */
export interface Album extends AlbumLight {
    vinyls: VinylLight[];
}

// ============================================
// ARTISTS
// ============================================

// Artist light (pour search et listes)
export interface ArtistLight {
  id: string;
  name: string;
  imageUrl: string | null;
}

// Artist complet (pour getById)
export interface Artist extends ArtistLight {
  spotifyId?: string | null;
  albums: AlbumLight[];
}

// ============================================
// VINYLS
// ============================================
export interface VinylLight {
  id: string;
  title: string;
  artists: ArtistLight[];
  coverUrl: string;
  year: number;
  country: string;
  catalogNumber: string;
}

export interface Vinyl extends VinylLight {
  label: string;
  format: string;
  album: AlbumLight;
}

// ============================================
// USER VINYLS
// ============================================
export type UserVinylType = 'collection' | 'wishlist';

export interface UserVinyl {
  id: string;
  addedAt: string;
  vinyl: Vinyl;
}

export interface VinylStats {
  collectionCount: number;
  wishlistCount: number;
}

// ============================================
// USERS
// ============================================
// User minimal pour les posts/commentaires
export interface UserLight {
  uid: string;
  username: string;
  photoUrl?: string;
}

export interface User extends UserLight {
  firstName?: string;
  lastName?: string;
  bio?: string;
}

// ============================================
// FOLLOWS
// ============================================
export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

// ============================================
// POSTS
// ============================================
// Type de post
export type PostType = 'collection_add' | 'wishlist_add';

// Post avec tous les détails
export interface PostWithDetails {
  id: string;
  userId: string;
  type: PostType;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  user: UserLight;
  vinyl: VinylLight;
}

// ============================================
// COMMENTS
// ============================================
export interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  user: UserLight;
}

// ============================================
// NOTIFICATIONS
// ============================================
export type NotificationType = 'new_follower' | 'post_like' | 'post_comment';

// Actor dans les notifications (avec firstName/lastName)
export interface NotificationActor {
  uid: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
}

// Vinyl simplifié pour notifications
export interface NotificationVinyl {
  id: string;
  title: string;
  artist: string; // Artistes concaténés
  coverUrl: string | null;
}

// Post dans les notifications
export interface NotificationPost {
  id: string;
  vinylId: string;
  vinyl: NotificationVinyl;
}

// Commentaire dans les notifications
export interface NotificationComment {
  id: string;
  content: string;
}

// Notification complète
export interface Notification {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actor: NotificationActor;
  post?: NotificationPost;
  comment?: NotificationComment;
}