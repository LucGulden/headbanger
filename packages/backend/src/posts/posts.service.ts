import { Injectable } from '@nestjs/common'
import { PostWithDetails, PostType, ArtistLight } from '@headbanger/shared'
import { SupabaseService } from '../common/database/supabase.service'
import { DbComment, DbLike } from '../common/database/database.types'
import { PostQueryResult } from './posts.types'

@Injectable()
export class PostsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getGlobalFeed(
    userId: string,
    limit: number = 20,
    lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    const supabase = this.supabaseService.getClient()

    const { data: followsData, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (followsError) {
      throw new Error(`Error fetching follows: ${followsError.message}`)
    }

    const userIds = followsData.map((f) => f.following_id)
    userIds.push(userId)

    return this.fetchPostsByUserIds(userIds, limit, lastCreatedAt)
  }

  async getProfileFeed(
    userId: string,
    limit: number = 20,
    lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    return this.fetchPostsByUserIds([userId], limit, lastCreatedAt)
  }

  private async fetchPostsByUserIds(
    userIds: string[],
    limit: number,
    lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    if (userIds.length === 0) return []

    const supabase = this.supabaseService.getClient()

    let query = supabase
      .from('posts')
      .select(
        `
        id,
        user_id,
        vinyl_id,
        type,
        created_at,
        user:users!posts_user_id_fkey (
          uid,
          username,
          photo_url
        ),
        vinyl:vinyls!posts_vinyl_id_fkey (
          id,
          title,
          cover_url,
          year,
          country,
          catalog_number,
          album_id,
          vinyl_artists(
            position,
            artist:artists(
              id,
              name,
              image_url
            )
          ),
          album:albums!vinyls_album_id_fkey (
            id,
            title,
            cover_url,
            album_artists(
              position,
              artist:artists(
                id,
                name,
                image_url
              )
            )
          )
        )
      `,
      )
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (lastCreatedAt) {
      query = query.lt('created_at', lastCreatedAt)
    }

    const { data, error } = await query

    if (error) throw new Error(`Error fetching posts: ${error.message}`)
    if (!data || data.length === 0) return []

    const postIds = data.map((post) => post.id)

    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds)

    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)

    const likesCountMap = new Map<string, number>()
    const commentsCountMap = new Map<string, number>()

    ;((likesData as DbLike[]) ?? []).forEach((like) => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) ?? 0) + 1)
    })
    ;((commentsData as DbComment[]) ?? []).forEach((comment) => {
      commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) ?? 0) + 1)
    })

    return (data as unknown as PostQueryResult[]).map((post) =>
      this.transformPostData(post, likesCountMap, commentsCountMap),
    )
  }

  async createPost(userId: string, vinylId: string, type: PostType): Promise<PostWithDetails> {
    const supabase = this.supabaseService.getClient()

    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: userId, vinyl_id: vinylId, type })
      .select(
        `
        id,
        user_id,
        vinyl_id,
        type,
        created_at,
        user:users!posts_user_id_fkey (
          uid,
          username,
          photo_url
        ),
        vinyl:vinyls!posts_vinyl_id_fkey (
          id,
          title,
          cover_url,
          year,
          country,
          catalog_number,
          album_id,
          vinyl_artists(
            position,
            artist:artists(
              id,
              name,
              image_url
            )
          ),
          album:albums!vinyls_album_id_fkey (
            id,
            title,
            cover_url,
            album_artists(
              position,
              artist:artists(
                id,
                name,
                image_url
              )
            )
          )
        )
      `,
      )
      .single()

    if (error) throw new Error(`Error creating post: ${error.message}`)

    const likesCountMap = new Map<string, number>([[data.id, 0]])
    const commentsCountMap = new Map<string, number>([[data.id, 0]])

    return this.transformPostData(
      data as unknown as PostQueryResult,
      likesCountMap,
      commentsCountMap,
    )
  }

  private transformPostData(
    data: PostQueryResult,
    likesCountMap: Map<string, number>,
    commentsCountMap: Map<string, number>,
  ): PostWithDetails {
    const user = data.user[0]
    if (!user) {
      throw new Error(`User missing in post ${data.id} join — data integrity issue`)
    }

    const vinyl = data.vinyl[0]
    if (!vinyl) {
      throw new Error(`Vinyl missing in post ${data.id} join — data integrity issue`)
    }

    const album = vinyl.album?.[0]
    if (!album) {
      throw new Error(`Album missing in vinyl ${vinyl.id} join — data integrity issue`)
    }

    const vinylArtists: ArtistLight[] = (vinyl.vinyl_artists || [])
      .sort((a, b) => a.position - b.position)
      .map((va) => {
        const artist = va.artist[0]
        if (!artist) {
          throw new Error(`Artist missing in vinyl_artists join — data integrity issue`)
        }
        return {
          id: artist.id,
          name: artist.name,
          imageUrl: artist.image_url,
        }
      })
      .filter((artist) => artist.id && artist.name)

    let artists = vinylArtists

    if (artists.length === 0) {
      artists = (album.album_artists || [])
        .sort((a, b) => a.position - b.position)
        .map((aa) => {
          const artist = aa.artist[0]
          if (!artist) {
            throw new Error(`Artist missing in album_artists join — data integrity issue`)
          }
          return {
            id: artist.id,
            name: artist.name,
            imageUrl: artist.image_url,
          }
        })
        .filter((artist) => artist.id && artist.name)
    }

    if (artists.length === 0) {
      artists = [{ id: '', name: 'Artiste inconnu', imageUrl: null }]
    }

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      createdAt: data.created_at,
      likesCount: likesCountMap.get(data.id) ?? 0,
      commentsCount: commentsCountMap.get(data.id) ?? 0,
      user: {
        uid: user.uid,
        username: user.username,
        photoUrl: user.photo_url,
      },
      vinyl: {
        id: vinyl.id,
        title: vinyl.title,
        artists,
        coverUrl: vinyl.cover_url,
        year: vinyl.year,
        country: vinyl.country,
        catalogNumber: vinyl.catalog_number,
      },
    }
  }
}
