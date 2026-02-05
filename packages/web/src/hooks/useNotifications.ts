import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  getNotifications, 
  markAllAsRead,
} from '../lib/api/notifications'
import type { Notification } from '@fillcrate/shared'

interface UseNotificationsReturn {
  notifications: Notification[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: Error | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  handleMarkAllAsRead: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // ✅ Ref pour le cursor de pagination (évite les dépendances instables)
  const cursorRef = useRef<string | undefined>(undefined)
  
  const LIMIT = 20

  // ✅ Plus de dépendance à notifications
  const loadNotifications = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
        setNotifications([])
        setHasMore(true)
        cursorRef.current = undefined
      } else {
        setLoadingMore(true)
      }

      const data = await getNotifications({
        limit: LIMIT,
        lastCreatedAt: cursorRef.current,
      })

      if (reset) {
        setNotifications(data)
      } else {
        setNotifications(prev => [...prev, ...data])
      }

      // Mettre à jour le cursor pour la prochaine page
      if (data.length > 0) {
        cursorRef.current = data[data.length - 1].createdAt
      }

      setHasMore(data.length === LIMIT)
      setError(null)
    } catch (err) {
      console.error('Error loading notifications:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, []) // ✅ Aucune dépendance instable

  // Charger plus de notifications (infinite scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    await loadNotifications(false)
  }, [loadingMore, hasMore, loadNotifications])

  // Rafraîchir les notifications
  const refresh = useCallback(async () => {
    await loadNotifications(true)
  }, [loadNotifications])

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      // ✅ Optimistic update avec "read" (pas "isRead")
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      )

      await markAllAsRead()
    } catch (err) {
      console.error('Error marking all as read:', err)
      // Revert on error
      await loadNotifications(true)
    }
  }, [loadNotifications])

  // Chargement initial
  useEffect(() => {
    loadNotifications(true)
  }, [loadNotifications]) // ✅ Maintenant on peut l'ajouter dans les deps

  return {
    notifications,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    handleMarkAllAsRead,
  }
}