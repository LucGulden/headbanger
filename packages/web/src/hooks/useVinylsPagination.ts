import { useState, useEffect, useCallback } from 'react'
import { getUserVinyls, getUserVinylsCount } from '../lib/api/userVinyls'
import type { UserVinylType, UserVinyl } from '@headbanger/shared'

interface UseVinylsPaginationParams {
  userId: string
  type: UserVinylType
  pageSize?: number
}

interface UseVinylsPaginationReturn {
  vinyls: UserVinyl[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: Error | null
  total: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useVinylsPagination({
  userId,
  type,
  pageSize = 20,
}: UseVinylsPaginationParams): UseVinylsPaginationReturn {
  const [vinyls, setVinyls] = useState<UserVinyl[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  // Chargement initial
  const loadInitial = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const [vinylsData, count] = await Promise.all([
        getUserVinyls(userId, type, pageSize),
        getUserVinylsCount(userId, type),
      ])

      setVinyls(vinylsData)
      setTotal(count)
      setHasMore(vinylsData.length >= pageSize)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }, [userId, type, pageSize])

  // Charger plus de vinyles
  const loadMore = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return

    setLoadingMore(true)
    setError(null)

    try {
      const lastVinyl = vinyls[vinyls.length - 1]
      const lastAddedAt = lastVinyl?.addedAt

      const moreVinyls = await getUserVinyls(userId, type, pageSize, lastAddedAt)

      setVinyls((prev) => [...prev, ...moreVinyls])
      setHasMore(moreVinyls.length >= pageSize)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement'))
    } finally {
      setLoadingMore(false)
    }
  }, [userId, type, pageSize, vinyls, loadingMore, hasMore])

  // Rafraîchir la liste
  const refresh = useCallback(async () => {
    await loadInitial()
  }, [loadInitial])

  // Chargement initial au mount
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  return {
    vinyls,
    loading,
    loadingMore,
    hasMore,
    error,
    total,
    loadMore,
    refresh,
  }
}
