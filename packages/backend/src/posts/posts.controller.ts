import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PostWithDetails, PostType } from '@fillcrate/shared';
import { PostsService } from './posts.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * GET /posts/feed?userId=...&profileFeed=false&limit=20&lastCreatedAt=...
   * Récupère le feed (global ou profil)
   */
  @Get('feed')
  @UseGuards(AuthGuard)
  async getFeedPosts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('userId') userId?: string,
    @Query('profileFeed') profileFeed?: string,
    @Query('limit') limit?: number,
    @Query('lastCreatedAt') lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    // Si profileFeed=true et userId fourni, utiliser userId
    // Sinon utiliser l'utilisateur connecté
    const targetUserId = profileFeed === 'true' && userId ? userId : user.id;
    const isProfileFeed = profileFeed === 'true';

    return this.postsService.getFeedPosts(
      targetUserId,
      isProfileFeed,
      limit ? Number(limit) : 20,
      lastCreatedAt,
    );
  }
}
