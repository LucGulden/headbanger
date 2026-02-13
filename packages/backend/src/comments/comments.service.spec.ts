import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { CommentsService } from './comments.service'
import { SupabaseService } from '../common/database/supabase.service'
import { NotificationsService } from '../notifications/notifications.service'
import type { CommentQueryResult } from './comments.types'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

// Anon client (getClient) — getPostComments + getCommentsCount
const mockAnonOrder = jest.fn()
const mockAnonEq = jest.fn()

const anonCommentsChain = {
  select: jest.fn().mockReturnThis(),
  eq: mockAnonEq,
  order: mockAnonOrder,
}

const mockAnonFrom = jest.fn(() => anonCommentsChain)
const anonClient = { from: mockAnonFrom }

// Auth client (getClientWithAuth) — addComment, deleteComment
const mockAuthSingle = jest.fn()
const mockAuthDeleteEq = jest.fn()

// Chain pour insert (addComment)
const authInsertChain = {
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: mockAuthSingle,
}

// Chain pour select (deleteComment — première requête + createCommentNotification)
const authSelectChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: mockAuthSingle,
}

// Chain pour delete (deleteComment — deuxième requête)
const authDeleteChain = {
  delete: jest.fn().mockReturnThis(),
  eq: mockAuthDeleteEq,
}

const mockAuthFrom = jest.fn()
const authClient = { from: mockAuthFrom }

const mockSupabaseService = {
  getClient: jest.fn(() => anonClient),
  getClientWithAuth: jest.fn(() => authClient),
}

// NotificationsService mock
const mockNotificationsService = {
  createNotification: jest.fn().mockResolvedValue(undefined),
  deleteByComment: jest.fn().mockResolvedValue(undefined),
}

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeCommentDbResult = (overrides: Partial<CommentQueryResult> = {}): CommentQueryResult => ({
  id: 'c1',
  post_id: 'p1',
  user_id: 'u1',
  content: 'Super post !',
  created_at: '2024-01-01T10:00:00Z',
  user: [{ uid: 'u1', username: 'miles', photo_url: 'avatar.png' }],
  ...overrides,
})

