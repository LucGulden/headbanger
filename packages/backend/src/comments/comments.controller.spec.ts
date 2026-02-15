import { Test, TestingModule } from '@nestjs/testing'
import { CommentsController } from './comments.controller'
import { CommentsService } from './comments.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'

const mockCommentsService = {
  getPostComments: jest.fn(),
  getCommentsCount: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
}

const mockUser: AuthenticatedUser = { id: 'u1' } as AuthenticatedUser
const mockToken = 'mock-token'

describe('CommentsController', () => {
  let controller: CommentsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: mockCommentsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<CommentsController>(CommentsController)
  })

  describe('getPostComments', () => {
    it('délègue à getPostComments avec le bon postId', async () => {
      mockCommentsService.getPostComments.mockResolvedValue([])

      await controller.getPostComments('p1')

      expect(mockCommentsService.getPostComments).toHaveBeenCalledWith('p1')
    })

    it('retourne le résultat du service', async () => {
      const comments = [{ id: 'c1', content: 'Super !' }]
      mockCommentsService.getPostComments.mockResolvedValue(comments)

      const result = await controller.getPostComments('p1')

      expect(result).toEqual(comments)
    })
  })

  describe('getCommentsCount', () => {
    it('délègue à getCommentsCount avec le bon postId', async () => {
      mockCommentsService.getCommentsCount.mockResolvedValue(3)

      await controller.getCommentsCount('p1')

      expect(mockCommentsService.getCommentsCount).toHaveBeenCalledWith('p1')
    })

    it('retourne { count } avec la valeur du service', async () => {
      mockCommentsService.getCommentsCount.mockResolvedValue(3)

      const result = await controller.getCommentsCount('p1')

      expect(result).toEqual({ count: 3 })
    })
  })

  describe('addComment', () => {
    it('délègue à addComment avec token, postId, userId et content', async () => {
      const comment = { id: 'c1', content: 'Super !' }
      mockCommentsService.addComment.mockResolvedValue(comment)

      await controller.addComment(mockToken, mockUser, 'p1', 'Super !')

      expect(mockCommentsService.addComment).toHaveBeenCalledWith(mockToken, 'p1', 'u1', 'Super !')
    })

    it('retourne le commentaire créé', async () => {
      const comment = { id: 'c1', content: 'Super !' }
      mockCommentsService.addComment.mockResolvedValue(comment)

      const result = await controller.addComment(mockToken, mockUser, 'p1', 'Super !')

      expect(result).toEqual(comment)
    })
  })

  describe('deleteComment', () => {
    it('délègue à deleteComment avec token, id et userId', async () => {
      mockCommentsService.deleteComment.mockResolvedValue(undefined)

      await controller.deleteComment(mockToken, mockUser, 'c1')

      expect(mockCommentsService.deleteComment).toHaveBeenCalledWith(mockToken, 'c1', 'u1')
    })

    it('retourne { success: true }', async () => {
      mockCommentsService.deleteComment.mockResolvedValue(undefined)

      const result = await controller.deleteComment(mockToken, mockUser, 'c1')

      expect(result).toEqual({ success: true })
    })
  })
})
