import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common'
import { User } from '@headbanger/shared'
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { AuthGuard } from '../auth/guards/auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'
import { CurrentToken } from '../auth/decorators/current-token.decorator'
import { CsrfGuard } from '../auth/guards/csrf.guard'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me
   * Récupère le profil de l'utilisateur connecté
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.usersService.getUserByUid(user.id)
  }

  /**
   * PUT /users/me
   * Met à jour le profil de l'utilisateur connecté
   */
  @Put('me')
  @UseGuards(AuthGuard, CsrfGuard)
  async updateCurrentUser(
    @CurrentToken() token: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUserProfile(token, user.id, updateDto)
  }

  /**
   * GET /users/username/:username
   * Récupère un utilisateur par son username (public)
   */
  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string): Promise<User> {
    return this.usersService.getUserByUsername(username)
  }

  /**
   * GET /users/search?query=...&limit=...&offset=...
   * Recherche d'utilisateurs (public)
   */
  @Get('search')
  async searchUsers(
    @Query('query') query: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<User[]> {
    return this.usersService.searchUsers(
      query,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    )
  }

  /**
   * GET /users/check-username?username=...&excludeUserId=...
   * Vérifie la disponibilité d'un username (public)
   */
  @Get('check-username')
  async checkUsernameAvailability(
    @Query('username') username: string,
    @Query('excludeUserId') excludeUserId?: string,
  ): Promise<{ available: boolean }> {
    const available = await this.usersService.checkUsernameAvailability(username, excludeUserId)
    return { available }
  }

  /**
   * GET /users/:uid
   * Récupère un utilisateur par son UID (public)
   */
  @Get(':uid')
  async getUserByUid(@Param('uid') uid: string): Promise<User> {
    return this.usersService.getUserByUid(uid)
  }
}
