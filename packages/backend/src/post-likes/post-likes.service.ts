import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';

@Injectable()
export class PostLikesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Ajoute un like à un post
   */
  async likePost(userId: string, postId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.from('post_likes').insert({
      user_id: userId,
      post_id: postId,
    });

    if (error) {
      // Si c'est une erreur de duplication (déjà liké)
      if (error.code === '23505') {
        throw new BadRequestException('You already liked this post');
      }
      throw new Error(`Error liking post: ${error.message}`);
    }
  }

  /**
   * Retire un like d'un post
   */
  async unlikePost(userId: string, postId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

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
      // PGRST116 = not found, c'est OK
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
}