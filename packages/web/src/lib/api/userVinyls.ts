import { apiClient } from './apiClient'
import type { UserVinyl, UserVinylType, VinylStats } from '@fillcrate/shared'

const ITEMS_PER_PAGE = 20

// ============================================================================
// ROUTES BACKEND DISPONIBLES (Auth required)
// ============================================================================

/**
 * Récupère les vinyles de l'utilisateur connecté avec pagination
 * Note: userId récupéré automatiquement via le JWT
 */
export async function getUserVinyls(
  type: UserVinylType,
  limit: number = ITEMS_PER_PAGE,
  lastAddedAt?: string,
): Promise<UserVinyl[]> {
  const params = new URLSearchParams()
  params.append('type', type)
  params.append('limit', String(limit))
  if (lastAddedAt) params.append('lastAddedAt', lastAddedAt)

  return apiClient.get<UserVinyl[]>(`/user-vinyls?${params.toString()}`)
}

/**
 * Compte le nombre total de vinyles de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export async function getUserVinylsCount(type: UserVinylType): Promise<number> {
  const params = new URLSearchParams()
  params.append('type', type)
  
  const result = await apiClient.get<{ count: number }>(`/user-vinyls/count?${params.toString()}`)
  return result.count
}

/**
 * Obtient les statistiques des vinyles de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export async function getVinylStats(): Promise<VinylStats> {
  return apiClient.get<VinylStats>('/user-vinyls/stats')
}

/**
 * Vérifie si un vinyle existe dans la collection/wishlist de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export async function hasVinyl(vinylId: string, type: UserVinylType): Promise<boolean> {
  const params = new URLSearchParams()
  params.append('type', type)
  
  const result = await apiClient.get<{ has: boolean }>(`/user-vinyls/check/${vinylId}?${params.toString()}`)
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