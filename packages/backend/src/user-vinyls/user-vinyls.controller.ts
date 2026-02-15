import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common'
import { UserVinyl, VinylStats } from '@headbanger/shared'
import type { UserVinylType } from '@headbanger/shared'
import { UserVinylsService } from './user-vinyls.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'
import { CsrfGuard } from '../auth/guards/csrf.guard'

@Controller('user-vinyls')
export class UserVinylsController {
  constructor(private readonly userVinylsService: UserVinylsService) {}

  /**
   * GET /user-vinyls/user/:userId?type=collection&limit=20&lastAddedAt=...
   * Récupère les vinyles d'un utilisateur spécifique (PUBLIC)
   */
  @Get('user/:userId')
  @UseGuards(AuthGuard)
  async getUserVinylsByUserId(
    @Param('userId') userId: string,
    @Query('type') type: UserVinylType,
    @Query('limit') limit?: number,
    @Query('lastAddedAt') lastAddedAt?: string,
  ): Promise<UserVinyl[]> {
    return this.userVinylsService.getUserVinyls(
      userId,
      type,
      limit ? Number(limit) : 20,
      lastAddedAt,
    )
  }

  /**
   * GET /user-vinyls/user/:userId/count?type=collection
   * Compte les vinyles d'un utilisateur spécifique (PUBLIC)
   */
  @Get('user/:userId/count')
  @UseGuards(AuthGuard)
  async getUserVinylsCountByUserId(
    @Param('userId') userId: string,
    @Query('type') type: UserVinylType,
  ): Promise<{ count: number }> {
    const count = await this.userVinylsService.getUserVinylsCount(userId, type)
    return { count }
  }

  /**
   * GET /user-vinyls/user/:userId/stats
   * Statistiques d'un utilisateur spécifique (PUBLIC)
   */
  @Get('user/:userId/stats')
  @UseGuards(AuthGuard)
  async getVinylStatsByUserId(@Param('userId') userId: string): Promise<VinylStats> {
    return this.userVinylsService.getVinylStats(userId)
  }

  /**
   * GET /user-vinyls/check/:vinylId?type=collection
   * Vérifie si un vinyl est dans la collection/wishlist
   */
  @Get('check/:vinylId')
  @UseGuards(AuthGuard)
  async hasVinyl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vinylId') vinylId: string,
    @Query('type') type: UserVinylType,
  ): Promise<{ has: boolean }> {
    const has = await this.userVinylsService.hasVinyl(user.id, vinylId, type)
    return { has }
  }

  /**
   * POST /user-vinyls
   * Ajoute un vinyl à la collection/wishlist
   * Body: { vinylId: string, type: 'collection' | 'wishlist' }
   */
  @Post()
  @UseGuards(AuthGuard, CsrfGuard)
  async addVinylToUser(
    @CurrentUser() user: AuthenticatedUser,
    @Body('vinylId') vinylId: string,
    @Body('type') type: UserVinylType,
  ): Promise<UserVinyl> {
    return this.userVinylsService.addVinylToUser(user.id, vinylId, type)
  }

  /**
   * DELETE /user-vinyls/:vinylId?type=collection
   * Retire un vinyl de la collection/wishlist
   */
  @Delete(':vinylId')
  @UseGuards(AuthGuard, CsrfGuard)
  async removeVinylFromUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vinylId') vinylId: string,
    @Query('type') type: UserVinylType,
  ): Promise<{ success: boolean }> {
    await this.userVinylsService.removeVinylFromUser(user.id, vinylId, type)
    return { success: true }
  }

  /**
   * POST /user-vinyls/:vinylId/move-to-collection
   * Déplace un vinyl de la wishlist vers la collection
   */
  @Post(':vinylId/move-to-collection')
  @UseGuards(AuthGuard, CsrfGuard)
  async moveToCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vinylId') vinylId: string,
  ): Promise<UserVinyl> {
    return this.userVinylsService.moveToCollection(user.id, vinylId)
  }
}
