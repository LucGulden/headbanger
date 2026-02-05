import { Injectable, NotFoundException } from '@nestjs/common';
import { Vinyl, ArtistLight, AlbumLight } from '@fillcrate/shared';
import { SupabaseService } from '../common/database/supabase.service';

@Injectable()
export class VinylsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Récupère un vinyl par son ID avec ses artistes et son album
   */
  async getById(id: string): Promise<Vinyl> {
    const supabase = this.supabaseService.getClient();

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
      .single();

    if (error || !data) {
      throw new NotFoundException(`Vinyl with ID ${id} not found`);
    }

    return this.transformVinylData(data);
  }

  /**
   * Transformation DB → Vinyl (camelCase)
   */
  private transformVinylData(data: any): Vinyl {
    // Extraire et trier les artistes du vinyl par position
    const vinylArtists: ArtistLight[] = (data.vinyl_artists || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((va: any) => ({
        id: va.artist?.id,
        name: va.artist?.name,
        imageUrl: va.artist?.image_url,
      }))
      .filter((artist: ArtistLight) => artist.id && artist.name);

    // Extraire et trier les artistes de l'album par position
    const albumData = data.albums;
    const albumArtists: ArtistLight[] = (albumData?.album_artists || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((aa: any) => ({
        id: aa.artist?.id,
        name: aa.artist?.name,
        imageUrl: aa.artist?.image_url,
      }))
      .filter((artist: ArtistLight) => artist.id && artist.name);

    // Créer l'objet AlbumLight
    const album: AlbumLight = {
      id: albumData?.id || '',
      title: albumData?.title || 'Album inconnu',
      artists: albumArtists.length > 0 
        ? albumArtists 
        : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: albumData?.cover_url || '',
      year: albumData?.year || 0,
    };

    return {
      id: data.id,
      title: data.title,
      artists: vinylArtists.length > 0 
        ? vinylArtists 
        : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: data.cover_url,
      year: data.year,
      label: data.label,
      catalogNumber: data.catalog_number,
      country: data.country,
      format: data.format,
      album,
    };
  }
}