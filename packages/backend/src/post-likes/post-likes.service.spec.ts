import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { PostLikesService } from './post-likes.service'
import { SupabaseService } from '../common/database/supabase.service'
import { NotificationsService } from '../notifications/notifications.service'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockAnonFrom = jest.fn()
const mockAuthFrom = jest.fn()

const mockSupabaseService = {
  getClient: jest.fn(() => ({ from: mockAnonFrom })),
  getClientWithAuth: jest.fn(() => ({ from: mockAuthFrom })),
}

const mockNotificationsService = {
  createNotification: jest.fn().mockResolvedValue(undefined),
  deleteByLike: jest.fn().mockResolvedValue(undefined),
}

// -------------------------------------------------------------------------
// Chain factories
// -------------------------------------------------------------------------

const makeInsertChain = (result: object) => ({
  insert: jest.fn().mockResolvedValue(result),
})

const makeDeleteChain = (result: object) => {
  const secondEq = jest.fn().mockResolvedValue(result)
  const chain = {
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue({ eq: secondEq }),
    secondEq,
  }
  return chain
}

const makeSingleChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
})

const makeCountChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue(result),
})

// -------------------------------------------------------------------------
// Constantes
// -------------------------------------------------------------------------

const TOKEN = 'auth-token'
const USER_ID = 'u1'
const POST_ID = 'p1'
const OTHER_USER_ID = 'u2'

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('PostLikesService', () => {
  let service: PostLikesService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostLikesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile()

    service = module.get<PostLikesService>(PostLikesService)
  })

  // -----------------------------------------------------------------------
  // likePost — comportement nominal
  // -----------------------------------------------------------------------

  describe('likePost — comportement nominal', () => {
    it('utilise getClientWithAuth avec le bon token', async () => {
      mockAuthFrom
        .mockReturnValueOnce(makeInsertChain({ error: null })) // insert like
        .mockReturnValueOnce(makeSingleChain({ data: { user_id: OTHER_USER_ID }, error: null })) // post lookup

      await service.likePost(TOKEN, USER_ID, POST_ID)

      expect(mockSupabaseService.getClientWithAuth).toHaveBeenCalledWith(TOKEN)
    })

    it('insère le like avec les bons user_id et post_id', async () => {
      const insertChain = makeInsertChain({ error: null })
      mockAuthFrom
        .mockReturnValueOnce(insertChain)
        .mockReturnValueOnce(makeSingleChain({ data: { user_id: OTHER_USER_ID }, error: null }))

      await service.likePost(TOKEN, USER_ID, POST_ID)

      expect(mockAuthFrom).toHaveBeenCalledWith('post_likes')
      expect(insertChain.insert).toHaveBeenCalledWith({ user_id: USER_ID, post_id: POST_ID })
    })

    it("crée une notification si l'auteur du post est différent", async () => {
      mockAuthFrom
        .mockReturnValueOnce(makeInsertChain({ error: null }))
        .mockReturnValueOnce(makeSingleChain({ data: { user_id: OTHER_USER_ID }, error: null }))

      await service.likePost(TOKEN, USER_ID, POST_ID)

      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        TOKEN,
        OTHER_USER_ID,
        'post_like',
        USER_ID,
        POST_ID,
      )
    })

    it("ne crée pas de notification si l'auteur du post est le même", async () => {
      mockAuthFrom
        .mockReturnValueOnce(makeInsertChain({ error: null }))
        .mockReturnValueOnce(makeSingleChain({ data: { user_id: USER_ID }, error: null })) // même user

      await service.likePost(TOKEN, USER_ID, POST_ID)

      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled()
    })

    it("ne lève pas d'exception si la notification échoue", async () => {
      mockAuthFrom
        .mockReturnValueOnce(makeInsertChain({ error: null }))
        .mockReturnValueOnce(makeSingleChain({ data: { user_id: OTHER_USER_ID }, error: null }))
      mockNotificationsService.createNotification.mockRejectedValueOnce(new Error('notif error'))

      await expect(service.likePost(TOKEN, USER_ID, POST_ID)).resolves.not.toThrow()
    })

    it("ne lève pas d'exception si le post n'est pas trouvé pour la notification", async () => {
      mockAuthFrom
        .mockReturnValueOnce(makeInsertChain({ error: null }))
        .mockReturnValueOnce(makeSingleChain({ data: null, error: { message: 'not found' } }))

      await expect(service.likePost(TOKEN, USER_ID, POST_ID)).resolves.not.toThrow()
      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // likePost — erreurs
  // -----------------------------------------------------------------------

  describe('likePost — erreurs', () => {
    it('lève BadRequestException si déjà liké (code 23505)', async () => {
      mockAuthFrom.mockReturnValueOnce(
        makeInsertChain({ error: { code: '23505', message: 'duplicate' } }),
      )

      await expect(service.likePost(TOKEN, USER_ID, POST_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('lève une erreur générique pour les autres erreurs Supabase', async () => {
      mockAuthFrom.mockReturnValueOnce(
        makeInsertChain({ error: { code: '500', message: 'insert error' } }),
      )

      await expect(service.likePost(TOKEN, USER_ID, POST_ID)).rejects.toThrow(
        'Error liking post: insert error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // unlikePost
  // -----------------------------------------------------------------------

  describe('unlikePost', () => {
    it('supprime la notification avant de supprimer le like', async () => {
      const deleteChain = makeDeleteChain({ error: null })
      mockAuthFrom.mockReturnValue(deleteChain)

      await service.unlikePost(TOKEN, USER_ID, POST_ID)

      const deleteByLikeOrder = mockNotificationsService.deleteByLike.mock.invocationCallOrder[0]
      const deleteOrder = deleteChain.delete.mock.invocationCallOrder[0]
      expect(deleteByLikeOrder).toBeLessThan(deleteOrder)
    })

    it('appelle deleteByLike avec les bons paramètres', async () => {
      mockAuthFrom.mockReturnValue(makeDeleteChain({ error: null }))

      await service.unlikePost(TOKEN, USER_ID, POST_ID)

      expect(mockNotificationsService.deleteByLike).toHaveBeenCalledWith(TOKEN, USER_ID, POST_ID)
    })

    it('filtre par user_id et post_id corrects', async () => {
      const deleteChain = makeDeleteChain({ error: null })
      mockAuthFrom.mockReturnValue(deleteChain)

      await service.unlikePost(TOKEN, USER_ID, POST_ID)

      expect(deleteChain.eq).toHaveBeenCalledWith('user_id', USER_ID)
      expect(deleteChain.secondEq).toHaveBeenCalledWith('post_id', POST_ID)
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAuthFrom.mockReturnValue(makeDeleteChain({ error: { message: 'delete error' } }))

      await expect(service.unlikePost(TOKEN, USER_ID, POST_ID)).rejects.toThrow(
        'Error unliking post: delete error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // hasLikedPost
  // -----------------------------------------------------------------------

  describe('hasLikedPost', () => {
    it('retourne true si le like existe', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: { id: 'l1' }, error: null }))

      const res = await service.hasLikedPost(USER_ID, POST_ID)

      expect(res).toBe(true)
    })

    it('retourne false si aucun like (PGRST116)', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: { code: 'PGRST116' } }))

      const res = await service.hasLikedPost(USER_ID, POST_ID)

      expect(res).toBe(false)
    })

    it('retourne false si data est null sans erreur', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: null }))

      const res = await service.hasLikedPost(USER_ID, POST_ID)

      expect(res).toBe(false)
    })

    it('filtre par user_id et post_id corrects', async () => {
      const singleChain = makeSingleChain({ data: { id: 'l1' }, error: null })
      mockAnonFrom.mockReturnValue(singleChain)

      await service.hasLikedPost(USER_ID, POST_ID)

      expect(mockAnonFrom).toHaveBeenCalledWith('post_likes')
      expect(singleChain.eq).toHaveBeenCalledWith('user_id', USER_ID)
      expect(singleChain.eq).toHaveBeenCalledWith('post_id', POST_ID)
    })

    it('lève une erreur pour les erreurs non-PGRST116', async () => {
      mockAnonFrom.mockReturnValue(
        makeSingleChain({ data: null, error: { code: '500', message: 'DB error' } }),
      )

      await expect(service.hasLikedPost(USER_ID, POST_ID)).rejects.toThrow(
        'Error checking like: DB error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // getLikesCount
  // -----------------------------------------------------------------------

  describe('getLikesCount', () => {
    it('retourne le bon count', async () => {
      mockAnonFrom.mockReturnValue(makeCountChain({ count: 12, error: null }))

      const res = await service.getLikesCount(POST_ID)

      expect(res).toBe(12)
    })

    it('retourne 0 si count est null', async () => {
      mockAnonFrom.mockReturnValue(makeCountChain({ count: null, error: null }))

      const res = await service.getLikesCount(POST_ID)

      expect(res).toBe(0)
    })

    it('filtre par post_id correct', async () => {
      const countChain = makeCountChain({ count: 0, error: null })
      mockAnonFrom.mockReturnValue(countChain)

      await service.getLikesCount(POST_ID)

      expect(mockAnonFrom).toHaveBeenCalledWith('post_likes')
      expect(countChain.eq).toHaveBeenCalledWith('post_id', POST_ID)
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAnonFrom.mockReturnValue(
        makeCountChain({ count: null, error: { message: 'count error' } }),
      )

      await expect(service.getLikesCount(POST_ID)).rejects.toThrow(
        'Error counting likes: count error',
      )
    })
  })
})
