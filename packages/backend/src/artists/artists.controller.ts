import { Controller, Get, Param, Query } from '@nestjs/common'
import { Artist, ArtistLight } from '@headbanger/shared'
import { ArtistsService } from './artists.service'

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  /**
   * GET /artists/:id
   * Récupère un artiste par son ID
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<Artist> {
    return this.artistsService.getById(id)
  }

  /**
   * GET /artists/search?query=...&limit=...&offset=...
   * Recherche d'artistes par nom
   */
  @Get()
  async search(
    @Query('query') query: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ArtistLight[]> {
    return this.artistsService.search(
      query,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    )
  }
}
