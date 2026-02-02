/**
 * Types partagés entre backend, web et mobile
 * Single source of truth pour tous les contrats de données
 */

// ============================================
// ALBUMS
// ============================================

/**
 * Album complet
 */
export interface Album {
  id: string;
  spotifyId: string | null;
  spotifyUrl: string | null;
  title: string;
  artist: string;
  coverUrl: string;
  year: number;
  createdBy: string | null;
  createdAt: string;
}
