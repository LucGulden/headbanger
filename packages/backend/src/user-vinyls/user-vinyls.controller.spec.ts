import { Test, TestingModule } from '@nestjs/testing'
import { UserVinylsController } from './user-vinyls.controller'
import { UserVinylsService } from './user-vinyls.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'

const mockUserVinylsService = {
  getUserVinyls: jest.fn(),
  getUserVinylsCount: jest.fn(),
  getVinylStats: jest.fn(),
  hasVinyl: jest.fn(),
  addVinylToUser: jest.fn(),
  removeVinylFromUser: jest.fn(),
  moveToCollection: jest.fn(),
}

const mockUser: AuthenticatedUser = { id: 'u1' } as AuthenticatedUser

describe('UserVinylsController', () => {
  let controller: UserVinylsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserVinylsController],
      providers: [{ provide: UserVinylsService, useValue: mockUserVinylsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<UserVinylsController>(UserVinylsController)
  })

  describe('getUserVinylsByUserId', () => {
    it('délègue à getUserVinyls avec userId, type, limit parsée et lastAddedAt', async () => {
      mockUserVinylsService.getUserVinyls.mockResolvedValue([])

      await controller.getUserVinylsByUserId('u2', 'collection', 10, '2024-01-01T00:00:00Z')

      expect(mockUserVinylsService.getUserVinyls).toHaveBeenCalledWith(
        'u2',
        'collection',
        10,
        '2024-01-01T00:00:00Z',
      )
    })

    it('applique la limite par défaut (20) si absente', async () => {
      mockUserVinylsService.getUserVinyls.mockResolvedValue([])

      await controller.getUserVinylsByUserId('u2', 'collection')

      expect(mockUserVinylsService.getUserVinyls).toHaveBeenCalledWith(
        'u2',
        'collection',
        20,
        undefined,
      )
    })

    it('retourne le résultat du service', async () => {
      const vinyls = [{ id: 'v1' }]
      mockUserVinylsService.getUserVinyls.mockResolvedValue(vinyls)

      const result = await controller.getUserVinylsByUserId('u2', 'collection')

      expect(result).toEqual(vinyls)
    })
  })

  describe('getUserVinylsCountByUserId', () => {
    it('délègue à getUserVinylsCount avec userId et type', async () => {
      mockUserVinylsService.getUserVinylsCount.mockResolvedValue(5)

      await controller.getUserVinylsCountByUserId('u2', 'wishlist')

      expect(mockUserVinylsService.getUserVinylsCount).toHaveBeenCalledWith('u2', 'wishlist')
    })

    it('retourne { count } avec la valeur du service', async () => {
      mockUserVinylsService.getUserVinylsCount.mockResolvedValue(5)

      const result = await controller.getUserVinylsCountByUserId('u2', 'collection')

      expect(result).toEqual({ count: 5 })
    })
  })

  describe('getVinylStatsByUserId', () => {
    it('délègue à getVinylStats avec le bon userId', async () => {
      mockUserVinylsService.getVinylStats.mockResolvedValue({ collection: 3, wishlist: 1 })

      await controller.getVinylStatsByUserId('u2')

      expect(mockUserVinylsService.getVinylStats).toHaveBeenCalledWith('u2')
    })

    it('retourne le résultat du service', async () => {
      const stats = { collection: 3, wishlist: 1 }
      mockUserVinylsService.getVinylStats.mockResolvedValue(stats)

      const result = await controller.getVinylStatsByUserId('u2')

      expect(result).toEqual(stats)
    })
  })

  describe('hasVinyl', () => {
    it('délègue à hasVinyl avec userId courant, vinylId et type', async () => {
      mockUserVinylsService.hasVinyl.mockResolvedValue(true)

      await controller.hasVinyl(mockUser, 'v1', 'collection')

      expect(mockUserVinylsService.hasVinyl).toHaveBeenCalledWith('u1', 'v1', 'collection')
    })

    it('retourne { has } avec la valeur du service', async () => {
      mockUserVinylsService.hasVinyl.mockResolvedValue(true)

      const result = await controller.hasVinyl(mockUser, 'v1', 'collection')

      expect(result).toEqual({ has: true })
    })
  })

  describe('addVinylToUser', () => {
    it('délègue à addVinylToUser avec userId courant, vinylId et type', async () => {
      mockUserVinylsService.addVinylToUser.mockResolvedValue({ id: 'uv1' })

      await controller.addVinylToUser(mockUser, 'v1', 'collection')

      expect(mockUserVinylsService.addVinylToUser).toHaveBeenCalledWith('u1', 'v1', 'collection')
    })

    it('retourne le résultat du service', async () => {
      const userVinyl = { id: 'uv1', vinylId: 'v1' }
      mockUserVinylsService.addVinylToUser.mockResolvedValue(userVinyl)

      const result = await controller.addVinylToUser(mockUser, 'v1', 'collection')

      expect(result).toEqual(userVinyl)
    })
  })

  describe('removeVinylFromUser', () => {
    it('délègue à removeVinylFromUser avec userId courant, vinylId et type', async () => {
      mockUserVinylsService.removeVinylFromUser.mockResolvedValue(undefined)

      await controller.removeVinylFromUser(mockUser, 'v1', 'wishlist')

      expect(mockUserVinylsService.removeVinylFromUser).toHaveBeenCalledWith('u1', 'v1', 'wishlist')
    })

    it('retourne { success: true }', async () => {
      mockUserVinylsService.removeVinylFromUser.mockResolvedValue(undefined)

      const result = await controller.removeVinylFromUser(mockUser, 'v1', 'collection')

      expect(result).toEqual({ success: true })
    })
  })

  describe('moveToCollection', () => {
    it('délègue à moveToCollection avec userId courant et vinylId', async () => {
      mockUserVinylsService.moveToCollection.mockResolvedValue({ id: 'uv1' })

      await controller.moveToCollection(mockUser, 'v1')

      expect(mockUserVinylsService.moveToCollection).toHaveBeenCalledWith('u1', 'v1')
    })

    it('retourne le résultat du service', async () => {
      const userVinyl = { id: 'uv1', vinylId: 'v1', type: 'collection' }
      mockUserVinylsService.moveToCollection.mockResolvedValue(userVinyl)

      const result = await controller.moveToCollection(mockUser, 'v1')

      expect(result).toEqual(userVinyl)
    })
  })
})
