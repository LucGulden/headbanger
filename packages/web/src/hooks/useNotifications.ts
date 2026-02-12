import { useState, useEffect, useCallback, useRef } from 'react'
import { getNotifications, getUnreadCount, markAllAsRead } from '../lib/api/notifications'
import { socketClient } from '../lib/socket'
import type { Notification } from '@headbanger/shared'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Ref pour le cursor de pagination
  const cursorRef = useRef<string | undefined>(undefined)

  const LIMIT = 20

  // Charger les notifications avec pagination
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
        setNotifications((prev) => [...prev, ...data])
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
  }, [])

  // Charger le compteur de non-lues
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }, [])

  // Charger plus de notifications (infinite scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    await loadNotifications(false)
  }, [loadingMore, hasMore, loadNotifications])

  // Rafraîchir les notifications
  const refresh = useCallback(async () => {
    await Promise.all([loadNotifications(true), loadUnreadCount()])
  }, [loadNotifications, loadUnreadCount])

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
      setUnreadCount(0)

      await markAllAsRead()
      // L'événement 'notification:read-all' sera émis par le backend via Socket.IO
    } catch (err) {
      console.error('Error marking all as read:', err)
      // Revert on error
      await refresh()
    }
  }, [refresh])

  // Chargement initial
  useEffect(() => {
    const loadInitial = async () => {
      await Promise.all([loadNotifications(true), loadUnreadCount()])
    }

    loadInitial()
  }, [loadNotifications, loadUnreadCount])

  // Écouter les nouvelles notifications via Socket.IO
  useEffect(() => {
    if (!socketClient.isConnected()) return

    const handleNewNotification = (notification: Notification) => {
      // Ajouter la notification en haut de la liste
      setNotifications((prev) => [notification, ...prev])

      // Incrémenter le compteur de non-lues
      setUnreadCount((prev) => prev + 1)
    }

    const handleReadAll = () => {
      // Marquer toutes les notifications comme lues
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
      setUnreadCount(0)
    }

    // Écouter les événements (la room user:${userId} est auto-join côté backend)
    socketClient.on('notification:new', handleNewNotification)
    socketClient.on('notification:read-all', handleReadAll)

    return () => {
      socketClient.off('notification:new', handleNewNotification)
      socketClient.off('notification:read-all', handleReadAll)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    handleMarkAllAsRead,
  }
}
