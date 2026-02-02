import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Comment } from '@fillcrate/shared';
import { CommentsService } from './comments.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * GET /comments/post/:postId
   * Récupère tous les commentaires d'un post (public)
   */
  @Get('post/:postId')
  async getPostComments(@Param('postId') postId: string): Promise<Comment[]> {
    return this.commentsService.getPostComments(postId);
  }

  /**
   * GET /comments/post/:postId/count
   * Compte les commentaires d'un post (public)
   */
  @Get('post/:postId/count')
  async getCommentsCount(@Param('postId') postId: string): Promise<{ count: number }> {
    const count = await this.commentsService.getCommentsCount(postId);
    return { count };
  }

  /**
   * POST /comments
   * Ajoute un commentaire
   * Body: { postId: string, content: string }
   */
  @Post()
  @UseGuards(AuthGuard)
  async addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Body('postId') postId: string,
    @Body('content') content: string,
  ): Promise<Comment> {
    return this.commentsService.addComment(postId, user.id, content);
  }

  /**
   * DELETE /comments/:id
   * Supprime un commentaire (seulement le sien)
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.commentsService.deleteComment(id, user.id);
    return { success: true };
  }
}