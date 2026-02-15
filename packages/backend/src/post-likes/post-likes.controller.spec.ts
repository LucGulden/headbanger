import { Test, TestingModule } from '@nestjs/testing'
import { PostLikesController } from './post-likes.controller'
import { PostLikesService } from './post-likes.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'

const mockPostLikesService = {
  likePost: jest.fn(),
  unlikePost: jest.fn(),
  hasLikedPost: jest.fn(),
  getLikesCount: jest.fn(),
}

const mockUser: AuthenticatedUser = { id: 'u1' } as AuthenticatedUser
const mockToken = 'mock-token'

describe('PostLikesController', () => {
  let controller: PostLikesController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostLikesController],
      providers: [{ provide: PostLikesService, useValue: mockPostLikesService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<PostLikesController>(PostLikesController)
  })

  describe('likePost', () => {
    it('délègue à likePost avec token, userId et postId', async () => {
      mockPostLikesService.likePost.mockResolvedValue(undefined)

      await controller.likePost(mockToken, mockUser, 'p1')

      expect(mockPostLikesService.likePost).toHaveBeenCalledWith(mockToken, 'u1', 'p1')
    })

    it('retourne { success: true }', async () => {
      mockPostLikesService.likePost.mockResolvedValue(undefined)

      const result = await controller.likePost(mockToken, mockUser, 'p1')

      expect(result).toEqual({ success: true })
    })
  })

  describe('unlikePost', () => {
    it('délègue à unlikePost avec token, userId et postId', async () => {
      mockPostLikesService.unlikePost.mockResolvedValue(undefined)

      await controller.unlikePost(mockToken, mockUser, 'p1')

      expect(mockPostLikesService.unlikePost).toHaveBeenCalledWith(mockToken, 'u1', 'p1')
    })

    it('retourne { success: true }', async () => {
      mockPostLikesService.unlikePost.mockResolvedValue(undefined)

      const result = await controller.unlikePost(mockToken, mockUser, 'p1')

      expect(result).toEqual({ success: true })
    })
  })

  describe('hasLikedPost', () => {
    it('délègue à hasLikedPost avec userId et postId', async () => {
      mockPostLikesService.hasLikedPost.mockResolvedValue(true)

      await controller.hasLikedPost(mockUser, 'p1')

      expect(mockPostLikesService.hasLikedPost).toHaveBeenCalledWith('u1', 'p1')
    })

    it('retourne { hasLiked } avec la valeur du service', async () => {
      mockPostLikesService.hasLikedPost.mockResolvedValue(true)

      const result = await controller.hasLikedPost(mockUser, 'p1')

      expect(result).toEqual({ hasLiked: true })
    })
  })

  describe('getLikesCount', () => {
    it('délègue à getLikesCount avec le bon postId', async () => {
      mockPostLikesService.getLikesCount.mockResolvedValue(7)

      await controller.getLikesCount('p1')

      expect(mockPostLikesService.getLikesCount).toHaveBeenCalledWith('p1')
    })

    it('retourne { count } avec la valeur du service', async () => {
      mockPostLikesService.getLikesCount.mockResolvedValue(7)

      const result = await controller.getLikesCount('p1')

      expect(result).toEqual({ count: 7 })
    })
  })
})
