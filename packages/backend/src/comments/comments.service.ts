import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Comment } from '@fillcrate/shared';
import { SupabaseService } from '../common/database/supabase.service';

@Injectable()
export class CommentsService {
  constructor(private readonly supabaseService: SupabaseService) {}

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

    return this.transformCommentData(data);
  }

  /**
   * Supprime un commentaire
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    // Vérifier que le commentaire appartient à l'utilisateur
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    if (comment.user_id !== userId) {
      throw new BadRequestException('You can only delete your own comments');
    }

    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      throw new Error(`Error deleting comment: ${error.message}`);
    }
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
