import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostLikesService {
  private readonly logger = new Logger(PostLikesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Ajoute un like à un post
   */
  async likePost(token: string, userId: string, postId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token);

    // 1. Créer le like
    const { error } = await supabase.from('post_likes').insert({
      user_id: userId,
      post_id: postId,
    });

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('You already liked this post');
      }
      throw new Error(`Error liking post: ${error.message}`);
    }

    // 4. Créer la notification (async, non-bloquant)
    await this.createLikeNotification(token, userId, postId);
  }

  /**
   * Retire un like d'un post
   */
  async unlikePost(token: string, userId: string, postId: string): Promise<void> {
    // 1. Supprimer la notification AVANT de supprimer le like
    await this.notificationsService.deleteByLike(token, userId, postId);

    // 2. Supprimer le like
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) {
      throw new Error(`Error unliking post: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur a liké un post
   */
  async hasLikedPost(userId: string, postId: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error checking like: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Récupère le nombre de likes d'un post
   */
  async getLikesCount(postId: string): Promise<number> {
    const supabase = this.supabaseService.getClient();

    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      throw new Error(`Error counting likes: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Crée une notification de like (privée, async)
   */
  private async createLikeNotification(
    token: string,
    userId: string,
    postId: string,
  ): Promise<void> {
    try {
      const supabase = this.supabaseService.getClientWithAuth(token);

      // Récupérer l'auteur du post
      const { data: post, error } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (error || !post) {
        this.logger.warn(`Post ${postId} not found for like notification`);
        return;
      }

      // Ne pas notifier si on like son propre post
      if (userId === post.user_id) {
        return;
      }

      // Créer la notification
      await this.notificationsService.createNotification(
        token,
        post.user_id, // destinataire
        'post_like',
        userId, // acteur
        postId,
      );
    } catch (error) {
      this.logger.error('Failed to create like notification', error);
      // Ne pas faire échouer le like si la notification échoue
    }
  }
}
