import { Injectable, NotFoundException } from '@nestjs/common'
import { AlbumLight, Artist, ArtistLight } from '@headbanger/shared'
import { SupabaseService } from '../common/database/supabase.service'
import { DbArtist } from '../common/database/database.types'
import { ArtistAlbumsQueryResult } from './artists.types'

@Injectable()
export class ArtistsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getById(id: string): Promise<Artist> {
    const supabase = this.supabaseService.getClient()

    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('id, name, image_url, spotify_id')
      .eq('id', id)
      .single()

    if (artistError || !artistData) {
      console.error('Artist not found:', artistError)
      throw new NotFoundException('Artist not found')
    }

    const { data: albumArtistsData, error: albumsError } = await supabase
      .from('album_artists')
      .select(
        `
        album:albums (
          id,
          title,
          cover_url,
          year,
          album_artists (
            position,
            artist:artists (
              id,
              name,
              image_url
            )
          )
        )
      `,
      )
      .eq('artist_id', id)
      .order('position', { ascending: true })

    if (albumsError) {
      console.error('Error fetching albums:', albumsError)
    }

    return this.transformArtistData(
      artistData as DbArtist,
      (albumArtistsData || []) as unknown as ArtistAlbumsQueryResult[],
    )
  }

  async search(query: string, limit: number = 20, offset: number = 0): Promise<ArtistLight[]> {
    if (!query || query.trim().length < 2) return []

    const supabase = this.supabaseService.getClient()
    const searchTerm = `%${query.trim()}%`

    const { data, error } = await supabase
      .from('artists')
      .select('id, name, image_url')
      .ilike('name', searchTerm)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`Error searching artists: ${error.message}`)

    return data.map((artist) => this.transformArtistLightData(artist as DbArtist))
  }

  private transformArtistData(
    artistData: DbArtist,
    albumArtistsData: ArtistAlbumsQueryResult[],
  ): Artist {
    const albums: AlbumLight[] = albumArtistsData.map((aa) => {
      const artists: ArtistLight[] = (aa.album.album_artists || [])
        .sort((a, b) => a.position - b.position)
        .map((aa) => {
          return {
            id: aa.artist.id,
            name: aa.artist.name,
            imageUrl: aa.artist.image_url,
          }
        })
        .filter((artist) => artist.id && artist.name)

      return {
        id: aa.album.id,
        title: aa.album.title,
        artists:
          artists.length > 0 ? artists : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
        coverUrl: aa.album.cover_url,
        year: aa.album.year,
      }
    })

    return {
      id: artistData.id,
      name: artistData.name,
      imageUrl: artistData.image_url,
      spotifyId: artistData.spotify_id,
      albums,
    }
  }

  private transformArtistLightData(data: DbArtist): ArtistLight {
    return {
      id: data.id,
      name: data.name,
      imageUrl: data.image_url,
    }
  }
}
