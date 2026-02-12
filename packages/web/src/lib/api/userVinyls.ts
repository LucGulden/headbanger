import { apiClient } from '../apiClient'
import type { UserVinyl, UserVinylType, VinylStats } from '@headbanger/shared'

const ITEMS_PER_PAGE = 20

// ============================================================================
// ROUTES BACKEND DISPONIBLES Public
// ============================================================================

/**
 * Récupère les vinyles d'un utilisateur spécifique avec pagination (PUBLIC)
 */
export async function getUserVinyls(
  userId: string,
  type: UserVinylType,
  limit: number = ITEMS_PER_PAGE,
  lastAddedAt?: string,
): Promise<UserVinyl[]> {
  const params = new URLSearchParams()
  params.append('type', type)
  params.append('limit', String(limit))
  if (lastAddedAt) params.append('lastAddedAt', lastAddedAt)

  return apiClient.get<UserVinyl[]>(`/user-vinyls/user/${userId}?${params.toString()}`)
}

/**
 * Compte le nombre total de vinyles d'un utilisateur spécifique (PUBLIC)
 */
export async function getUserVinylsCount(userId: string, type: UserVinylType): Promise<number> {
  const params = new URLSearchParams()
  params.append('type', type)

  const result = await apiClient.get<{ count: number }>(
    `/user-vinyls/user/${userId}/count?${params.toString()}`,
  )
  return result.count
}

/**
 * Obtient les statistiques d'un utilisateur spécifique (PUBLIC)
 */
export async function getVinylStats(userId: string): Promise<VinylStats> {
  return apiClient.get<VinylStats>(`/user-vinyls/user/${userId}/stats`)
}

// ============================================================================
// ROUTES BACKEND DISPONIBLES Auth required
// ============================================================================

/**
 * Vérifie si un vinyle existe dans la collection/wishlist de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export async function hasVinyl(vinylId: string, type: UserVinylType): Promise<boolean> {
  const params = new URLSearchParams()
  params.append('type', type)

  const result = await apiClient.get<{ has: boolean }>(
    `/user-vinyls/check/${vinylId}?${params.toString()}`,
  )
  return result.has
}

/**
 * Ajoute un vinyle à la collection ou wishlist de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export async function addVinylToUser(vinylId: string, type: UserVinylType): Promise<UserVinyl> {
  return apiClient.post<UserVinyl>('/user-vinyls', { vinylId, type })
}

/**
 * Retire un vinyle de la collection ou wishlist de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export async function removeVinylFromUser(vinylId: string, type: UserVinylType): Promise<void> {
  const params = new URLSearchParams()
  params.append('type', type)

  await apiClient.delete<{ success: boolean }>(`/user-vinyls/${vinylId}?${params.toString()}`)
}

/**
 * Déplace un vinyle de la wishlist vers la collection de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export async function moveToCollection(vinylId: string): Promise<UserVinyl> {
  return apiClient.post<UserVinyl>(`/user-vinyls/${vinylId}/move-to-collection`)
}
