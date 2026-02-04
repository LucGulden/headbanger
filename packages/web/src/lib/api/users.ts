import { apiClient } from './apiClient'
import type { User } from '@fillcrate/shared'

// ============================================================================
// VALIDATION LOCALE (pas besoin du backend)
// ============================================================================

/**
 * Valide un username localement
 * Règles : 3-20 caractères, lettres, chiffres, - et _
 */
export function validateUsername(username: string): boolean {
  const regex = /^[a-zA-Z0-9_-]{3,20}$/
  return regex.test(username)
}

/**
 * Valide la bio localement
 * Max 200 caractères
 */
export function validateBio(bio: string): boolean {
  return bio.length <= 200
}

// ============================================================================
// ROUTES BACKEND DISPONIBLES - Auth required
// ============================================================================

/**
 * Récupère le profil de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/users/me')
}

/**
 * Met à jour le profil de l'utilisateur connecté
 * Note: userId récupéré automatiquement via le JWT
 */
export interface UpdateUserProfileData {
  username?: string
  firstName?: string
  lastName?: string
  bio?: string
  photoUrl?: string
}

export async function updateUserProfile(data: UpdateUserProfileData): Promise<User> {
  return apiClient.put<User>('/users/me', data)
}

// ============================================================================
// ROUTES BACKEND DISPONIBLES - Public
// ============================================================================

/**
 * Récupère un utilisateur par son username (public)
 */
export async function getUserByUsername(username: string): Promise<User> {
  return apiClient.get<User>(`/users/username/${username}`)
}

/**
 * Recherche d'utilisateurs par username, nom ou prénom (public)
 */
export async function searchUsers(
  query: string,
  limit: number = 20,
  offset: number = 0,
): Promise<User[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const params = new URLSearchParams()
  params.append('query', query)
  params.append('limit', String(limit))
  params.append('offset', String(offset))

  return apiClient.get<User[]>(`/users/search?${params.toString()}`)
}

/**
 * Vérifie la disponibilité d'un username (public)
 * @param username - Username à vérifier
 * @param excludeUserId - ID utilisateur à exclure (optionnel, pour édition de profil)
 */
export async function checkUsernameAvailability(
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  const params = new URLSearchParams()
  params.append('username', username)
  if (excludeUserId) params.append('excludeUserId', excludeUserId)

  const result = await apiClient.get<{ available: boolean }>(
    `/users/check-username?${params.toString()}`
  )
  return result.available
}
