import { apiClient } from './apiClient'
import { supabase } from '../../supabaseClient'

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

/**
 * S'abonne aux likes d'un post en temps réel via Supabase Realtime
 * 
 * Note: Cette fonction continue d'utiliser Supabase Realtime car le backend
 * n'a pas encore de WebSocket. C'est une approche hybride temporaire :
 * - Mutations (like/unlike) → Backend NestJS
 * - Real-time updates → Supabase Realtime
 * 
 * @param postId - ID du post à surveiller
 * @param onUpdate - Callback appelé quand le compteur change
 * @param onError - Callback appelé en cas d'erreur
 * @returns Fonction de cleanup pour se désabonner
 */
export function subscribeToPostLikes(
  postId: string,
  onUpdate: (likesCount: number) => void,
  onError: (error: Error) => void,
): () => void {
  // Charger le compteur initial via l'API backend
  const loadLikesCount = async () => {
    try {
      const count = await getLikesCount(postId)
      onUpdate(count)
    } catch (error) {
      onError(error as Error)
    }
  }

  // Charger immédiatement
  loadLikesCount()

  // S'abonner aux changements en temps réel via Supabase
  const channel = supabase
    .channel(`post-likes:${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, DELETE
        schema: 'public',
        table: 'post_likes',
        filter: `post_id=eq.${postId}`,
      },
      () => {
        // Recharger le compteur via l'API quand il y a un changement
        loadLikesCount()
      },
    )
    .subscribe()

  // Fonction de désabonnement
  return () => {
    channel.unsubscribe()
  }
}