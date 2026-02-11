import { create } from 'zustand'
import { getUnreadCount } from '../lib/api/notifications'
import { socketClient } from '../lib/socket'
import type { Notification } from '@fillcrate/shared'

interface NotificationsStore {
  unreadCount: number
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  increment: () => void
  reset: () => void
  cleanup: () => void
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  unreadCount: 0,
  isInitialized: false,

  initialize: async () => {
    // Éviter la double initialisation
    if (get().isInitialized) {
      console.log('⚠️ Notifications store déjà initialisé')
      return
    }

    try {
      // 1. Charger le count initial via l'API backend
      const count = await getUnreadCount()
      set({ unreadCount: count })

      // 2. Écouter les événements Socket.IO
      const handleNewNotification = (notification: Notification) => {
        console.log('🔔 Nouvelle notification:', notification)
        set((state) => ({ unreadCount: state.unreadCount + 1 }))
      }

      const handleReadAll = () => {
        console.log('✅ Toutes les notifications lues')
        set({ unreadCount: 0 })
      }

      // ✅ AJOUTER : Écouter les suppressions de notifications
      const handleNotificationDeleted = (data: any) => {
        console.log('🗑️ Notification supprimée:', data)
        set((state) => ({ 
          unreadCount: Math.max(0, state.unreadCount - 1) // Décrémenter (min 0)
        }))
      }

      // La room user:${userId} est auto-join côté backend
      socketClient.on('notification:new', handleNewNotification)
      socketClient.on('notification:read-all', handleReadAll)
      socketClient.on('notification:deleted', handleNotificationDeleted) // ← AJOUTER

      set({ isInitialized: true })

      console.log('✅ Notifications store initialisé')
    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error)
    }
  },

  increment: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }))
  },

  reset: () => {
    set({ unreadCount: 0 })
  },

  cleanup: () => {
    // Retirer les listeners Socket.IO
    socketClient.off('notification:new')
    socketClient.off('notification:read-all')
    socketClient.off('notification:deleted') // ← AJOUTER

    set({ 
      isInitialized: false,
      unreadCount: 0,
    })

    console.log('🧹 Notifications store nettoyé')
  },
}))
