import { Injectable, NotFoundException } from '@nestjs/common';
import { Vinyl, ArtistLight, AlbumLight } from '@headbanger/shared';
import { SupabaseService } from '../common/database/supabase.service';
import { DbVinyl } from '../common/database/database.types';

type VinylByIdQueryResult = DbVinyl & {
  vinyl_artists: {
    position: number;
    artist: { id: string; name: string; image_url: string | null }[];
  }[];
  albums: {
    id: string;
    title: string;
    cover_url: string | null;
    year: number;
    album_artists: {
      position: number;
      artist: { id: string; name: string; image_url: string | null }[];
    }[];
  } | null;
};

@Injectable()
export class VinylsService {
  constructor(private readonly supabaseService: SupabaseService) {}

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

    return this.transformVinylData(data as unknown as VinylByIdQueryResult);
  }

  private transformVinylData(data: VinylByIdQueryResult): Vinyl {
    const vinylArtists: ArtistLight[] = (data.vinyl_artists || [])
      .sort((a, b) => a.position - b.position)
      .map((va) => ({
        id: va.artist[0]?.id ?? '',
        name: va.artist[0]?.name ?? '',
        imageUrl: va.artist[0]?.image_url ?? null,
      }))
      .filter((artist) => artist.id && artist.name);

    const albumData = data.albums;
    const albumArtists: ArtistLight[] = (albumData?.album_artists || [])
      .sort((a, b) => a.position - b.position)
      .map((aa) => ({
        id: aa.artist[0]?.id ?? '',
        name: aa.artist[0]?.name ?? '',
        imageUrl: aa.artist[0]?.image_url ?? null,
      }))
      .filter((artist) => artist.id && artist.name);

    const album: AlbumLight = {
      id: albumData?.id ?? '',
      title: albumData?.title ?? 'Album inconnu',
      artists:
        albumArtists.length > 0
          ? albumArtists
          : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: albumData?.cover_url ?? '',
      year: albumData?.year ?? 0,
    };

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
    };
  }
}
