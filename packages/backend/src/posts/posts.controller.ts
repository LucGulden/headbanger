import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { PostWithDetails, PostType } from '@headbanger/shared';
import { PostsService } from './posts.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * GET /posts/feed
   * Feed global de l'utilisateur connecté (ses posts + ceux qu'il suit)
   * Auth REQUIRED
   */
  @Get('feed')
  @UseGuards(AuthGuard)
  async getGlobalFeed(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: number,
    @Query('lastCreatedAt') lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    return this.postsService.getGlobalFeed(user.id, limit ? Number(limit) : 20, lastCreatedAt);
  }

  /**
   * GET /posts/profile/:userId
   * Feed d'un profil spécifique (public)
   * Auth NOT required
   */
  @Get('profile/:userId')
  async getProfileFeed(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('lastCreatedAt') lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    return this.postsService.getProfileFeed(userId, limit ? Number(limit) : 20, lastCreatedAt);
  }
}
