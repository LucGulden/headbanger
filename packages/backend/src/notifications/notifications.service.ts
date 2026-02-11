import { Injectable } from '@nestjs/common';
import { Notification } from '@fillcrate/shared';
import { SupabaseService } from '../common/database/supabase.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Récupère les notifications d'un utilisateur avec pagination
   */
  async getNotifications(
    token: string,
    userId: string,
    limit: number = 20,
    lastCreatedAt?: string,
  ): Promise<Notification[]> {
    const supabase = this.supabaseService.getClientWithAuth(token);

    let query = supabase
      .from('notifications')
      .select(
        `
        *,
        actor:users!notifications_actor_id_fkey (
          uid,
          username,
          first_name,
          last_name,
          photo_url
        ),
        post:posts!notifications_post_id_fkey (
          id,
          vinyl_id,
          vinyl:vinyls!posts_vinyl_id_fkey (
            id,
            title,
            cover_url,
            vinyl_artists(
              position,
              artist:artists(name)
            ),
            album:albums!vinyls_album_id_fkey (
              id,
              title,
              album_artists(
                position,
                artist:artists(name)
              )
            )
          )
        ),
        comment:comments!notifications_comment_id_fkey (
          id,
          content
        )
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Pagination cursor-based
    if (lastCreatedAt) {
      query = query.lt('created_at', lastCreatedAt);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching notifications: ${error.message}`);
    }

    return (data || []).map((notif) => this.transformNotificationData(notif));
  }

  /**
   * Compte le nombre de notifications non lues
   */
  async getUnreadCount(token: string, userId: string): Promise<number> {
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(`Error counting unread notifications: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(token: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(`Error marking notifications as read: ${error.message}`);
    }

    // 🆕 Émettre l'événement Socket.IO
    this.eventsService.emitToUser(userId, 'notification:read-all', { userId });
  }

  /**
   * Transformation DB → Notification (camelCase)
   */
  private transformNotificationData(data: any): Notification {
    const notification: Notification = {
      id: data.id,
      type: data.type,
      read: data.read,
      createdAt: data.created_at,
      actor: {
        uid: data.actor?.uid || '',
        username: data.actor?.username || 'Unknown',
        firstName: data.actor?.first_name || null,
        lastName: data.actor?.last_name || null,
        photoUrl: data.actor?.photo_url || null,
      },
    };

    // Si notification liée à un post
    if (data.post) {
      const vinyl = data.post.vinyl;

      // Extraire les artistes du vinyl
      const vinylArtists = (vinyl?.vinyl_artists || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((va: any) => va.artist?.name)
        .filter(Boolean);

      // Extraire les artistes de l'album (fallback)
      const albumArtists = (vinyl?.album?.album_artists || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((aa: any) => aa.artist?.name)
        .filter(Boolean);

      const artist = vinylArtists.join(', ') || albumArtists.join(', ') || 'Artiste inconnu';

      notification.post = {
        id: data.post.id,
        vinylId: data.post.vinyl_id,
        vinyl: {
          id: vinyl?.id || '',
          title: vinyl?.title || 'Album inconnu',
          artist: artist,
          coverUrl: vinyl?.cover_url || null,
        },
      };
    }

    // Si notification liée à un commentaire
    if (data.comment) {
      notification.comment = {
        id: data.comment.id,
        content: data.comment.content,
      };
    }

    return notification;
  }

  /**
   * Crée une notification (utilisé par les autres services)
   */
  async createNotification(
    token: string,
    userId: string,
    type: 'post_like' | 'post_comment' | 'new_follower',
    actorId: string,
    postId?: string,
    commentId?: string,
  ): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token);

    const { data, error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      actor_id: actorId,
      post_id: postId || null,
      comment_id: commentId || null,
    }).select(`
      id,
      type,
      read,
      created_at,
      actor:users!notifications_actor_id_fkey (
        uid,
        username,
        first_name,
        last_name,
        photo_url
      ),
      post:posts!notifications_post_id_fkey (
        id,
        vinyl_id
      ),
      comment:comments!notifications_comment_id_fkey (
        id,
        content
      )
    `).single();

    if (error && error.code !== '23505') {
      // 23505 = duplicate, on ignore (ON CONFLICT DO NOTHING)
      throw new Error(`Error creating notification: ${error.message}`);
    }

    // 🆕 Émettre l'événement Socket.IO
    if (data) {
      const notification = this.transformNotificationData(data);
      this.eventsService.emitToUser(userId, 'notification:new', notification);
    }
  }

  /**
   * Supprime les notifications liées à un like
   */
  async deleteByLike(token: string, actorId: string, postId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token);

    // 1. Récupérer la notification AVANT de la supprimer
    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id, read')
      .eq('type', 'post_like')
      .eq('actor_id', actorId)
      .eq('post_id', postId)
      .single();

    // 2. Supprimer la notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'post_like')
      .eq('actor_id', actorId)
      .eq('post_id', postId);

    if (error) {
      throw new Error(`Error deleting like notification: ${error.message}`);
    }

    // 3. Émettre l'événement SEULEMENT si la notification était non lue
    if (notification && !notification.read) {
      this.eventsService.emitToUser(notification.user_id, 'notification:deleted', {
        type: 'post_like',
        actorId,
        postId,
      });
    }
  }

  /**
   * Supprime les notifications liées à un commentaire
   */
  async deleteByComment(token: string, commentId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token);

    // 1. Récupérer la notification AVANT de la supprimer
    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id, read')
      .eq('type', 'post_comment')
      .eq('comment_id', commentId)
      .single();

    // 2. Supprimer la notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'post_comment')
      .eq('comment_id', commentId);

    if (error) {
      throw new Error(`Error deleting comment notification: ${error.message}`);
    }

    // 3. Émettre l'événement SEULEMENT si la notification était non lue
    if (notification && !notification.read) {
      this.eventsService.emitToUser(notification.user_id, 'notification:deleted', {
        type: 'post_comment',
        commentId,
      });
    }
  }

  /**
   * Supprime les notifications liées à un follow
   */
  async deleteByFollow(token: string, followerId: string, followedId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token);

    // 1. Récupérer la notification AVANT de la supprimer
    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id, read')
      .eq('type', 'new_follower')
      .eq('actor_id', followerId)
      .eq('user_id', followedId)
      .single();

    // 2. Supprimer la notification
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'new_follower')
      .eq('actor_id', followerId)
      .eq('user_id', followedId);

    if (error) {
      throw new Error(`Error deleting follow notification: ${error.message}`);
    }

    // 3. Émettre l'événement SEULEMENT si la notification était non lue
    if (notification && !notification.read) {
      this.eventsService.emitToUser(notification.user_id, 'notification:deleted', {
        type: 'new_follower',
        followerId,
        followedId,
      });
    }
  }
}
