import { Injectable, NotFoundException } from '@nestjs/common';
import { Artist, ArtistLight } from '@fillcrate/shared';
import { SupabaseService } from '../common/database/supabase.service';

@Injectable()
export class ArtistsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Récupère un artiste par son ID
   */
  async getById(id: string): Promise<Artist> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    return this.transformArtistData(data);
  }

  /**
   * Recherche d'artistes par nom
   */
  async search(
    query: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<ArtistLight[]> {
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
   * Transformation DB → Artist (camelCase)
   */
  private transformArtistData(data: any): Artist {
    return {
      id: data.id,
      name: data.name,
      imageUrl: data.image_url,
      spotifyId: data.spotify_id,
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