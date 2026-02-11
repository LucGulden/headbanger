import { Injectable, NotFoundException } from '@nestjs/common';
import { AlbumLight, Artist, ArtistLight } from '@headbanger/shared';
import { SupabaseService } from '../common/database/supabase.service';

@Injectable()
export class ArtistsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Récupère un artiste par son ID
   */
  async getById(id: string): Promise<Artist> {
    const supabase = this.supabaseService.getClient();

    // Récupère l'artiste
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('id, name, image_url, spotify_id')
      .eq('id', id)
      .single();

    if (artistError || !artistData) {
      console.error('Artist not found:', artistError);
      throw new NotFoundException('Artist not found');
    }

    // Récupérer les albums de cet artiste via la table de jointure
    const { data: albumArtistsData, error: albumsError } = await supabase
      .from('album_artists')
      .select(
        `
        position,
        album:albums (
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
        )
      `,
      )
      .eq('artist_id', id)
      .order('position', { ascending: true });

    if (albumsError) {
      console.error('Error fetching albums:', albumsError);
    }

    // Transformer les données
    return this.transformArtistData(artistData, albumArtistsData || []);
  }

  /**
   * Recherche d'artistes par nom
   */
  async search(query: string, limit: number = 20, offset: number = 0): Promise<ArtistLight[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const supabase = this.supabaseService.getClient();
    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
      .from('artists')
      .select('id, name, image_url')
      .ilike('name', searchTerm)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error searching artists: ${error.message}`);
    }

    return data.map((artist) => this.transformArtistLightData(artist));
  }

  /**
   * Transforme les données de la DB en interface Artist
   */
  private transformArtistData(artistData: any, albumArtistsData: any[]): Artist {
    // Extraire et transformer les albums
    const albums: AlbumLight[] = albumArtistsData
      .filter((aa: any) => aa.album) // Filtrer les albums null
      .map((aa: any) => {
        const album = aa.album;

        // Récupère et trie les artistes de l'album
        const artists: ArtistLight[] = (album.album_artists || [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((artist: any) => ({
            id: artist.artists?.id,
            name: artist.artists?.name,
            imageUrl: artist.artists?.image_url,
          }))
          .filter((artist: ArtistLight) => artist.id && artist.name);

        return {
          id: album.id,
          title: album.title,
          artists: artists.length > 0 ? artists : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
          coverUrl: album.cover_url,
          year: album.year,
        };
      });

    // Retourner l'artiste avec ses albums
    return {
      id: artistData.id,
      name: artistData.name,
      imageUrl: artistData.image_url,
      spotifyId: artistData.spotify_id,
      albums: albums,
    };
  }

  /**
   * Transformation DB → ArtistLight (camelCase)
   */
  private transformArtistLightData(data: any): ArtistLight {
    return {
      id: data.id,
      name: data.name,
      imageUrl: data.image_url,
    };
  }
}
