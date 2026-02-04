import { apiClient } from './apiClient'
import type { Artist, ArtistLight } from '@fillcrate/shared'

// ============================================================================
// ROUTES BACKEND DISPONIBLES
// ============================================================================

/**
 * Récupère un artiste par son ID (backend)
 */
export async function getArtistById(artistId: string): Promise<Artist> {
  return apiClient.get<Artist>(`/artists/${artistId}`)
}

/**
 * Recherche d'artistes par nom (backend)
 */
export async function searchArtists(
  query: string,
  limit: number = 20,
  offset: number = 0,
): Promise<ArtistLight[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const params = new URLSearchParams()
  params.append('query', query)
  params.append('limit', String(limit))
  params.append('offset', String(offset))

  return apiClient.get<Artist[]>(`/artists?${params.toString()}`)
}