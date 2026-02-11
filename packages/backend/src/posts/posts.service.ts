import { Injectable } from '@nestjs/common';
import { PostWithDetails, PostType, ArtistLight } from '@headbanger/shared';
import { SupabaseService } from '../common/database/supabase.service';
import {
  DbPostWithRelations,
  DbVinylArtist,
  DbAlbumArtist,
  DbLike,
  DbCommentCount,
} from '../common/database/database.types';

@Injectable()
export class PostsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Feed global : posts de l'utilisateur + ceux qu'il suit
   */
  async getGlobalFeed(
    userId: string,
    limit: number = 20,
    lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    const supabase = this.supabaseService.getClient();

    // Récupérer les utilisateurs suivis
    const { data: followsData, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followsError) {
      throw new Error(`Error fetching follows: ${followsError.message}`);
    }

    // Utilisateurs suivis + soi-même
    const userIds = followsData.map((f) => f.following_id);
    userIds.push(userId);

    return this.fetchPostsByUserIds(userIds, limit, lastCreatedAt);
  }

  /**
   * Feed d'un profil spécifique : posts de cet utilisateur uniquement
   */
  async getProfileFeed(
    userId: string,
    limit: number = 20,
    lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    return this.fetchPostsByUserIds([userId], limit, lastCreatedAt);
  }

  /**
   * Méthode privée commune pour récupérer les posts
   */
  private async fetchPostsByUserIds(
    userIds: string[],
    limit: number,
    lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    if (userIds.length === 0) {
      return [];
    }

    const supabase = this.supabaseService.getClient();

    // Query posts
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
      .limit(limit);

    // Pagination cursor-based
    if (lastCreatedAt) {
      query = query.lt('created_at', lastCreatedAt);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching posts: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Récupérer les stats (likes et commentaires)
    const postIds = data.map((post) => post.id);

    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);

    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    // Maps pour comptage
    const likesCountMap = new Map<string, number>();
    const commentsCountMap = new Map<string, number>();

    (likesData as DbLike[])?.forEach((like: DbLike) => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
    });

    (commentsData as DbCommentCount[])?.forEach((comment: DbCommentCount) => {
      commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
    });

    return data.map((post) =>
      this.transformPostData(post as DbPostWithRelations, likesCountMap, commentsCountMap),
    );
  }

  /**
   * Crée un post (appelé automatiquement lors de l'ajout à collection/wishlist)
   */
  async createPost(userId: string, vinylId: string, type: PostType): Promise<PostWithDetails> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        vinyl_id: vinylId,
        type,
      })
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
      .single();

    if (error) {
      throw new Error(`Error creating post: ${error.message}`);
    }

    const likesCountMap = new Map<string, number>([[data.id, 0]]);
    const commentsCountMap = new Map<string, number>([[data.id, 0]]);

    return this.transformPostData(data as DbPostWithRelations, likesCountMap, commentsCountMap);
  }

  /**
   * Transformation DB → PostWithDetails (camelCase)
   */
  private transformPostData(
    data: DbPostWithRelations,
    likesCountMap: Map<string, number>,
    commentsCountMap: Map<string, number>,
  ): PostWithDetails {
    // Extraire les artistes du vinyle
    const vinylArtists: ArtistLight[] = (data.vinyl?.vinyl_artists || [])
      .sort((a: DbVinylArtist, b: DbVinylArtist) => a.position - b.position)
      .map((va: DbVinylArtist) => ({
        id: va.artist?.id || '',
        name: va.artist?.name || '',
        imageUrl: va.artist?.image_url || null,
      }))
      .filter((artist: ArtistLight) => artist.id && artist.name);

    // Fallback : si pas d'artistes de vinyle, utiliser les artistes de l'album
    let artists = vinylArtists;
    if (artists.length === 0) {
      artists = (data.vinyl?.album?.album_artists || [])
        .sort((a: DbAlbumArtist, b: DbAlbumArtist) => a.position - b.position)
        .map((aa: DbAlbumArtist) => ({
          id: aa.artist?.id || aa.artists?.id || '',
          name: aa.artist?.name || aa.artists?.name || '',
          imageUrl: aa.artist?.image_url || aa.artists?.image_url || null,
        }))
        .filter((artist: ArtistLight) => artist.id && artist.name);
    }

    // Si toujours pas d'artistes, fallback
    if (artists.length === 0) {
      artists = [{ id: '', name: 'Artiste inconnu', imageUrl: null }];
    }

    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      createdAt: data.created_at,
      likesCount: likesCountMap.get(data.id) || 0,
      commentsCount: commentsCountMap.get(data.id) || 0,
      user: {
        uid: data.user?.uid || data.user_id,
        username: data.user?.username || 'Unknown',
        photoUrl: data.user?.photo_url || null,
      },
      vinyl: {
        id: data.vinyl?.id || '',
        title: data.vinyl?.title || 'Vinyle inconnu',
        artists: artists,
        coverUrl: data.vinyl?.cover_url || data.vinyl?.album?.cover_url || null,
        year: data.vinyl?.year || 0,
        country: data.vinyl?.country || '',
        catalogNumber: data.vinyl?.catalog_number || '',
      },
    };
  }
}
