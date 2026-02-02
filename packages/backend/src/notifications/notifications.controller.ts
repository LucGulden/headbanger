import { Controller, Get, Put, Param, Query, UseGuards } from '@nestjs/common';
import { Notification } from '@fillcrate/shared';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

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
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('lastCreatedAt') lastCreatedAt?: string,
  ): Promise<Notification[]> {
    return this.notificationsService.getNotifications(
      user.id,
      limit ? Number(limit) : 20,
      lastCreatedAt,
    );
  }

  /**
   * GET /notifications/unread-count
   * Compte les notifications non lues
   */
  @Get('unread-count')
  async getUnreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  /**
   * PUT /notifications/mark-all-read
   * Marque toutes les notifications comme lues
   */
  @Put('mark-all-read')
  async markAllAsRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true };
  }

  /**
   * PUT /notifications/:id/read
   * Marque une notification comme lue
   */
  @Put(':id/read')
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAsRead(id, user.id);
    return { success: true };
  }
}