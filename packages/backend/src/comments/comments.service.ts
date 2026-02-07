import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Comment } from '@fillcrate/shared';
import { SupabaseService } from '../common/database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsService } from 'src/events/events.service';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Récupère tous les commentaires d'un post
   */
  async getPostComments(postId: string): Promise<Comment[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        id,
        user_id,
        post_id,
        content,
        created_at,
        user:users!comments_user_id_fkey (
          uid,
          username,
          photo_url
        )
      `,
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error fetching comments: ${error.message}`);
    }

    return (data || []).map((comment) => this.transformCommentData(comment));
  }

  /**
   * Ajoute un commentaire à un post
   */
  async addComment(postId: string, userId: string, content: string): Promise<Comment> {
    // Valider le contenu
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    if (content.length > 500) {
      throw new BadRequestException('Comment content must not exceed 500 characters');
    }

    const supabase = this.supabaseService.getClient();

    // 1. Créer le commentaire
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
      })
      .select(
        `
        id,
        user_id,
        post_id,
        content,
        created_at,
        user:users!comments_user_id_fkey (
          uid,
          username,
          photo_url
        )
      `,
      )
      .single();

    if (error) {
      throw new Error(`Error adding comment: ${error.message}`);
    }

    const comment = this.transformCommentData(data);

    // 2. Émettre l'événement Socket.IO
    this.eventsService.emitToPost(postId, 'post:comment:added', {
      postId,
      comment,
    });

    // 3. Créer la notification (async, non-bloquant)
    this.createCommentNotification(userId, postId, data.id);

    return comment;
  }

  /**
   * Supprime un commentaire
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Vérifier que le commentaire appartient à l'utilisateur
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, post_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    if (comment.user_id !== userId) {
      throw new BadRequestException('You can only delete your own comments');
    }

    const postId = comment.post_id;

    // 1. Supprimer la notification AVANT de supprimer le commentaire
    await this.notificationsService.deleteByComment(commentId);

    // 2. Supprimer le commentaire
    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      throw new Error(`Error deleting comment: ${error.message}`);
    }

    // 3. Émettre l'événement Socket.IO
    this.eventsService.emitToPost(postId, 'post:comment:deleted', {
      postId,
      commentId,
    });
  }

  /**
   * Compte les commentaires d'un post
   */
  async getCommentsCount(postId: string): Promise<number> {
    const supabase = this.supabaseService.getClient();

    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      throw new Error(`Error counting comments: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Crée une notification de commentaire (privée, async)
   */
  private async createCommentNotification(
    userId: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      // Récupérer l'auteur du post
      const { data: post, error } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (error || !post) {
        this.logger.warn(`Post ${postId} not found for comment notification`);
        return;
      }

      // Ne pas notifier si on commente son propre post
      if (userId === post.user_id) {
        return;
      }

      // Créer la notification
      await this.notificationsService.createNotification(
        post.user_id, // destinataire
        'post_comment',
        userId, // acteur
        postId,
        commentId,
      );
    } catch (error) {
      this.logger.error('Failed to create comment notification', error);
      // Ne pas faire échouer le commentaire si la notification échoue
    }
  }

  /**
   * Transformation DB → Comment (camelCase)
   */
  private transformCommentData(data: any): Comment {
    return {
      id: data.id,
      postId: data.post_id,
      content: data.content,
      createdAt: data.created_at,
      user: {
        uid: data.user?.uid || data.user_id,
        username: data.user?.username || 'Unknown',
        photoUrl: data.user?.photo_url,
      },
    };
  }
}
