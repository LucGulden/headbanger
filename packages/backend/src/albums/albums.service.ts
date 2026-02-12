import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { Album, AlbumLight, ArtistLight, VinylLight } from '@headbanger/shared';

type ArtistJoin = { id: string; name: string; image_url: string | null }[];

type AlbumQueryResult = {
  id: string;
  title: string;
  cover_url: string | null;
  year: number;
  album_artists: {
    position: number;
    artist: ArtistJoin;
  }[];
};

type VinylQueryResult = {
  id: string;
  title: string;
  cover_url: string;
  year: number;
  country: string;
  catalog_number: string;
  vinyl_artists: {
    position: number;
    artist: ArtistJoin;
  }[];
};

@Injectable()
export class AlbumsService {
  constructor(private supabaseService: SupabaseService) {}

  async findById(albumId: string): Promise<Album> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('albums')
      .select(
        `
        id,
        title,
        cover_url,
        year,
        album_artists!inner (
          position,
          artist:artists (
            id,
            name,
            image_url
          )
        )
      `,
      )
      .eq('id', albumId)
      .single();

    if (error || !data) {
      console.error('Album not found:', error);
      throw new NotFoundException('Album not found');
    }

    const { data: vinylsData, error: vinylsError } = await supabase
      .from('vinyls')
      .select(
        `
        id,
        title,
        cover_url,
        year,
        country,
        catalog_number,
        vinyl_artists (
          position,
          artist:artists (
            id,
            name,
            image_url
          )
        )
      `,
      )
      .eq('album_id', albumId);

    if (vinylsError) {
      console.error('Error fetching vinyls:', vinylsError);
    }

    return this.transformAlbumData(
      data as unknown as AlbumQueryResult,
      (vinylsData || []) as unknown as VinylQueryResult[],
    );
  }

  async searchAlbums(query: string, limit: number = 20, offset: number = 0): Promise<AlbumLight[]> {
    if (!query || query.trim().length < 2) return [];

    const supabase = this.supabaseService.getClient();
    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
      .from('albums')
      .select(
        `
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
      `,
      )
      .ilike('title', searchTerm)
      .order('title', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Error searching albums: ${error.message}`);
    if (!data || data.length === 0) return [];

    return (data as unknown as AlbumQueryResult[]).map((albumData) =>
      this.transformAlbumLightData(albumData),
    );
  }

  private extractArtists(album_artists: AlbumQueryResult['album_artists']): ArtistLight[] {
    return (album_artists || [])
      .sort((a, b) => a.position - b.position)
      .map((aa) => ({
        id: aa.artist[0]?.id ?? '',
        name: aa.artist[0]?.name ?? '',
        imageUrl: aa.artist[0]?.image_url ?? null,
      }))
      .filter((artist) => artist.id && artist.name);
  }

  private transformAlbumData(data: AlbumQueryResult, vinylsData: VinylQueryResult[]): Album {
    const artists = this.extractArtists(data.album_artists);

    const vinyls: VinylLight[] = vinylsData.map((vinyl) => {
      const vinylArtists: ArtistLight[] = (vinyl.vinyl_artists || [])
        .sort((a, b) => a.position - b.position)
        .map((va) => ({
          id: va.artist[0]?.id ?? '',
          name: va.artist[0]?.name ?? '',
          imageUrl: va.artist[0]?.image_url ?? null,
        }))
        .filter((artist) => artist.id && artist.name);

      return {
        id: vinyl.id,
        title: vinyl.title,
        artists: vinylArtists.length > 0 ? vinylArtists : artists,
        coverUrl: vinyl.cover_url,
        year: vinyl.year,
        country: vinyl.country,
        catalogNumber: vinyl.catalog_number,
      };
    });

    return {
      id: data.id,
      title: data.title,
      artists: artists.length > 0 ? artists : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: data.cover_url ?? '',
      vinyls,
      year: data.year,
    };
  }

  private transformAlbumLightData(data: AlbumQueryResult): AlbumLight {
    const artists = this.extractArtists(data.album_artists);

    return {
      id: data.id,
      title: data.title,
      artists: artists.length > 0 ? artists : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: data.cover_url ?? '',
      year: data.year,
    };
  }
}
