import { useState, useEffect, useCallback } from 'react'
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
  
  const LIMIT = 20

  // Charger les notifications initiales
  const loadNotifications = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
        setNotifications([])
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      const lastNotification = reset ? undefined : notifications[notifications.length - 1]
      
      // ✅ Plus besoin de userId
      const data = await getNotifications({
        limit: LIMIT,
        lastCreatedAt: lastNotification?.createdAt,
      })

      if (reset) {
        setNotifications(data)
      } else {
        setNotifications(prev => [...prev, ...data])
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
  }, [notifications])

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
      // Optimistic update
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true })), // ✅ isRead au lieu de read
      )

      await markAllAsRead() // ✅ Plus besoin de userId
    } catch (err) {
      console.error('Error marking all as read:', err)
      // Revert on error
      await loadNotifications(true)
    }
  }, [loadNotifications])

  // Chargement initial
  useEffect(() => {
    loadNotifications(true)
  }, []) // ✅ Pas de dépendance userId, le backend le récupère du JWT

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