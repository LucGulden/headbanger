import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { toCamelCase } from '../utils/caseConverter'
import type { PostWithDetails } from '@fillcrate/shared'
import { getGlobalFeed, getProfileFeed } from '../lib/api/posts'

const INITIAL_LOAD_COUNT = 15
const LOAD_MORE_COUNT = 10

export interface UseFeedPaginationReturn {
  posts: PostWithDetails[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: Error | null
  refreshing: boolean
  newPostsAvailable: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook pour gérer la pagination d'un feed (global ou profil)
 * 
 * @param userId - ID de l'utilisateur du profil (requis seulement si profileFeed = true)
 * @param profileFeed - true = feed d'un profil spécifique, false = feed global
 */
export function useFeedPagination(userId?: string, profileFeed: boolean = false): UseFeedPaginationReturn {
  const [posts, setPosts] = useState<PostWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [newPostsAvailable, setNewPostsAvailable] = useState(0)

  const fetchInitialPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let initialPosts: PostWithDetails[]

      if (profileFeed && userId) {
        // Feed d'un profil spécifique
        initialPosts = await getProfileFeed({
          userId,
          limit: INITIAL_LOAD_COUNT,
        })
      } else {
        // Feed global (utilisateur connecté + ceux qu'il suit)
        initialPosts = await getGlobalFeed({
          limit: INITIAL_LOAD_COUNT,
        })
      }

      setPosts(initialPosts)
      setHasMore(initialPosts.length === INITIAL_LOAD_COUNT)
    } catch (err) {
      console.error('Erreur lors du chargement du feed:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId, profileFeed])

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return

    setLoadingMore(true)

    try {
      const lastPost = posts[posts.length - 1]
      let morePosts: PostWithDetails[]

      if (profileFeed && userId) {
        // Feed d'un profil spécifique
        morePosts = await getProfileFeed({
          userId,
          limit: LOAD_MORE_COUNT,
          lastCreatedAt: lastPost.createdAt,
        })
      } else {
        // Feed global
        morePosts = await getGlobalFeed({
          limit: LOAD_MORE_COUNT,
          lastCreatedAt: lastPost.createdAt,
        })
      }

      if (morePosts.length === 0) {
        setHasMore(false)
      } else {
        setPosts((prev) => [...prev, ...morePosts])
        setHasMore(morePosts.length === LOAD_MORE_COUNT)
      }
    } catch (err) {
      console.error('Erreur lors du chargement de plus de posts:', err)
      setError(err as Error)
    } finally {
      setLoadingMore(false)
    }
  }

  const refreshFeed = async () => {
    setRefreshing(true)
    setError(null)
    setNewPostsAvailable(0)

    try {
      let initialPosts: PostWithDetails[]

      if (profileFeed && userId) {
        // Feed d'un profil spécifique
        initialPosts = await getProfileFeed({
          userId,
          limit: INITIAL_LOAD_COUNT,
        })
      } else {
        // Feed global
        initialPosts = await getGlobalFeed({
          limit: INITIAL_LOAD_COUNT,
        })
      }

      setPosts(initialPosts)
      setHasMore(initialPosts.length === INITIAL_LOAD_COUNT)
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du feed:', err)
      setError(err as Error)
    } finally {
      setRefreshing(false)
    }
  }

  // Chargement initial
  useEffect(() => {
    fetchInitialPosts()
  }, [fetchInitialPosts])

  // Écoute en temps réel des nouveaux posts avec Supabase Realtime
  useEffect(() => {
    if (posts.length === 0) return

    const newestPostTime = posts[0].createdAt

    // Fonction pour vérifier si un post doit être dans le feed
    const shouldIncludePost = async (postUserId: string, connectedUserId: string): Promise<boolean> => {
      if (profileFeed && userId) {
        // Feed de profil : seulement les posts de l'utilisateur du profil
        return postUserId === userId
      } else {
        // Feed global : posts des utilisateurs suivis + les siens
        if (postUserId === connectedUserId) return true

        // Vérifier si on suit cet utilisateur
        const { data, error } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', connectedUserId)
          .eq('following_id', postUserId)

        if (error) {
          console.error('Erreur lors de la vérification du follow:', error)
          return false
        }

        return data && data.length > 0
      }
    }

    // S'abonner aux nouveaux posts
    const channel = supabase
      .channel('new-posts-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          // Récupérer l'utilisateur connecté
          const { data: { session } } = await supabase.auth.getSession()
          if (!session?.user) return

          const connectedUserId = session.user.id

          // ⚠️ Les données Realtime arrivent en snake_case depuis Supabase
          const newPostRaw = payload.new as any
          
          // Convertir en camelCase pour comparer avec nos données
          const newPost = toCamelCase(newPostRaw)
          
          if (newPost.createdAt > newestPostTime) {
            // Vérifier si ce post doit être inclus dans le feed
            const shouldInclude = await shouldIncludePost(newPost.userId, connectedUserId)
            
            if (shouldInclude) {
              // Incrémenter le compteur de nouveaux posts
              setNewPostsAvailable((prev) => prev + 1)
            }
          }
        },
      )
      .subscribe()

    // Cleanup : se désabonner quand le composant est démonté
    return () => {
      channel.unsubscribe()
    }
  }, [posts, userId, profileFeed])

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    refreshing,
    newPostsAvailable,
    loadMore: loadMorePosts,
    refresh: refreshFeed,
  }
}