import { useState, useEffect, useCallback } from 'react'
import type { PostWithDetails } from '@headbanger/shared'
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

  const fetchInitialPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let initialPosts: PostWithDetails[]

      if (profileFeed && userId) {
        initialPosts = await getProfileFeed({
          userId,
          limit: INITIAL_LOAD_COUNT,
        })
      } else {
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
        morePosts = await getProfileFeed({
          userId,
          limit: LOAD_MORE_COUNT,
          lastCreatedAt: lastPost.createdAt,
        })
      } else {
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

    try {
      let initialPosts: PostWithDetails[]

      if (profileFeed && userId) {
        initialPosts = await getProfileFeed({
          userId,
          limit: INITIAL_LOAD_COUNT,
        })
      } else {
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

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    refreshing,
    loadMore: loadMorePosts,
    refresh: refreshFeed,
  }
}