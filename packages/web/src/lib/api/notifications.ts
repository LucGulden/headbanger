import { apiClient } from './apiClient'
import { supabase } from '../../supabaseClient'
import { toCamelCase } from '../../utils/caseConverter'
import type { Notification } from '@fillcrate/shared'

/**
 * Options de pagination pour les notifications
 */
interface NotificationsOptions {
  limit?: number
  lastCreatedAt?: string
}

/**
 * Récupère les notifications de l'utilisateur connecté avec pagination
 * Note: userId récupéré automatiquement via le JWT
 */
export async function getNotifications(options: NotificationsOptions = {}): Promise<Notification[]> {
  const params = new URLSearchParams()
  
  if (options.limit) params.append('limit', String(options.limit))
  if (options.lastCreatedAt) params.append('lastCreatedAt', options.lastCreatedAt)

  const queryString = params.toString()
  return apiClient.get<Notification[]>(`/notifications${queryString ? `?${queryString}` : ''}`)
}

/**
 * Récupère le nombre de notifications non lues
 * Note: userId récupéré automatiquement via le JWT
 */
export async function getUnreadCount(): Promise<number> {
  const result = await apiClient.get<{ count: number }>('/notifications/unread-count')
  return result.count
}

/**
 * Marque toutes les notifications comme lues
 * Note: userId récupéré automatiquement via le JWT
 */
export async function markAllAsRead(): Promise<void> {
  await apiClient.put<{ success: boolean }>('/notifications/mark-all-read')
}

/**
 * Subscribe aux nouvelles notifications en temps réel via Supabase Realtime
 * 
 * Note: Cette fonction continue d'utiliser Supabase Realtime car le backend
 * n'a pas encore de WebSocket. C'est une approche hybride temporaire :
 * - Récupération/mutations → Backend NestJS
 * - Real-time updates → Supabase Realtime
 * 
 * @param userId - ID de l'utilisateur (requis pour Supabase filter)
 * @param onNotification - Callback appelé lors d'une nouvelle notification
 * @param onError - Callback appelé en cas d'erreur
 * @returns Fonction de cleanup pour se désabonner
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void,
  onError?: (error: Error) => void,
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(toCamelCase<Notification>(payload.new))
      },
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to notifications')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error:', err)
        onError?.(new Error(`Error subscribing to notifications: ${err?.message || 'Unknown error'}`))
      } else if (status === 'TIMED_OUT') {
        console.error('❌ Subscription timed out')
        onError?.(new Error('Subscription timed out'))
      } else if (status === 'CLOSED') {
        console.log('🔌 Channel closed')
      }
    })

  return () => {
    channel.unsubscribe()
  }
}