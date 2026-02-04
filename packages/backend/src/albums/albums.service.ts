import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { Album, AlbumLight, ArtistLight, VinylLight } from '@fillcrate/shared';

@Injectable()
export class AlbumsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Récupère un album par son ID avec ses artistes et vinyles associés
   */
  async findById(albumId: string): Promise<Album> {
    const supabase = this.supabaseService.getClient();

    // Récupère l'album avec ses artistes via jointure
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
          artists (
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

    // Récupérer les vinyles associés à cet album
    const { data: vinylsData, error: vinylsError } = await supabase
      .from('vinyls')
      .select(
        `
        id,
        title,
        cover_url,
        vinyl_artists (
          position,
          artists (
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

    // Transforme les données DB en interface Album
    return this.transformAlbumData(data, vinylsData || []);
  }

  /**
   * Recherche d'albums par titre avec pagination offset-based
   * Retourne AlbumLight[] (sans les vinyles pour optimiser les performances)
   */
  async searchAlbums(
    query: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<AlbumLight[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

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
          artists (
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

    if (error) {
      throw new Error(`Error searching albums: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transformer en AlbumLight (sans charger les vinyles)
    return data.map((albumData) => this.transformAlbumLightData(albumData));
  }

  /**
   * Transforme les données de la DB en interface Album (avec vinyles)
   */
  private transformAlbumData(data: any, vinylsData: any[]): Album {
    // Récupère et trie les artistes de l'album par position
    const artists: ArtistLight[] = (data.album_artists || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((aa: any) => ({
        id: aa.artists?.id,
        name: aa.artists?.name,
        imageUrl: aa.artists?.image_url,
      }))
      .filter((artist: ArtistLight) => artist.id && artist.name);

    // Transformer les vinyles
    const vinyls: VinylLight[] = vinylsData.map((vinyl: any) => {
      // Récupère les artistes du vinyle
      const vinylArtists: ArtistLight[] = (vinyl.vinyl_artists || [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((va: any) => ({
          id: va.artists?.id,
          name: va.artists?.name,
          imageUrl: va.artists?.image_url,
        }))
        .filter((artist: ArtistLight) => artist.id && artist.name);

      return {
        id: vinyl.id,
        title: vinyl.title,
        artists: vinylArtists.length > 0 ? vinylArtists : artists, // Fallback sur les artistes de l'album
        coverUrl: vinyl.cover_url,
      };
    });

    return {
      id: data.id,
      title: data.title,
      artists: artists.length > 0 ? artists : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: data.cover_url,
      vinyls: vinyls,
      year: data.year,
    };
  }

  /**
   * Transforme les données de la DB en interface AlbumLight (sans vinyles)
   */
  private transformAlbumLightData(data: any): AlbumLight {
    // Récupère et trie les artistes de l'album par position
    const artists: ArtistLight[] = (data.album_artists || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((aa: any) => ({
        id: aa.artists?.id,
        name: aa.artists?.name,
        imageUrl: aa.artists?.image_url,
      }))
      .filter((artist: ArtistLight) => artist.id && artist.name);

    return {
      id: data.id,
      title: data.title,
      artists: artists.length > 0 ? artists : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: data.cover_url,
      year: data.year,
    };
  }
}
