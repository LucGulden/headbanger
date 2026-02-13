import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'
import { UpdateUserDto } from './dto/update-user.dto'

const mockUsersService = {
  getUserByUid: jest.fn(),
  updateUserProfile: jest.fn(),
  getUserByUsername: jest.fn(),
  searchUsers: jest.fn(),
  checkUsernameAvailability: jest.fn(),
}

const mockUser: AuthenticatedUser = { id: 'u1' } as AuthenticatedUser
const mockToken = 'mock-token'

describe('UsersController', () => {
  let controller: UsersController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<UsersController>(UsersController)
  })

  describe('getCurrentUser', () => {
    it('délègue à getUserByUid avec le userId courant', async () => {
      mockUsersService.getUserByUid.mockResolvedValue({ uid: 'u1' })

      await controller.getCurrentUser(mockUser)

      expect(mockUsersService.getUserByUid).toHaveBeenCalledWith('u1')
    })

    it('retourne le résultat du service', async () => {
      const user = { uid: 'u1', username: 'miles' }
      mockUsersService.getUserByUid.mockResolvedValue(user)

      const result = await controller.getCurrentUser(mockUser)

      expect(result).toEqual(user)
    })
  })

  describe('updateCurrentUser', () => {
    it('délègue à updateUserProfile avec token, userId et dto', async () => {
      const dto: UpdateUserDto = { username: 'miles_davis' }
      mockUsersService.updateUserProfile.mockResolvedValue({ uid: 'u1' })

      await controller.updateCurrentUser(mockToken, mockUser, dto)

      expect(mockUsersService.updateUserProfile).toHaveBeenCalledWith(mockToken, 'u1', dto)
    })

    it('retourne le résultat du service', async () => {
      const user = { uid: 'u1', username: 'miles_davis' }
      mockUsersService.updateUserProfile.mockResolvedValue(user)

      const result = await controller.updateCurrentUser(mockToken, mockUser, {})

      expect(result).toEqual(user)
    })
  })

  describe('getUserByUsername', () => {
    it('délègue à getUserByUsername avec le bon username', async () => {
      mockUsersService.getUserByUsername.mockResolvedValue({ uid: 'u1' })

      await controller.getUserByUsername('miles')

      expect(mockUsersService.getUserByUsername).toHaveBeenCalledWith('miles')
    })

    it('retourne le résultat du service', async () => {
      const user = { uid: 'u1', username: 'miles' }
      mockUsersService.getUserByUsername.mockResolvedValue(user)

      const result = await controller.getUserByUsername('miles')

      expect(result).toEqual(user)
    })
  })

  describe('searchUsers', () => {
    it('délègue à searchUsers avec query, limit et offset convertis', async () => {
      mockUsersService.searchUsers.mockResolvedValue([])

      await controller.searchUsers('miles', 5, 10)

      expect(mockUsersService.searchUsers).toHaveBeenCalledWith('miles', 5, 10)
    })

    it('applique les valeurs par défaut si limit et offset sont absents', async () => {
      mockUsersService.searchUsers.mockResolvedValue([])

      await controller.searchUsers('miles')

      expect(mockUsersService.searchUsers).toHaveBeenCalledWith('miles', 20, 0)
    })

    it('retourne le résultat du service', async () => {
      const users = [{ uid: 'u1', username: 'miles' }]
      mockUsersService.searchUsers.mockResolvedValue(users)

      const result = await controller.searchUsers('miles')

      expect(result).toEqual(users)
    })
  })

  describe('checkUsernameAvailability', () => {
    it('délègue à checkUsernameAvailability avec username et excludeUserId', async () => {
      mockUsersService.checkUsernameAvailability.mockResolvedValue(true)

      await controller.checkUsernameAvailability('miles', 'u2')

      expect(mockUsersService.checkUsernameAvailability).toHaveBeenCalledWith('miles', 'u2')
    })

    it('délègue sans excludeUserId si absent', async () => {
      mockUsersService.checkUsernameAvailability.mockResolvedValue(true)

      await controller.checkUsernameAvailability('miles')

      expect(mockUsersService.checkUsernameAvailability).toHaveBeenCalledWith('miles', undefined)
    })

    it('retourne { available } avec la valeur du service', async () => {
      mockUsersService.checkUsernameAvailability.mockResolvedValue(true)

      const result = await controller.checkUsernameAvailability('miles')

      expect(result).toEqual({ available: true })
    })
  })

  describe('getUserByUid', () => {
    it('délègue à getUserByUid avec le bon uid', async () => {
      mockUsersService.getUserByUid.mockResolvedValue({ uid: 'u1' })

      await controller.getUserByUid('u1')

      expect(mockUsersService.getUserByUid).toHaveBeenCalledWith('u1')
    })

    it('retourne le résultat du service', async () => {
      const user = { uid: 'u1', username: 'miles' }
      mockUsersService.getUserByUid.mockResolvedValue(user)

      const result = await controller.getUserByUid('u1')

      expect(result).toEqual(user)
    })
  })
})
