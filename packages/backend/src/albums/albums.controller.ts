import { Controller, Get, Param } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { Album } from '@fillcrate/shared';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  /**
   * GET /albums/:id
   * Récupère un album par son ID
   * Route publique (pas de @UseGuards(AuthGuard))
   */
  @Get(':id')
  async getAlbumById(@Param('id') id: string): Promise<Album> {
    return this.albumsService.findById(id);
  }
}