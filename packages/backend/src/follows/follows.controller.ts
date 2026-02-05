import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { User, FollowStats } from '@fillcrate/shared';
import { FollowsService } from './follows.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  /**
   * GET /follows/stats/:userId
   * Récupère les statistiques de follow (public)
   */
  @Get('stats/:userId')
  async getFollowStats(@Param('userId') userId: string): Promise<FollowStats> {
    return this.followsService.getFollowStats(userId);
  }

  /**
   * GET /follows/check/:userId
   * Vérifie si l'utilisateur connecté suit un autre utilisateur
   */
  @Get('check/:userId')
  @UseGuards(AuthGuard)
  async isFollowing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.followsService.isFollowing(user.id, userId);
    return { isFollowing };
  }

  /**
   * POST /follows/:userId
   * Suivre un utilisateur
   */
  @Post(':userId')
  @UseGuards(AuthGuard)
  async followUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<{ success: boolean }> {
    await this.followsService.followUser(user.id, userId);
    return { success: true };
  }

  /**
   * DELETE /follows/:userId
   * Ne plus suivre un utilisateur
   */
  @Delete(':userId')
  @UseGuards(AuthGuard)
  async unfollowUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<{ success: boolean }> {
    await this.followsService.unfollowUser(user.id, userId);
    return { success: true };
  }

  /**
   * GET /follows/followers/:userId
   * Liste des followers d'un utilisateur (public)
   */
  @Get('followers/:userId')
  async getFollowers(@Param('userId') userId: string): Promise<User[]> {
    return this.followsService.getFollowers(userId);
  }

  /**
   * GET /follows/following/:userId
   * Liste des following d'un utilisateur (public)
   */
  @Get('following/:userId')
  async getFollowing(@Param('userId') userId: string): Promise<User[]> {
    return this.followsService.getFollowing(userId);
  }
}
