import { apiClient } from '../apiClient'
import type { Comment } from '@headbanger/shared'

/**
 * Récupère tous les commentaires d'un post (endpoint public)
 */
export async function getComments(postId: string): Promise<Comment[]> {
  return apiClient.get<Comment[]>(`/comments/post/${postId}`)
}

/**
 * Récupère le nombre de commentaires d'un post (endpoint public)
 */
export async function getCommentsCount(postId: string): Promise<number> {
  const result = await apiClient.get<{ count: number }>(`/comments/post/${postId}/count`)
  return result.count
}

/**
 * Ajoute un commentaire sur un post
 * Note: userId récupéré automatiquement via le JWT
 */
export async function addComment(postId: string, content: string): Promise<Comment> {
  return apiClient.post<Comment>('/comments', { postId, content })
}

/**
 * Supprime un commentaire (seulement si on en est l'auteur)
 * Note: userId vérifié automatiquement côté backend
 */
export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete<{ success: boolean }>(`/comments/${commentId}`)
}