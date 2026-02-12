import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common'
import { PostLikesService } from './post-likes.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'
import { CurrentToken } from '../auth/decorators/current-token.decorator'

@Controller('post-likes')
export class PostLikesController {
  constructor(private readonly postLikesService: PostLikesService) {}

  /**
   * POST /post-likes/:postId
   * Ajoute un like à un post
   */
  @Post(':postId')
  @UseGuards(AuthGuard)
  async likePost(
    @CurrentToken() token: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
  ): Promise<{ success: boolean }> {
    await this.postLikesService.likePost(token, user.id, postId)
    return { success: true }
  }

  /**
   * DELETE /post-likes/:postId
   * Retire un like d'un post
   */
  @Delete(':postId')
  @UseGuards(AuthGuard)
  async unlikePost(
    @CurrentToken() token: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
  ): Promise<{ success: boolean }> {
    await this.postLikesService.unlikePost(token, user.id, postId)
    return { success: true }
  }

  /**
   * GET /post-likes/check/:postId
   * Vérifie si l'utilisateur a liké un post
   */
  @Get('check/:postId')
  @UseGuards(AuthGuard)
  async hasLikedPost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
  ): Promise<{ hasLiked: boolean }> {
    const hasLiked = await this.postLikesService.hasLikedPost(user.id, postId)
    return { hasLiked }
  }

  /**
   * GET /post-likes/count/:postId
   * Récupère le nombre de likes d'un post (public)
   */
  @Get('count/:postId')
  async getLikesCount(@Param('postId') postId: string): Promise<{ count: number }> {
    const count = await this.postLikesService.getLikesCount(postId)
    return { count }
  }
}
