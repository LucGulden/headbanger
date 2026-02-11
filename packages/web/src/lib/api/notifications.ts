import { apiClient } from '../apiClient'
import type { Notification } from '@headbanger/shared'

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