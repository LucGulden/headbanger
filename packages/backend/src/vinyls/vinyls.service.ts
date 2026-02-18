import { Injectable, NotFoundException } from '@nestjs/common'
import { Vinyl, ArtistLight, AlbumLight } from '@headbanger/shared'
import { SupabaseService } from '../common/database/supabase.service'
import { VinylByIdQueryResult } from './vinyls.types'

@Injectable()
export class VinylsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getById(id: string): Promise<Vinyl> {
    const supabase = this.supabaseService.getClient()

    const { data, error } = await supabase
      .from('vinyls')
      .select(
        `
        *,
        vinyl_artists(
          position,
          artist:artists(
            id,
            name,
            image_url
          )
        ),
        albums(
          id,
          title,
          cover_url,
          year,
          album_artists(
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
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundException(`Vinyl with ID ${id} not found`)
    }

    return this.transformVinylData(data as unknown as VinylByIdQueryResult)
  }

  private transformVinylData(data: VinylByIdQueryResult): Vinyl {
    const vinylArtists: ArtistLight[] = (data.vinyl_artists || [])
      .sort((a, b) => a.position - b.position)
      .map((va) => {
        return {
          id: va.artist.id,
          name: va.artist.name,
          imageUrl: va.artist.image_url,
        }
      })
      .filter((artist) => artist.id && artist.name)

    const albumArtists: ArtistLight[] = (data.albums.album_artists || [])
      .sort((a, b) => a.position - b.position)
      .map((aa) => {
        return {
          id: aa.artist.id,
          name: aa.artist.name,
          imageUrl: aa.artist.image_url,
        }
      })
      .filter((artist) => artist.id && artist.name)

    const album: AlbumLight = {
      id: data.albums.id,
      title: data.albums.title,
      artists:
        albumArtists.length > 0
          ? albumArtists
          : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: data.albums.cover_url,
      year: data.albums.year,
    }

    return {
      id: data.id,
      title: data.title,
      artists:
        vinylArtists.length > 0
          ? vinylArtists
          : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: data.cover_url,
      year: data.year,
      label: data.label,
      catalogNumber: data.catalog_number,
      country: data.country,
      format: data.format,
      album,
    }
  }
}
