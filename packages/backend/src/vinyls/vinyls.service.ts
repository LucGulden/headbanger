import { Injectable, NotFoundException } from '@nestjs/common';
import { Vinyl, ArtistLight } from '@fillcrate/shared';
import { SupabaseService } from '../common/database/supabase.service';

@Injectable()
export class VinylsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Récupère un vinyl par son ID avec ses artistes
   */
  async getById(id: string): Promise<Vinyl> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('vinyls')
      .select(`
        *,
        vinyl_artists(
          position,
          artist:artists(
            id,
            name,
            image_url
          )
        )
      `)
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
    // Extraire et trier les artistes par position
    const artists: ArtistLight[] = (data.vinyl_artists || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((va: any) => ({
        id: va.artist?.id,
        name: va.artist?.name,
        imageUrl: va.artist?.image_url,
      }))
      .filter((artist: ArtistLight) => artist.id && artist.name);

    return {
      id: data.id,
      title: data.title,
      artists: artists.length > 0 ? artists : [{ id: '', name: 'Artiste inconnu', imageUrl: null }],
      coverUrl: data.cover_url,
      year: data.year,
      label: data.label,
      catalogNumber: data.catalog_number,
      country: data.country,
      format: data.format,
    };
  }
}