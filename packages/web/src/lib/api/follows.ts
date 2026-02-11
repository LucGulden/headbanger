import { apiClient } from '../apiClient'
import type { User, FollowStats } from '@headbanger/shared'

/**
 * Récupère les statistiques de follow d'un utilisateur (endpoint public)
 */
export async function getFollowStats(userId: string): Promise<FollowStats> {
  return apiClient.get<FollowStats>(`/follows/stats/${userId}`)
}

/**
 * Vérifie si l'utilisateur connecté suit un autre utilisateur
 * Note: followerId récupéré automatiquement via le JWT
 */
export async function isFollowing(userId: string): Promise<boolean> {
  const result = await apiClient.get<{ isFollowing: boolean }>(`/follows/check/${userId}`)
  return result.isFollowing
}

/**
 * Suivre un utilisateur
 * Note: followerId récupéré automatiquement via le JWT
 */
export async function followUser(userId: string): Promise<void> {
  await apiClient.post<{ success: boolean }>(`/follows/${userId}`)
}

/**
 * Ne plus suivre un utilisateur
 * Note: followerId récupéré automatiquement via le JWT
 */
export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete<{ success: boolean }>(`/follows/${userId}`)
}

/**
 * Récupère la liste des followers d'un utilisateur (endpoint public)
 */
export async function getFollowers(userId: string): Promise<User[]> {
  return apiClient.get<User[]>(`/follows/followers/${userId}`)
}

/**
 * Récupère la liste des following d'un utilisateur (endpoint public)
 */
export async function getFollowing(userId: string): Promise<User[]> {
  return apiClient.get<User[]>(`/follows/following/${userId}`)
}