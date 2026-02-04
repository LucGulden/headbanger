import { apiClient } from './apiClient'
import { supabase } from '../../supabaseClient'
import { toCamelCase } from '../../utils/caseConverter'
import type { Comment } from '@fillcrate/shared'

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

/**
 * S'abonne aux commentaires d'un post en temps réel via Supabase Realtime
 * 
 * Note: Cette fonction continue d'utiliser Supabase Realtime car le backend
 * n'a pas encore de WebSocket. C'est une approche hybride temporaire :
 * - Mutations (add/delete) → Backend NestJS
 * - Real-time updates → Supabase Realtime
 * 
 * @param postId - ID du post à surveiller
 * @param onData - Callback appelé avec la liste des commentaires
 * @param onError - Callback appelé en cas d'erreur
 * @returns Fonction de cleanup pour se désabonner
 */
export function subscribeToPostComments(
  postId: string,
  onData: (comments: Comment[]) => void,
  onError: (error: Error) => void,
): () => void {
  // Charger les commentaires initiaux via Supabase (le backend retourne Comment sans user)
  const loadComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        user_id,
        post_id,
        content,
        created_at,
        user:users!user_id (
          uid,
          username,
          photo_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      onError(error)
      return
    }

    // Convertir en camelCase
    const comments = toCamelCase<any[]>(data || [])
    
    // Restructurer pour matcher CommentWithUser
    const transformedComments: Comment[] = comments.map((comment: any) => ({
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        uid: comment.user.uid,
        username: comment.user.username,
        photoUrl: comment.user.photoUrl,
      },
    }))

    onData(transformedComments)
  }

  // Charger immédiatement
  loadComments()

  // S'abonner aux changements en temps réel
  const channel = supabase
    .channel(`comments:${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      },
      () => {
        // Recharger tous les commentaires quand il y a un changement
        loadComments()
      },
    )
    .subscribe()

  // Fonction de désabonnement
  return () => {
    channel.unsubscribe()
  }
}

/**
 * S'abonne au compteur de commentaires d'un post en temps réel
 * Plus léger que subscribeToPostComments car ne charge pas les commentaires complets
 * 
 * @param postId - ID du post à surveiller
 * @param onUpdate - Callback appelé avec le nombre de commentaires
 * @param onError - Callback appelé en cas d'erreur
 * @returns Fonction de cleanup pour se désabonner
 */
export function subscribeToPostCommentsCount(
  postId: string,
  onUpdate: (count: number) => void,
  onError: (error: Error) => void,
): () => void {
  // Charger le compteur initial via l'API backend
  const loadCount = async () => {
    try {
      const count = await getCommentsCount(postId)
      onUpdate(count)
    } catch (error) {
      onError(error as Error)
    }
  }

  // Charger immédiatement
  loadCount()

  // S'abonner aux changements en temps réel via Supabase
  const channel = supabase
    .channel(`comments-count:${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      },
      () => {
        // Recharger le compteur via l'API quand il y a un changement
        loadCount()
      },
    )
    .subscribe()

  // Fonction de désabonnement
  return () => {
    channel.unsubscribe()
  }
}