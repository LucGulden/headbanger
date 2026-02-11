import { Controller, Get, Param, Query } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { Album, AlbumLight } from '@headbanger/shared';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  /**
   * GET /albums/search?query=abbey&limit=20&offset=0
   * Recherche d'albums par titre
   * Retourne AlbumLight[] (sans les vinyles)
   */
  @Get('search')
  async search(
    @Query('query') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<AlbumLight[]> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.albumsService.searchAlbums(query, limitNum, offsetNum);
  }

  /**
   * GET /albums/:id
   * Récupère un album par son ID
   * Retourne Album (avec les vinyles)
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<Album> {
    return this.albumsService.findById(id);
  }
}
