import { apiClient } from './apiClient'
import type { Album, AlbumLight } from '@fillcrate/shared'

/**
 * Récupère un album par son ID avec tous ses vinyles
 */
export async function getAlbumById(albumId: string): Promise<Album | null> {
  try {
    const album = await apiClient.get<Album>(`/albums/${albumId}`);
    return album;
  } catch (error) {
    console.error('Error fetching album:', error);
    return null;
  }
}

/**
 * Recherche d'albums par titre
 */
export async function searchAlbums(
  query: string,
  limit: number = 20,
  offset: number = 0,
): Promise<AlbumLight[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const albums = await apiClient.get<Album[]>(
      `/albums/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
    );
    return albums;
  } catch (error) {
    console.error('Error searching albums:', error);
    return [];
  }
}
