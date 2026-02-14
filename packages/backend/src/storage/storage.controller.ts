import { Controller, Post, Delete, UseGuards, BadRequestException, Req } from '@nestjs/common'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator'
import { CurrentToken } from '../auth/decorators/current-token.decorator'
import { StorageService } from './storage.service'
import type { FastifyRequest } from 'fastify'
import { CsrfGuard } from '../auth/guards/csrf.guard'

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload un avatar
   * POST /storage/upload/avatar
   */
  @Post('upload/avatar')
  @UseGuards(AuthGuard, CsrfGuard)
  async uploadAvatar(
    @CurrentToken() token: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    // Fastify multipart : récupérer le fichier
    const data = await req.file()

    if (!data) {
      throw new BadRequestException('Aucun fichier fourni')
    }

    // Convertir le stream en buffer
    const buffer = await data.toBuffer()

    const url = await this.storageService.uploadAvatar(token, user.id, buffer, data.mimetype)

    return { url }
  }

  /**
   * Supprime l'avatar de l'utilisateur connecté
   * DELETE /storage/avatar
   */
  @Delete('avatar')
  @UseGuards(AuthGuard, CsrfGuard)
  async deleteAvatar(@CurrentToken() token: string, @CurrentUser() user: AuthenticatedUser) {
    await this.storageService.deleteAvatar(token, user.id)
    return { success: true }
  }
}