const TOKEN = 'auth-token'
const POST_ID = 'p1'
const USER_ID = 'u1'
const COMMENT_ID = 'c1'

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('CommentsService', () => {
  let service: CommentsService

  beforeEach(async () => {
    mockAuthFrom.mockReset()
    mockAuthSingle.mockReset()
    mockNotificationsService.createNotification.mockReset()
    mockNotificationsService.deleteByComment.mockReset()

    // Comportement par défaut de anonEq : retourne this pour le chaînage
    mockAnonEq.mockReturnValue(anonCommentsChain)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile()

    service = module.get<CommentsService>(CommentsService)
  })

  // -----------------------------------------------------------------------
  // getPostComments
  // -----------------------------------------------------------------------

  describe('getPostComments', () => {
    it('interroge comments avec le bon post_id', async () => {
      mockAnonOrder.mockResolvedValue({ data: [], error: null })

      await service.getPostComments(POST_ID)

      expect(mockAnonFrom).toHaveBeenCalledWith('comments')
      expect(anonCommentsChain.eq).toHaveBeenCalledWith('post_id', POST_ID)
    })

    it('retourne un tableau vide si aucun commentaire', async () => {
      mockAnonOrder.mockResolvedValue({ data: [], error: null })

      const res = await service.getPostComments(POST_ID)

      expect(res).toHaveLength(0)
    })

    it("mappe tous les champs d'un commentaire", async () => {
      mockAnonOrder.mockResolvedValue({ data: [makeCommentDbResult()], error: null })

      const res = await service.getPostComments(POST_ID)

      expect(res).toHaveLength(1)
      expect(res[0].id).toBe('c1')
      expect(res[0].postId).toBe('p1')
      expect(res[0].content).toBe('Super post !')
      expect(res[0].createdAt).toBe('2024-01-01T10:00:00Z')
      expect(res[0].user).toEqual({ uid: 'u1', username: 'miles', photoUrl: 'avatar.png' })
    })

    it('mappe correctement photo_url en photoUrl', async () => {
      mockAnonOrder.mockResolvedValue({
        data: [makeCommentDbResult({ user: [{ uid: 'u1', username: 'miles', photo_url: null }] })],
        error: null,
      })

      const res = await service.getPostComments(POST_ID)

      expect(res[0].user.photoUrl).toBeNull()
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAnonOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })

      await expect(service.getPostComments(POST_ID)).rejects.toThrow(
        'Error fetching comments: DB error',
      )
    })

    it('lève une erreur si user[0] est absent — intégrité des données', async () => {
      mockAnonOrder.mockResolvedValue({
        data: [makeCommentDbResult({ user: [] })],
        error: null,
      })

      await expect(service.getPostComments(POST_ID)).rejects.toThrow(
        'User missing in comment c1 join — data integrity issue',
      )
    })
  })

  // -----------------------------------------------------------------------
  // addComment — validations
  // -----------------------------------------------------------------------

  describe('addComment — validations', () => {
    it('lève BadRequestException si content est vide', async () => {
      await expect(service.addComment(TOKEN, POST_ID, USER_ID, '')).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('lève BadRequestException si content est uniquement des espaces', async () => {
      await expect(service.addComment(TOKEN, POST_ID, USER_ID, '   ')).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('lève BadRequestException si content dépasse 500 caractères', async () => {
      const longContent = 'a'.repeat(501)
      await expect(service.addComment(TOKEN, POST_ID, USER_ID, longContent)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('accepte un content de exactement 500 caractères', async () => {
      const content = 'a'.repeat(500)
      mockAuthFrom.mockImplementationOnce(() => authInsertChain)
      mockAuthFrom.mockImplementationOnce(() => authSelectChain)
      mockAuthSingle
        .mockResolvedValueOnce({ data: makeCommentDbResult({ content }), error: null })
        .mockResolvedValueOnce({ data: { user_id: 'other-user' }, error: null })

      await expect(service.addComment(TOKEN, POST_ID, USER_ID, content)).resolves.not.toThrow()
    })
  })

  // -----------------------------------------------------------------------
  // addComment — comportement nominal
  // -----------------------------------------------------------------------

  describe('addComment — comportement nominal', () => {
    beforeEach(() => {
      // Premier appel from : insert commentaire
      mockAuthFrom.mockImplementationOnce(() => authInsertChain)
      // Deuxième appel from (createCommentNotification) : select post
      mockAuthFrom.mockImplementationOnce(() => authSelectChain)

      mockAuthSingle
        .mockResolvedValueOnce({ data: makeCommentDbResult(), error: null }) // insert
        .mockResolvedValueOnce({ data: { user_id: 'other-user' }, error: null }) // post lookup
    })

    it('utilise getClientWithAuth avec le bon token', async () => {
      await service.addComment(TOKEN, POST_ID, USER_ID, 'Commentaire test')

      expect(mockSupabaseService.getClientWithAuth).toHaveBeenCalledWith(TOKEN)
    })

    it('insère avec le bon post_id, user_id et content trimmé', async () => {
      await service.addComment(TOKEN, POST_ID, USER_ID, '  Commentaire test  ')

      expect(authInsertChain.insert).toHaveBeenCalledWith({
        post_id: POST_ID,
        user_id: USER_ID,
        content: 'Commentaire test',
      })
    })

    it('retourne le commentaire mappé', async () => {
      const res = await service.addComment(TOKEN, POST_ID, USER_ID, 'Commentaire test')

      expect(res.id).toBe('c1')
      expect(res.postId).toBe('p1')
      expect(res.content).toBe('Super post !')
      expect(res.user.username).toBe('miles')
    })

    it("crée une notification si l'auteur du post est différent", async () => {
      await service.addComment(TOKEN, POST_ID, USER_ID, 'Commentaire test')

      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        TOKEN,
        'other-user',
        'post_comment',
        USER_ID,
        POST_ID,
        COMMENT_ID,
      )
    })

    it("ne crée pas de notification si l'auteur du post est le même", async () => {
      mockAuthFrom.mockReset()
      mockAuthSingle.mockReset()
      mockNotificationsService.createNotification.mockReset()

      mockAuthFrom.mockImplementationOnce(() => authInsertChain)
      mockAuthFrom.mockImplementationOnce(() => authSelectChain)
      mockAuthSingle
        .mockResolvedValueOnce({ data: makeCommentDbResult(), error: null })
        .mockResolvedValueOnce({ data: { user_id: USER_ID }, error: null }) // même user

      await service.addComment(TOKEN, POST_ID, USER_ID, 'Commentaire test')

      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // addComment — erreurs
  // -----------------------------------------------------------------------

  describe('addComment — erreurs', () => {
    it("lève une erreur si l'insert Supabase échoue", async () => {
      mockAuthFrom.mockReturnValue(authInsertChain)
      mockAuthSingle.mockResolvedValue({ data: null, error: { message: 'insert error' } })

      await expect(service.addComment(TOKEN, POST_ID, USER_ID, 'Test')).rejects.toThrow(
        'Error adding comment: insert error',
      )
    })

    it("ne lève pas d'exception si createCommentNotification échoue", async () => {
      mockAuthFrom.mockImplementationOnce(() => authInsertChain)
      mockAuthFrom.mockImplementationOnce(() => authSelectChain)
      mockAuthSingle
        .mockResolvedValueOnce({ data: makeCommentDbResult(), error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'post not found' } })

      await expect(service.addComment(TOKEN, POST_ID, USER_ID, 'Test')).resolves.not.toThrow()
      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // deleteComment
  // -----------------------------------------------------------------------

  describe('deleteComment', () => {
    it("lève NotFoundException si le commentaire n'existe pas", async () => {
      mockAuthFrom.mockReturnValue(authSelectChain)
      mockAuthSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

      await expect(service.deleteComment(TOKEN, COMMENT_ID, USER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })

    it('lève NotFoundException si data est null sans erreur', async () => {
      mockAuthFrom.mockReturnValue(authSelectChain)
      mockAuthSingle.mockResolvedValue({ data: null, error: null })

      await expect(service.deleteComment(TOKEN, COMMENT_ID, USER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })

    it("lève BadRequestException si l'utilisateur n'est pas l'auteur", async () => {
      mockAuthFrom.mockReturnValue(authSelectChain)
      mockAuthSingle.mockResolvedValue({
        data: { user_id: 'other-user', post_id: POST_ID },
        error: null,
      })

      await expect(service.deleteComment(TOKEN, COMMENT_ID, USER_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('supprime la notification avant le commentaire', async () => {
      mockAuthFrom
        .mockImplementationOnce(() => authSelectChain) // select comment
        .mockImplementationOnce(() => authDeleteChain) // delete comment
      mockAuthSingle.mockResolvedValue({
        data: { user_id: USER_ID, post_id: POST_ID },
        error: null,
      })
      mockAuthDeleteEq.mockResolvedValue({ error: null })

      await service.deleteComment(TOKEN, COMMENT_ID, USER_ID)

      const deleteByCommentOrder =
        mockNotificationsService.deleteByComment.mock.invocationCallOrder[0]
      const deleteCommentOrder = mockAuthDeleteEq.mock.invocationCallOrder[0]
      expect(deleteByCommentOrder).toBeLessThan(deleteCommentOrder)
    })

    it('appelle deleteByComment avec le bon commentId', async () => {
      mockAuthFrom
        .mockImplementationOnce(() => authSelectChain)
        .mockImplementationOnce(() => authDeleteChain)
      mockAuthSingle.mockResolvedValue({
        data: { user_id: USER_ID, post_id: POST_ID },
        error: null,
      })
      mockAuthDeleteEq.mockResolvedValue({ error: null })

      await service.deleteComment(TOKEN, COMMENT_ID, USER_ID)

      expect(mockNotificationsService.deleteByComment).toHaveBeenCalledWith(TOKEN, COMMENT_ID)
    })

    it('supprime le bon commentaire', async () => {
      mockAuthFrom
        .mockImplementationOnce(() => authSelectChain)
        .mockImplementationOnce(() => authDeleteChain)
      mockAuthSingle.mockResolvedValue({
        data: { user_id: USER_ID, post_id: POST_ID },
        error: null,
      })
      mockAuthDeleteEq.mockResolvedValue({ error: null })

      await service.deleteComment(TOKEN, COMMENT_ID, USER_ID)

      expect(authDeleteChain.delete).toHaveBeenCalled()
      expect(mockAuthDeleteEq).toHaveBeenCalledWith('id', COMMENT_ID)
    })

    it('lève une erreur si la suppression Supabase échoue', async () => {
      mockAuthFrom
        .mockImplementationOnce(() => authSelectChain)
        .mockImplementationOnce(() => authDeleteChain)
      mockAuthSingle.mockResolvedValue({
        data: { user_id: USER_ID, post_id: POST_ID },
        error: null,
      })
      mockAuthDeleteEq.mockResolvedValue({ error: { message: 'delete error' } })

      await expect(service.deleteComment(TOKEN, COMMENT_ID, USER_ID)).rejects.toThrow(
        'Error deleting comment: delete error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // getCommentsCount
  // -----------------------------------------------------------------------

  describe('getCommentsCount', () => {
    it('interroge comments avec le bon post_id', async () => {
      mockAnonEq.mockResolvedValue({ count: 3, error: null })

      await service.getCommentsCount(POST_ID)

      expect(mockAnonFrom).toHaveBeenCalledWith('comments')
      expect(mockAnonEq).toHaveBeenCalledWith('post_id', POST_ID)
    })

    it('retourne le bon count', async () => {
      mockAnonEq.mockResolvedValue({ count: 7, error: null })

      const res = await service.getCommentsCount(POST_ID)

      expect(res).toBe(7)
    })

    it('retourne 0 si count est null', async () => {
      mockAnonEq.mockResolvedValue({ count: null, error: null })

      const res = await service.getCommentsCount(POST_ID)

      expect(res).toBe(0)
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAnonEq.mockResolvedValue({ count: null, error: { message: 'count error' } })

      await expect(service.getCommentsCount(POST_ID)).rejects.toThrow(
        'Error counting comments: count error',
      )
    })
  })
})
