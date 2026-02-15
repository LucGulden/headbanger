import { Controller, Get, Param } from '@nestjs/common'
import { Vinyl } from '@headbanger/shared'
import { VinylsService } from './vinyls.service'

@Controller('vinyls')
export class VinylsController {
  constructor(private readonly vinylsService: VinylsService) {}

  /**
   * GET /vinyls/:id
   * Récupère un vinyl par son ID
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<Vinyl> {
    return this.vinylsService.getById(id)
  }
}
