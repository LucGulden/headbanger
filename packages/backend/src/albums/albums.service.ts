import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/database/supabase.service';
import { Album } from '@fillcrate/shared';

@Injectable()
export class AlbumsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Récupère un album par son ID avec ses artistes
   * Retourne l'interface Album avec artist en string (concaténation)
   */
  async findById(albumId: string): Promise<Album> {
    const supabase = this.supabaseService.getClient();

    // Récupère l'album avec ses artistes via jointure
    const { data, error } = await supabase
      .from('albums')
      .select(
        `
        id,
        spotify_id,
        spotify_url,
        title,
        cover_url,
        year,
        created_by,
        created_at,
        album_artists!inner (
          position,
          artists (
            id,
            name
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

    // Transforme les données DB en interface Album
    return this.transformAlbumData(data);
  }

  /**
   * Transforme les données de la DB en interface Album
   * Concatène les artistes en une seule string séparée par des virgules
   */
  private transformAlbumData(data: any): Album {
    // Récupère et trie les artistes par position
    const artists = data.album_artists
      .sort((a: any, b: any) => a.position - b.position)
      .map((aa: any) => aa.artists.name);

    // Concatène les artistes avec des virgules
    const artistString = artists.join(', ');

    return {
      id: data.id,
      spotifyId: data.spotify_id,
      spotifyUrl: data.spotify_url,
      title: data.title,
      artist: artistString,
      coverUrl: data.cover_url,
      year: data.year,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }
}