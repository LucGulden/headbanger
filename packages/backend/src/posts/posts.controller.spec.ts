import { Test, TestingModule } from '@nestjs/testing'
import { PostsController } from './posts.controller'
import { PostsService } from './posts.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'

const mockPostsService = {
  getGlobalFeed: jest.fn(),
  getProfileFeed: jest.fn(),
}

const mockUser: AuthenticatedUser = { id: 'u1' } as AuthenticatedUser

describe('PostsController', () => {
  let controller: PostsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockPostsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<PostsController>(PostsController)
  })

  describe('getGlobalFeed', () => {
    it('délègue à getGlobalFeed avec userId, limit parsée et lastCreatedAt', async () => {
      mockPostsService.getGlobalFeed.mockResolvedValue([])

      await controller.getGlobalFeed(mockUser, 10, '2024-01-01T00:00:00Z')

      expect(mockPostsService.getGlobalFeed).toHaveBeenCalledWith('u1', 10, '2024-01-01T00:00:00Z')
    })

    it('applique la limite par défaut (20) si absente', async () => {
      mockPostsService.getGlobalFeed.mockResolvedValue([])

      await controller.getGlobalFeed(mockUser)

      expect(mockPostsService.getGlobalFeed).toHaveBeenCalledWith('u1', 20, undefined)
    })

    it('retourne le résultat du service', async () => {
      const posts = [{ id: 'p1' }]
      mockPostsService.getGlobalFeed.mockResolvedValue(posts)

      const result = await controller.getGlobalFeed(mockUser)

      expect(result).toEqual(posts)
    })
  })

  describe('getProfileFeed', () => {
    it('délègue à getProfileFeed avec userId, limit parsée et lastCreatedAt', async () => {
      mockPostsService.getProfileFeed.mockResolvedValue([])

      await controller.getProfileFeed('u2', 5, '2024-01-01T00:00:00Z')

      expect(mockPostsService.getProfileFeed).toHaveBeenCalledWith('u2', 5, '2024-01-01T00:00:00Z')
    })

    it('applique la limite par défaut (20) si absente', async () => {
      mockPostsService.getProfileFeed.mockResolvedValue([])

      await controller.getProfileFeed('u2')

      expect(mockPostsService.getProfileFeed).toHaveBeenCalledWith('u2', 20, undefined)
    })

    it('retourne le résultat du service', async () => {
      const posts = [{ id: 'p1' }]
      mockPostsService.getProfileFeed.mockResolvedValue(posts)

      const result = await controller.getProfileFeed('u2')

      expect(result).toEqual(posts)
    })
  })
})
