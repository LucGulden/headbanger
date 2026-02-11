import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { Album, AlbumLight, ArtistLight, VinylLight } from '@headbanger/shared';
import {
  DbAlbumWithRelations,
  DbVinylLight,
  DbAlbumArtist,
  DbVinylArtist,
} from '../common/database/database.types';

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
        year,
        country,
        catalog_number,
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
    return this.transformAlbumData(
      data as DbAlbumWithRelations,
      (vinylsData || []) as DbVinylLight[],
    );
  }

  /**
   * Recherche d'albums par titre avec pagination offset-based
   * Retourne AlbumLight[] (sans les vinyles pour optimiser les performances)
   */
  async searchAlbums(query: string, limit: number = 20, offset: number = 0): Promise<AlbumLight[]> {
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
    return data.map((albumData) => this.transformAlbumLightData(albumData as DbAlbumWithRelations));
  }

  /**
   * Transforme les données de la DB en interface Album (avec vinyles)
   */
  private transformAlbumData(data: DbAlbumWithRelations, vinylsData: DbVinylLight[]): Album {
    // Récupère et trie les artistes de l'album par position
    const artists: ArtistLight[] = (data.album_artists || [])
      .sort((a: DbAlbumArtist, b: DbAlbumArtist) => a.position - b.position)
      .map((aa: DbAlbumArtist) => ({
        id: aa.artists?.id || aa.artist?.id || '',
        name: aa.artists?.name || aa.artist?.name || '',
        imageUrl: aa.artists?.image_url || aa.artist?.image_url || null,
      }))
      .filter((artist: ArtistLight) => artist.id && artist.name);

    // Transformer les vinyles
    const vinyls: VinylLight[] = vinylsData.map((vinyl: DbVinylLight) => {
      // Récupère les artistes du vinyle
      const vinylArtists: ArtistLight[] = (vinyl.vinyl_artists || [])
        .sort((a: DbVinylArtist, b: DbVinylArtist) => a.position - b.position)
        .map((va: DbVinylArtist) => ({
          id: va.artist?.id || '',
          name: va.artist?.name || '',
          imageUrl: va.artist?.image_url || null,
        }))
        .filter((artist: ArtistLight) => artist.id && artist.name);

      return {
        id: vinyl.id,
        title: vinyl.title,
        artists: vinylArtists.length > 0 ? vinylArtists : artists, // Fallback sur les artistes de l'album
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
      coverUrl: data.cover_url,
      vinyls: vinyls,
      year: data.year,
    };
  }

  /**
   * Transforme les données de la DB en interface AlbumLight (sans vinyles)
   */
  private transformAlbumLightData(data: DbAlbumWithRelations): AlbumLight {
    // Récupère et trie les artistes de l'album par position
    const artists: ArtistLight[] = (data.album_artists || [])
      .sort((a: DbAlbumArtist, b: DbAlbumArtist) => a.position - b.position)
      .map((aa: DbAlbumArtist) => ({
        id: aa.artists?.id || aa.artist?.id || '',
        name: aa.artists?.name || aa.artist?.name || '',
        imageUrl: aa.artists?.image_url || aa.artist?.image_url || null,
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
