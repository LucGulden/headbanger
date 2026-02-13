import { Test, TestingModule } from '@nestjs/testing'
import { FollowsController } from './follows.controller'
import { FollowsService } from './follows.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'

const mockFollowsService = {
  getFollowStats: jest.fn(),
  isFollowing: jest.fn(),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
}

const mockUser: AuthenticatedUser = { id: 'u1' } as AuthenticatedUser
const mockToken = 'mock-token'

describe('FollowsController', () => {
  let controller: FollowsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowsController],
      providers: [{ provide: FollowsService, useValue: mockFollowsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<FollowsController>(FollowsController)
  })

  describe('getFollowStats', () => {
    it('délègue à getFollowStats avec le bon userId', async () => {
      mockFollowsService.getFollowStats.mockResolvedValue({ followers: 5, following: 3 })

      await controller.getFollowStats('u2')

      expect(mockFollowsService.getFollowStats).toHaveBeenCalledWith('u2')
    })

    it('retourne le résultat du service', async () => {
      const stats = { followers: 5, following: 3 }
      mockFollowsService.getFollowStats.mockResolvedValue(stats)

      const result = await controller.getFollowStats('u2')

      expect(result).toEqual(stats)
    })
  })

  describe('isFollowing', () => {
    it('délègue à isFollowing avec userId courant et cible', async () => {
      mockFollowsService.isFollowing.mockResolvedValue(true)

      await controller.isFollowing(mockUser, 'u2')

      expect(mockFollowsService.isFollowing).toHaveBeenCalledWith('u1', 'u2')
    })

    it('retourne { isFollowing } avec la valeur du service', async () => {
      mockFollowsService.isFollowing.mockResolvedValue(true)

      const result = await controller.isFollowing(mockUser, 'u2')

      expect(result).toEqual({ isFollowing: true })
    })
  })

  describe('followUser', () => {
    it('délègue à followUser avec token, userId courant et cible', async () => {
      mockFollowsService.followUser.mockResolvedValue(undefined)

      await controller.followUser(mockToken, mockUser, 'u2')

      expect(mockFollowsService.followUser).toHaveBeenCalledWith(mockToken, 'u1', 'u2')
    })

    it('retourne { success: true }', async () => {
      mockFollowsService.followUser.mockResolvedValue(undefined)

      const result = await controller.followUser(mockToken, mockUser, 'u2')

      expect(result).toEqual({ success: true })
    })
  })

  describe('unfollowUser', () => {
    it('délègue à unfollowUser avec token, userId courant et cible', async () => {
      mockFollowsService.unfollowUser.mockResolvedValue(undefined)

      await controller.unfollowUser(mockToken, mockUser, 'u2')

      expect(mockFollowsService.unfollowUser).toHaveBeenCalledWith(mockToken, 'u1', 'u2')
    })

    it('retourne { success: true }', async () => {
      mockFollowsService.unfollowUser.mockResolvedValue(undefined)

      const result = await controller.unfollowUser(mockToken, mockUser, 'u2')

      expect(result).toEqual({ success: true })
    })
  })

  describe('getFollowers', () => {
    it('délègue à getFollowers avec le bon userId', async () => {
      mockFollowsService.getFollowers.mockResolvedValue([])

      await controller.getFollowers('u2')

      expect(mockFollowsService.getFollowers).toHaveBeenCalledWith('u2')
    })

    it('retourne le résultat du service', async () => {
      const users = [{ uid: 'u3', username: 'alice' }]
      mockFollowsService.getFollowers.mockResolvedValue(users)

      const result = await controller.getFollowers('u2')

      expect(result).toEqual(users)
    })
  })

  describe('getFollowing', () => {
    it('délègue à getFollowing avec le bon userId', async () => {
      mockFollowsService.getFollowing.mockResolvedValue([])

      await controller.getFollowing('u2')

      expect(mockFollowsService.getFollowing).toHaveBeenCalledWith('u2')
    })

    it('retourne le résultat du service', async () => {
      const users = [{ uid: 'u3', username: 'alice' }]
      mockFollowsService.getFollowing.mockResolvedValue(users)

      const result = await controller.getFollowing('u2')

      expect(result).toEqual(users)
    })
  })
})
