import { apiClient } from '../apiClient'
import type { Vinyl } from '@fillcrate/shared'

// ============================================================================
// ROUTES BACKEND DISPONIBLES
// ============================================================================

/**
 * Récupère un vinyl par son ID (backend)
 */
export async function getVinylById(vinylId: string): Promise<Vinyl> {
  return apiClient.get<Vinyl>(`/vinyls/${vinylId}`)
}