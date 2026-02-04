import { apiClient } from './apiClient'
import type { PostWithDetails } from '@fillcrate/shared'

// src/lib/api/posts.ts

/**
 * Options pour le feed global
 */
interface GlobalFeedOptions {
  limit?: number
  lastCreatedAt?: string
}

/**
 * Options pour le feed d'un profil
 */
interface ProfileFeedOptions {
  userId: string
  limit?: number
  lastCreatedAt?: string
}

/**
 * Récupère le feed global (utilisateur connecté + ceux qu'il suit)
 * Auth REQUIRED
 */
export async function getGlobalFeed(options: GlobalFeedOptions = {}): Promise<PostWithDetails[]> {
  const params = new URLSearchParams()
  
  if (options.limit) params.append('limit', String(options.limit))
  if (options.lastCreatedAt) params.append('lastCreatedAt', options.lastCreatedAt)

  const queryString = params.toString()
  return apiClient.get<PostWithDetails[]>(`/posts/feed${queryString ? `?${queryString}` : ''}`)
}

/**
 * Récupère le feed d'un profil spécifique (public)
 * Auth NOT required
 */
export async function getProfileFeed(options: ProfileFeedOptions): Promise<PostWithDetails[]> {
  const params = new URLSearchParams()
  
  if (options.limit) params.append('limit', String(options.limit))
  if (options.lastCreatedAt) params.append('lastCreatedAt', options.lastCreatedAt)

  const queryString = params.toString()
  return apiClient.get<PostWithDetails[]>(
    `/posts/profile/${options.userId}${queryString ? `?${queryString}` : ''}`
  )
}