import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { UserVinyl, UserVinylType, VinylStats } from '@headbanger/shared';
import { SupabaseService } from '../common/database/supabase.service';
import { VinylsService } from '../vinyls/vinyls.service';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class UserVinylsService {
  private readonly logger = new Logger(UserVinylsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly vinylsService: VinylsService,
    private readonly postsService: PostsService,
  ) {}

  /**
   * Récupère les vinyles d'un utilisateur avec pagination cursor-based
   */
  async getUserVinyls(
    userId: string,
    type: UserVinylType,
    limit: number = 20,
    lastAddedAt?: string,
  ): Promise<UserVinyl[]> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('user_vinyls')
      .select(
        `
        id,
        added_at,
        release_id,
        vinyls!user_vinyls_release_id_fkey(
          *,
          vinyl_artists(
            position,
            artist:artists(
              id,
              name,
              image_url
            )
          )
        )
      `,
      )
      .eq('user_id', userId)
      .eq('type', type)
      .order('added_at', { ascending: false })
      .limit(limit);

    // Cursor-based pagination
    if (lastAddedAt) {
      query = query.lt('added_at', lastAddedAt);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching user vinyls: ${error.message}`);
    }

    return (data || []).map((item: any) => this.transformUserVinylData(item));
  }

  /**
   * Compte le nombre total de vinyles
   */
  async getUserVinylsCount(userId: string, type: UserVinylType): Promise<number> {
    const supabase = this.supabaseService.getClient();

    const { count, error } = await supabase
      .from('user_vinyls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type);

    if (error) {
      throw new Error(`Error counting vinyls: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Vérifie si un vinyle existe déjà dans la collection/wishlist
   */
  async hasVinyl(userId: string, vinylId: string, type: UserVinylType): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('user_vinyls')
      .select('id')
      .eq('user_id', userId)
      .eq('release_id', vinylId)
      .eq('type', type)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, c'est OK
      throw new Error(`Error checking vinyl: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Ajoute un vinyle à la collection ou wishlist
   */
  async addVinylToUser(userId: string, vinylId: string, type: UserVinylType): Promise<UserVinyl> {
    // Vérifier que le vinyl existe
    await this.vinylsService.getById(vinylId);

    // Vérifier si déjà présent
    const exists = await this.hasVinyl(userId, vinylId, type);
    if (exists) {
      throw new BadRequestException(
        `This vinyl is already in your ${type === 'collection' ? 'collection' : 'wishlist'}`,
      );
    }

    const supabase = this.supabaseService.getClient();

    // 1. Ajouter le vinyl
    const { data, error } = await supabase
      .from('user_vinyls')
      .insert({
        user_id: userId,
        release_id: vinylId,
        type,
      })
      .select(
        `
        id,
        added_at,
        release_id,
        vinyls!user_vinyls_release_id_fkey(
          *,
          vinyl_artists(
            position,
            artist:artists(
              id,
              name,
              image_url
            )
          )
        )
      `,
      )
      .single();

    if (error) {
      throw new Error(`Error adding vinyl: ${error.message}`);
    }

    // 2. Créer le post automatiquement (async, non-bloquant)
    this.createVinylPost(userId, vinylId, type);

    return this.transformUserVinylData(data);
  }

  /**
   * Crée un post automatiquement lors de l'ajout d'un vinyl (privée, async)
   */
  private async createVinylPost(
    userId: string,
    vinylId: string,
    type: UserVinylType,
  ): Promise<void> {
    try {
      const postType = type === 'collection' ? 'collection_add' : 'wishlist_add';
      await this.postsService.createPost(userId, vinylId, postType);
    } catch (error) {
      this.logger.error('Failed to create post for vinyl add', error);
    }
  }

  /**
   * Retire un vinyle de la collection ou wishlist
   */
  async removeVinylFromUser(userId: string, vinylId: string, type: UserVinylType): Promise<void> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('user_vinyls')
      .delete()
      .eq('user_id', userId)
      .eq('release_id', vinylId)
      .eq('type', type);

    if (error) {
      throw new Error(`Error removing vinyl: ${error.message}`);
    }
  }

  /**
   * Déplace un vinyle de la wishlist vers la collection
   */
  async moveToCollection(userId: string, vinylId: string): Promise<UserVinyl> {
    // Vérifier qu'il est dans la wishlist
    const inWishlist = await this.hasVinyl(userId, vinylId, 'wishlist');
    if (!inWishlist) {
      throw new BadRequestException('This vinyl is not in your wishlist');
    }

    // Vérifier qu'il n'est pas déjà dans la collection
    const inCollection = await this.hasVinyl(userId, vinylId, 'collection');
    if (inCollection) {
      throw new BadRequestException('This vinyl is already in your collection');
    }

    // Retirer de la wishlist
    await this.removeVinylFromUser(userId, vinylId, 'wishlist');

    // Ajouter à la collection
    return await this.addVinylToUser(userId, vinylId, 'collection');
  }

  /**
   * Obtient les statistiques des vinyles d'un utilisateur
   */
  async getVinylStats(userId: string): Promise<VinylStats> {
    const [collectionCount, wishlistCount] = await Promise.all([
      this.getUserVinylsCount(userId, 'collection'),
      this.getUserVinylsCount(userId, 'wishlist'),
    ]);

    return {
      collectionCount,
      wishlistCount,
    };
  }

  /**
   * Transformation DB → UserVinyl (camelCase)
   */
  private transformUserVinylData(data: any): UserVinyl {
    const vinylData = data.vinyls;

    // Extraire et trier les artistes par position
    const artists = (vinylData.vinyl_artists || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((va: any) => ({
        id: va.artist?.id,
        name: va.artist?.name,
        imageUrl: va.artist?.image_url,
      }))
      .filter((artist: any) => artist.id && artist.name);

    return {
      id: data.id,
      addedAt: data.added_at,
      vinyl: {
        id: vinylData.id,
        title: vinylData.title,
        artists:
          artists.length > 0 ? artists : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
        coverUrl: vinylData.cover_url,
        year: vinylData.year,
        country: vinylData.country,
        catalogNumber: vinylData.catalog_number,
      },
    };
  }
}
