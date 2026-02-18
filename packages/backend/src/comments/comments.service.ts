import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { Comment } from '@headbanger/shared'
import { SupabaseService } from '../common/database/supabase.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CommentQueryResult } from './comments.types'

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name)

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getPostComments(postId: string): Promise<Comment[]> {
    const supabase = this.supabaseService.getClient()

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
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Error fetching comments: ${error.message}`)
    }

    return (data as unknown as CommentQueryResult[]).map((comment) =>
      this.transformCommentData(comment),
    )
  }

  async addComment(
    token: string,
    postId: string,
    userId: string,
    content: string,
  ): Promise<Comment> {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty')
    }

    if (content.length > 500) {
      throw new BadRequestException('Comment content must not exceed 500 characters')
    }

    const supabase = this.supabaseService.getClientWithAuth(token)

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
      .single()

    if (error) {
      throw new Error(`Error adding comment: ${error.message}`)
    }

    const comment = this.transformCommentData(data as unknown as CommentQueryResult)

    await this.createCommentNotification(token, userId, postId, data.id)

    return comment
  }

  async deleteComment(token: string, commentId: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token)

    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, post_id')
      .eq('id', commentId)
      .single()

    if (fetchError || !comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`)
    }

    if (comment.user_id !== userId) {
      throw new BadRequestException('You can only delete your own comments')
    }

    await this.notificationsService.deleteByComment(token, commentId)

    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (error) {
      throw new Error(`Error deleting comment: ${error.message}`)
    }
  }

  async getCommentsCount(postId: string): Promise<number> {
    const supabase = this.supabaseService.getClient()

    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (error) {
      throw new Error(`Error counting comments: ${error.message}`)
    }

    return count ?? 0
  }

  private async createCommentNotification(
    token: string,
    userId: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    try {
      const supabase = this.supabaseService.getClientWithAuth(token)

      const { data: post, error } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (error || !post) {
        this.logger.warn(`Post ${postId} not found for comment notification`)
        return
      }

      if (userId === post.user_id) return

      await this.notificationsService.createNotification(
        token,
        post.user_id,
        'post_comment',
        userId,
        postId,
        commentId,
      )
    } catch (error) {
      this.logger.error('Failed to create comment notification', error)
    }
  }

  private transformCommentData(data: CommentQueryResult): Comment {
    return {
      id: data.id,
      postId: data.post_id,
      content: data.content,
      createdAt: data.created_at,
      user: {
        uid: data.user.uid,
        username: data.user.username,
        photoUrl: data.user.photo_url,
      },
    }
  }
}
