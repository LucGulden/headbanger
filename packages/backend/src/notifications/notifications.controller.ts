import { Controller, Get, Put, Query, UseGuards } from '@nestjs/common'
import { Notification } from '@headbanger/shared'
import { NotificationsService } from './notifications.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'
import { CurrentToken } from 'src/auth/decorators/current-token.decorator'

@Controller('notifications')
@UseGuards(AuthGuard) // Toutes les routes sont protégées
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications?limit=20&lastCreatedAt=...
   * Récupère les notifications de l'utilisateur
   */
  @Get()
  async getNotifications(
    @CurrentToken() token: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('lastCreatedAt') lastCreatedAt?: string,
  ): Promise<Notification[]> {
    return this.notificationsService.getNotifications(
      token,
      user.id,
      limit ? Number(limit) : 20,
      lastCreatedAt,
    )
  }

  /**
   * GET /notifications/unread-count
   * Compte les notifications non lues
   */
  @Get('unread-count')
  async getUnreadCount(
    @CurrentToken() token: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(token, user.id)
    return { count }
  }

  /**
   * PUT /notifications/mark-all-read
   * Marque toutes les notifications comme lues
   */
  @Put('mark-all-read')
  async markAllAsRead(
    @CurrentToken() token: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAllAsRead(token, user.id)
    return { success: true }
  }
}
