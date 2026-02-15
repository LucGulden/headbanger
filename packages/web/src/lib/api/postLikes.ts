import { apiClient } from '../apiClient'

/**
 * Ajoute un like à un post
 * Note: userId récupéré automatiquement via le JWT
 */
export async function likePost(postId: string): Promise<void> {
  await apiClient.post<{ success: boolean }>(`/post-likes/${postId}`)
}

/**
 * Retire un like d'un post
 * Note: userId récupéré automatiquement via le JWT
 */
export async function unlikePost(postId: string): Promise<void> {
  await apiClient.delete<{ success: boolean }>(`/post-likes/${postId}`)
}

/**
 * Vérifie si l'utilisateur a liké un post
 * Note: userId récupéré automatiquement via le JWT
 */
export async function hasLikedPost(postId: string): Promise<boolean> {
  const result = await apiClient.get<{ hasLiked: boolean }>(`/post-likes/check/${postId}`)
  return result.hasLiked
}

/**
 * Récupère le nombre de likes d'un post (endpoint public)
 */
export async function getLikesCount(postId: string): Promise<number> {
  const result = await apiClient.get<{ count: number }>(`/post-likes/count/${postId}`)
  return result.count
}
