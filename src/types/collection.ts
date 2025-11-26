import { Timestamp } from 'firebase/firestore';
import type { Album } from './album';

/**
 * Type de collection : collection ou wishlist
 */
export type CollectionType = 'collection' | 'wishlist';

/**
 * Album dans la collection ou wishlist d'un utilisateur
 * Document dans Firestore : /user_albums/{id}
 */
export interface UserAlbum {
  id: string; // ID Firestore du document
  userId: string; // ID de l'utilisateur propriétaire
  albumId: string; // Référence vers collection "albums"
  type: CollectionType; // 'collection' ou 'wishlist'
  addedAt: Timestamp; // Date d'ajout
  notes?: string; // Notes optionnelles de l'utilisateur
}

/**
 * UserAlbum avec les détails de l'album (JOIN)
 * Utilisé pour l'affichage dans les listes
 */
export interface UserAlbumWithDetails extends UserAlbum {
  album: Album; // Détails complets de l'album
}

/**
 * Données pour créer un UserAlbum
 */
export interface CreateUserAlbumData {
  userId: string;
  albumId: string;
  type: CollectionType;
  notes?: string;
}

/**
 * Données pour mettre à jour un UserAlbum
 */
export interface UpdateUserAlbumData {
  notes?: string;
  type?: CollectionType;
}
