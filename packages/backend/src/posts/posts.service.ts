import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PostWithDetails, PostType, ArtistLight } from '@fillcrate/shared';
import { SupabaseService } from '../common/database/supabase.service';

@Injectable()
export class PostsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Récupère les posts du feed avec pagination cursor-based
   */
  async getFeedPosts(
    userId: string,
    profileFeed: boolean,
    limit: number = 20,
    lastCreatedAt?: string,
  ): Promise<PostWithDetails[]> {
    const supabase = this.supabaseService.getClient();

    let userIds: string[] = [];

    if (profileFeed) {
      // Feed d'un utilisateur spécifique
      userIds = [userId];
    } else {
      // Feed global : posts des utilisateurs suivis + les siens
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (followsError) {
        throw new Error(`Error fetching follows: ${followsError.message}`);
      }

      // Utilisateurs suivis + soi-même
      userIds = followsData.map((f) => f.following_id);
      userIds.push(userId);
    }

    if (userIds.length === 0) {
      return [];
    }

    // Query pour récupérer les posts
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

    // Récupérer les stats (likes et commentaires) pour tous les posts
    const postIds = data.map((post) => post.id);

    // Compter les likes
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);

    // Compter les commentaires
    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    // Créer des maps pour un accès rapide
    const likesCountMap = new Map<string, number>();
    const commentsCountMap = new Map<string, number>();

    likesData?.forEach((like) => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
    });

    commentsData?.forEach((comment) => {
      commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
    });

    // Transformer les données
    return data.map((post: any) => this.transformPostData(post, likesCountMap, commentsCountMap));
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

    return this.transformPostData(data, likesCountMap, commentsCountMap);
  }

  /**
   * Transformation DB → PostWithDetails (camelCase)
   */
  private transformPostData(
    data: any,
    likesCountMap: Map<string, number>,
    commentsCountMap: Map<string, number>,
  ): PostWithDetails {
    // Extraire les artistes de l'album
    const albumArtists: ArtistLight[] = (data.vinyl?.album?.album_artists || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((aa: any) => ({
        id: aa.artist?.id,
        name: aa.artist?.name,
        imageUrl: aa.artist?.image_url,
      }))
      .filter((artist: ArtistLight) => artist.id && artist.name);

    // Fallback : si pas d'artistes d'album, utiliser les artistes du vinyl
    let artists = albumArtists;
    if (artists.length === 0) {
      artists = (data.vinyl?.vinyl_artists || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((va: any) => ({
          id: va.artist?.id,
          name: va.artist?.name,
          imageUrl: va.artist?.image_url,
        }))
        .filter((artist: ArtistLight) => artist.id && artist.name);
    }

    // Si toujours pas d'artistes, fallback
    if (artists.length === 0) {
      artists = [{ id: '', name: 'Artiste inconnu', imageUrl: null }];
    }

    // Infos de l'album
    const albumInfo = data.vinyl?.album || {
      id: data.vinyl?.album_id || '',
      title: data.vinyl?.title || 'Album inconnu',
      cover_url: data.vinyl?.cover_url,
    };

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
        photoUrl: data.user?.photo_url,
      },
      album: {
        id: albumInfo.id,
        title: albumInfo.title,
        artists: artists,
        coverUrl: albumInfo.cover_url,
      },
    };
  }
}
