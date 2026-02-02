import { Injectable } from '@nestjs/common';
import { Notification } from '@fillcrate/shared';
import { SupabaseService } from '../common/database/supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Récupère les notifications d'un utilisateur avec pagination
   */
  async getNotifications(
    userId: string,
    limit: number = 20,
    lastCreatedAt?: string,
  ): Promise<Notification[]> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('notifications')
      .select(`
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
      `)
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
  async getUnreadCount(userId: string): Promise<number> {
    const supabase = this.supabaseService.getClient();

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
  async markAllAsRead(userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(`Error marking notifications as read: ${error.message}`);
    }
  }

  /**
   * Marque une notification spécifique comme lue
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
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

      const artist =
        vinylArtists.join(', ') || albumArtists.join(', ') || 'Artiste inconnu';

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
}