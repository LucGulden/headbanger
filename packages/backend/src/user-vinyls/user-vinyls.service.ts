import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { UserVinyl, UserVinylType, VinylStats, ArtistLight } from '@headbanger/shared'
import { SupabaseService } from '../common/database/supabase.service'
import { VinylsService } from '../vinyls/vinyls.service'
import { PostsService } from '../posts/posts.service'
import { UserVinylQueryResult } from './user-vinyls.types'

@Injectable()
export class UserVinylsService {
  private readonly logger = new Logger(UserVinylsService.name)

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly vinylsService: VinylsService,
    private readonly postsService: PostsService,
  ) {}

  async getUserVinyls(
    userId: string,
    type: UserVinylType,
    limit: number = 20,
    lastAddedAt?: string,
  ): Promise<UserVinyl[]> {
    const supabase = this.supabaseService.getClient()

    let query = supabase
      .from('user_vinyls')
      .select(
        `
        id,
        added_at,
        release_id,
        vinyls!user_vinyls_release_id_fkey(
          id,
          title,
          cover_url,
          year,
          country,
          catalog_number,
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
      .limit(limit)

    if (lastAddedAt) {
      query = query.lt('added_at', lastAddedAt)
    }

    const { data, error } = await query

    if (error) throw new Error(`Error fetching user vinyls: ${error.message}`)

    return (data as unknown as UserVinylQueryResult[]).map((item) =>
      this.transformUserVinylData(item),
    )
  }

  async getUserVinylsCount(userId: string, type: UserVinylType): Promise<number> {
    const supabase = this.supabaseService.getClient()

    const { count, error } = await supabase
      .from('user_vinyls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)

    if (error) throw new Error(`Error counting vinyls: ${error.message}`)

    return count ?? 0
  }

  async hasVinyl(userId: string, vinylId: string, type: UserVinylType): Promise<boolean> {
    const supabase = this.supabaseService.getClient()

    const { data, error } = await supabase
      .from('user_vinyls')
      .select('id')
      .eq('user_id', userId)
      .eq('release_id', vinylId)
      .eq('type', type)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error checking vinyl: ${error.message}`)
    }

    return !!data
  }

  async addVinylToUser(userId: string, vinylId: string, type: UserVinylType): Promise<UserVinyl> {
    await this.vinylsService.getById(vinylId)

    const exists = await this.hasVinyl(userId, vinylId, type)
    if (exists) {
      throw new BadRequestException(
        `This vinyl is already in your ${type === 'collection' ? 'collection' : 'wishlist'}`,
      )
    }

    const supabase = this.supabaseService.getClient()

    const { data, error } = await supabase
      .from('user_vinyls')
      .insert({ user_id: userId, release_id: vinylId, type })
      .select(
        `
        id,
        added_at,
        release_id,
        vinyls!user_vinyls_release_id_fkey(
          id,
          title,
          cover_url,
          year,
          country,
          catalog_number,
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
      .single()

    if (error) throw new Error(`Error adding vinyl: ${error.message}`)

    this.createVinylPost(userId, vinylId, type)

    return this.transformUserVinylData(data as unknown as UserVinylQueryResult)
  }

  private async createVinylPost(
    userId: string,
    vinylId: string,
    type: UserVinylType,
  ): Promise<void> {
    try {
      const postType = type === 'collection' ? 'collection_add' : 'wishlist_add'
      await this.postsService.createPost(userId, vinylId, postType)
    } catch (error) {
      this.logger.error('Failed to create post for vinyl add', error)
    }
  }

  async removeVinylFromUser(userId: string, vinylId: string, type: UserVinylType): Promise<void> {
    const supabase = this.supabaseService.getClient()

    const { error } = await supabase
      .from('user_vinyls')
      .delete()
      .eq('user_id', userId)
      .eq('release_id', vinylId)
      .eq('type', type)

    if (error) throw new Error(`Error removing vinyl: ${error.message}`)
  }

  async moveToCollection(userId: string, vinylId: string): Promise<UserVinyl> {
    const inWishlist = await this.hasVinyl(userId, vinylId, 'wishlist')
    if (!inWishlist) throw new BadRequestException('This vinyl is not in your wishlist')

    const inCollection = await this.hasVinyl(userId, vinylId, 'collection')
    if (inCollection) throw new BadRequestException('This vinyl is already in your collection')

    await this.removeVinylFromUser(userId, vinylId, 'wishlist')
    return this.addVinylToUser(userId, vinylId, 'collection')
  }

  async getVinylStats(userId: string): Promise<VinylStats> {
    const [collectionCount, wishlistCount] = await Promise.all([
      this.getUserVinylsCount(userId, 'collection'),
      this.getUserVinylsCount(userId, 'wishlist'),
    ])

    return { collectionCount, wishlistCount }
  }

  private transformUserVinylData(data: UserVinylQueryResult): UserVinyl {
    const artists: ArtistLight[] = (data.vinyls.vinyl_artists || [])
      .sort((a, b) => a.position - b.position)
      .map((va) => {
        return {
          id: va.artist.id,
          name: va.artist.name,
          imageUrl: va.artist.image_url,
        }
      })
      .filter((artist) => artist.id && artist.name)

    return {
      id: data.id,
      addedAt: data.added_at,
      vinyl: {
        id: data.vinyls.id,
        title: data.vinyls.title,
        artists:
          artists.length > 0 ? artists : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
        coverUrl: data.vinyls.cover_url,
        year: data.vinyls.year,
        country: data.vinyls.country,
        catalogNumber: data.vinyls.catalog_number,
      },
    }
  }
}
