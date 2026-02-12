import { Injectable } from '@nestjs/common'
import { Notification } from '@headbanger/shared'
import { SupabaseService } from '../common/database/supabase.service'
import { EventsService } from '../events/events.service'

type ArtistNameJoin = { name: string }[]

type NotificationQueryResult = {
  id: string
  type: 'post_like' | 'post_comment' | 'new_follower'
  read: boolean
  created_at: string
  actor: {
    uid: string
    username: string
    first_name: string | null
    last_name: string | null
    photo_url: string | null
  }[]
  post:
    | {
        id: string
        vinyl_id: string
        vinyl:
          | {
              id: string
              title: string
              cover_url: string | null
              vinyl_artists: { position: number; artist: ArtistNameJoin }[]
              album:
                | {
                    id: string
                    title: string
                    album_artists: { position: number; artist: ArtistNameJoin }[]
                  }[]
                | null
            }[]
          | null
      }[]
    | null
  comment:
    | {
        id: string
        content: string
      }[]
    | null
}

// Requête allégée utilisée dans createNotification (sans le détail vinyl)
type NotificationCreateQueryResult = {
  id: string
  type: 'post_like' | 'post_comment' | 'new_follower'
  read: boolean
  created_at: string
  actor: {
    uid: string
    username: string
    first_name: string | null
    last_name: string | null
    photo_url: string | null
  }[]
  post:
    | {
        id: string
        vinyl_id: string
      }[]
    | null
  comment:
    | {
        id: string
        content: string
      }[]
    | null
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly eventsService: EventsService,
  ) {}

  async getNotifications(
    token: string,
    userId: string,
    limit: number = 20,
    lastCreatedAt?: string,
  ): Promise<Notification[]> {
    const supabase = this.supabaseService.getClientWithAuth(token)

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
      .limit(limit)

    if (lastCreatedAt) {
      query = query.lt('created_at', lastCreatedAt)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching notifications: ${error.message}`)
    }

    return (data as unknown as NotificationQueryResult[]).map((notif) =>
      this.transformNotificationData(notif),
    )
  }

  async getUnreadCount(token: string, userId: string): Promise<number> {
    const supabase = this.supabaseService.getClientWithAuth(token)

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      throw new Error(`Error counting unread notifications: ${error.message}`)
    }

    return count ?? 0
  }

  async markAllAsRead(token: string, userId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token)

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      throw new Error(`Error marking notifications as read: ${error.message}`)
    }

    this.eventsService.emitToUser(userId, 'notification:read-all', { userId })
  }

  async createNotification(
    token: string,
    userId: string,
    type: 'post_like' | 'post_comment' | 'new_follower',
    actorId: string,
    postId?: string,
    commentId?: string,
  ): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token)

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        actor_id: actorId,
        post_id: postId || null,
        comment_id: commentId || null,
      })
      .select(
        `
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
      `,
      )
      .single()

    if (error && error.code !== '23505') {
      throw new Error(`Error creating notification: ${error.message}`)
    }

    if (data) {
      const notification = this.transformNotificationCreateData(
        data as unknown as NotificationCreateQueryResult,
      )
      this.eventsService.emitToUser(userId, 'notification:new', notification)
    }
  }

  async deleteByLike(token: string, actorId: string, postId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token)

    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id, read')
      .eq('type', 'post_like')
      .eq('actor_id', actorId)
      .eq('post_id', postId)
      .single()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'post_like')
      .eq('actor_id', actorId)
      .eq('post_id', postId)

    if (error) throw new Error(`Error deleting like notification: ${error.message}`)

    if (notification && !notification.read) {
      this.eventsService.emitToUser(notification.user_id, 'notification:deleted', {
        type: 'post_like',
        actorId,
        postId,
      })
    }
  }

  async deleteByComment(token: string, commentId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token)

    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id, read')
      .eq('type', 'post_comment')
      .eq('comment_id', commentId)
      .single()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'post_comment')
      .eq('comment_id', commentId)

    if (error) throw new Error(`Error deleting comment notification: ${error.message}`)

    if (notification && !notification.read) {
      this.eventsService.emitToUser(notification.user_id, 'notification:deleted', {
        type: 'post_comment',
        commentId,
      })
    }
  }

  async deleteByFollow(token: string, followerId: string, followedId: string): Promise<void> {
    const supabase = this.supabaseService.getClientWithAuth(token)

    const { data: notification } = await supabase
      .from('notifications')
      .select('user_id, read')
      .eq('type', 'new_follower')
      .eq('actor_id', followerId)
      .eq('user_id', followedId)
      .single()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'new_follower')
      .eq('actor_id', followerId)
      .eq('user_id', followedId)

    if (error) throw new Error(`Error deleting follow notification: ${error.message}`)

    if (notification && !notification.read) {
      this.eventsService.emitToUser(notification.user_id, 'notification:deleted', {
        type: 'new_follower',
        followerId,
        followedId,
      })
    }
  }

  private transformNotificationData(data: NotificationQueryResult): Notification {
    const notification: Notification = {
      id: data.id,
      type: data.type,
      read: data.read,
      createdAt: data.created_at,
      actor: {
        uid: data.actor[0]?.uid ?? '',
        username: data.actor[0]?.username ?? 'Unknown',
        firstName: data.actor[0]?.first_name ?? null,
        lastName: data.actor[0]?.last_name ?? null,
        photoUrl: data.actor[0]?.photo_url ?? null,
      },
    }

    if (data.post?.[0]) {
      const post = data.post[0]
      const vinyl = post.vinyl?.[0]

      const vinylArtists = (vinyl?.vinyl_artists || [])
        .sort((a, b) => a.position - b.position)
        .map((va) => va.artist[0]?.name)
        .filter(Boolean)

      const albumArtists = (vinyl?.album?.[0]?.album_artists || [])
        .sort((a, b) => a.position - b.position)
        .map((aa) => aa.artist[0]?.name)
        .filter(Boolean)

      const artist = vinylArtists.join(', ') || albumArtists.join(', ') || 'Artiste inconnu'

      notification.post = {
        id: post.id,
        vinylId: post.vinyl_id,
        vinyl: {
          id: vinyl?.id ?? '',
          title: vinyl?.title ?? 'Album inconnu',
          artist,
          coverUrl: vinyl?.cover_url ?? null,
        },
      }
    }

    if (data.comment?.[0]) {
      notification.comment = {
        id: data.comment[0].id,
        content: data.comment[0].content,
      }
    }

    return notification
  }

  private transformNotificationCreateData(data: NotificationCreateQueryResult): Notification {
    const notification: Notification = {
      id: data.id,
      type: data.type,
      read: data.read,
      createdAt: data.created_at,
      actor: {
        uid: data.actor[0]?.uid ?? '',
        username: data.actor[0]?.username ?? 'Unknown',
        firstName: data.actor[0]?.first_name ?? null,
        lastName: data.actor[0]?.last_name ?? null,
        photoUrl: data.actor[0]?.photo_url ?? null,
      },
    }

    if (data.post?.[0]) {
      notification.post = {
        id: data.post[0].id,
        vinylId: data.post[0].vinyl_id,
        vinyl: { id: '', title: '', artist: '', coverUrl: null },
      }
    }

    if (data.comment?.[0]) {
      notification.comment = {
        id: data.comment[0].id,
        content: data.comment[0].content,
      }
    }

    return notification
  }
}
