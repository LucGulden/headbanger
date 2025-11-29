import { Timestamp } from 'firebase/firestore';

/**
 * Interface représentant un album dans Firestore
 */
export interface Album {
  id: string; // ID Firestore (document ID)
  spotifyId: string; // ID Spotify unique
  title: string;
  artist: string;
  year: number;
  coverUrl: string; // URL de la pochette haute qualité
  spotifyUrl: string; // Lien vers l'album sur Spotify
  createdAt: Timestamp;
}

/**
 * Données d'un album depuis l'API Spotify
 */
export interface SpotifyAlbumData {
  spotifyId: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  spotifyUrl?: string;
}

/**
 * Résultat de recherche Spotify (format brut)
 */
export interface SpotifySearchResult {
  id: string;
  name: string;
  artists: Array<{
    name: string;
  }>;
  release_date: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
}

/**
 * Résultat de recherche d'album formaté pour l'UI
 */
export interface AlbumSearchResult {
  spotifyId: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  spotifyUrl: string;
  firestoreId?: string; // ID Firestore si l'album a été caché
}
