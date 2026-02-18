import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsService } from './notifications.service'
import { SupabaseService } from '../common/database/supabase.service'
import { EventsService } from '../events/events.service'
import type { NotificationQueryResult, NotificationCreateQueryResult } from './notifications.types'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockAuthFrom = jest.fn()
const mockSupabaseService = {
  getClientWithAuth: jest.fn(() => ({ from: mockAuthFrom })),
}

const mockEventsService = {
  emitToUser: jest.fn(),
}

// -------------------------------------------------------------------------
// Chain factories
// -------------------------------------------------------------------------

/**
 * Crée une chaîne de lecture pour getNotifications.
 * limit() retourne un objet thenable + possède .lt() pour la pagination.
 */
const makeLimitChain = (result: object) => {
  const limitResult = {
    lt: jest.fn().mockResolvedValue(result),
    then: (resolve: (v: object) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(result).then(resolve, reject),
    catch: (reject: (e: unknown) => void) => Promise.resolve(result).catch(reject),
  }
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnValue(limitResult),
    limitResult,
  }
}

/** Chaîne pour createNotification (insert → select → single) */
const makeInsertSelectChain = (result: object) => ({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
})

/** Chaîne pour le select initial dans deleteBy* */
const makeSelectSingleChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
})

/** Chaîne pour le delete avec 3 .eq() — deleteByLike, deleteByFollow */
const makeDeleteEqChain = (result: object) => {
  const lastEq = jest.fn().mockResolvedValue(result)
  return {
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: lastEq }) }),
    lastEq,
  }
}

/** Chaîne pour le delete avec 2 .eq() — deleteByComment */
const makeDeleteDoubleEqChain = (result: object) => {
  const lastEq = jest.fn().mockResolvedValue(result)
  return {
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue({ eq: lastEq }),
    lastEq,
  }
}

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

/**
 * La DB renvoie user_id et actor_id à plat sur la ligne, mais NotificationQueryResult
 * ne les expose pas dans le type partagé (ils sont implicites via les jointures).
 * Le cast `as unknown as NotificationQueryResult` évite le contrôle d'excès de
 * propriétés TypeScript tout en gardant les données de test correctes.
 */
const makeNotifDbResult = (overrides: object = {}): NotificationQueryResult =>
  ({
    id: 'n1',
    type: 'post_like',
    read: false,
    created_at: '2024-01-01T10:00:00Z',
    user_id: 'u1',
    actor_id: 'u2',
    actor: {
      uid: 'u2',
      username: 'bill',
      first_name: 'Bill',
      last_name: 'Evans',
      photo_url: 'bill.png',
    },
    post: null,
    comment: null,
    ...overrides,
  }) as unknown as NotificationQueryResult

const makeNotifWithPost = (): NotificationQueryResult =>
  makeNotifDbResult({
    post: {
      id: 'p1',
      vinyl_id: 'v1',
      vinyl: {
        id: 'v1',
        title: 'Kind of Blue',
        cover_url: 'cover.png',
        vinyl_artists: [{ position: 1, artist: { name: 'Miles Davis' } }],
      },
    },
  })

const makeNotifWithComment = (): NotificationQueryResult =>
  makeNotifDbResult({
    type: 'post_comment',
    comment: { id: 'c1', content: 'Super post !' },
  })

const makeCreateNotifDbResult = (
  overrides: Partial<NotificationCreateQueryResult> = {},
): NotificationCreateQueryResult => ({
  id: 'n1',
  type: 'post_like',
  read: false,
  created_at: '2024-01-01T10:00:00Z',
  actor: [{ uid: 'u2', username: 'bill', first_name: null, last_name: null, photo_url: null }],
  post: [],
  comment: [],
  ...overrides,
})

const TOKEN = 'auth-token'
const USER_ID = 'u1'
const ACTOR_ID = 'u2'
const POST_ID = 'p1'
const COMMENT_ID = 'c1'

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('NotificationsService', () => {
  let service: NotificationsService

  beforeEach(async () => {
    jest.clearAllMocks()
    mockAuthFrom.mockReset()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile()

    service = module.get<NotificationsService>(NotificationsService)
  })

  // -----------------------------------------------------------------------
  // getNotifications
  // -----------------------------------------------------------------------

  describe('getNotifications', () => {
    it('utilise getClientWithAuth avec le bon token', async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.getNotifications(TOKEN, USER_ID)

      expect(mockSupabaseService.getClientWithAuth).toHaveBeenCalledWith(TOKEN)
    })

    it('filtre par user_id correct', async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.getNotifications(TOKEN, USER_ID)

      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
    })

    it('applique la limite par défaut (20)', async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.getNotifications(TOKEN, USER_ID)

      expect(chain.limit).toHaveBeenCalledWith(20)
    })

    it('applique une limite personnalisée', async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.getNotifications(TOKEN, USER_ID, 5)

      expect(chain.limit).toHaveBeenCalledWith(5)
    })

    it("n'applique pas .lt() si lastCreatedAt est absent", async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.getNotifications(TOKEN, USER_ID)

      expect(chain.limitResult.lt).not.toHaveBeenCalled()
    })

    it('applique .lt() si lastCreatedAt est fourni', async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.getNotifications(TOKEN, USER_ID, 20, '2024-01-01T00:00:00Z')

      expect(chain.limitResult.lt).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00Z')
    })

    it('retourne un tableau vide si aucune notification', async () => {
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res).toHaveLength(0)
    })

    it("mappe les champs de base d'une notification", async () => {
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [makeNotifDbResult()], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res[0].id).toBe('n1')
      expect(res[0].type).toBe('post_like')
      expect(res[0].read).toBe(false)
      expect(res[0].createdAt).toBe('2024-01-01T10:00:00Z')
    })

    it("mappe les champs de l'acteur", async () => {
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [makeNotifDbResult()], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res[0].actor).toEqual({
        uid: 'u2',
        username: 'bill',
        firstName: 'Bill',
        lastName: 'Evans',
        photoUrl: 'bill.png',
      })
    })

    it('mappe les champs du post et du vinyl', async () => {
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [makeNotifWithPost()], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res[0].post?.id).toBe('p1')
      expect(res[0].post?.vinylId).toBe('v1')
      expect(res[0].post?.vinyl.title).toBe('Kind of Blue')
      expect(res[0].post?.vinyl.coverUrl).toBe('cover.png')
      expect(res[0].post?.vinyl.artist).toBe('Miles Davis')
    })

    it("trie les vinyl_artists par position pour construire l'artiste", async () => {
      const notif = makeNotifDbResult({
        post: [
          {
            id: 'p1',
            vinyl_id: 'v1',
            vinyl: [
              {
                id: 'v1',
                title: 'Album',
                cover_url: null,
                vinyl_artists: [
                  { position: 2, artist: [{ name: 'Bill Evans' }] },
                  { position: 1, artist: [{ name: 'Miles Davis' }] },
                ],
                album: [{ id: 'alb1', title: 'Album', album_artists: [] }],
              },
            ],
          },
        ],
      })
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [notif], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res[0].post?.vinyl.artist).toBe('Miles Davis, Bill Evans')
    })

    it('utilise les album_artists en fallback si vinyl_artists est vide', async () => {
      const notif = makeNotifDbResult({
        post: [
          {
            id: 'p1',
            vinyl_id: 'v1',
            vinyl: [
              {
                id: 'v1',
                title: 'Album',
                cover_url: null,
                vinyl_artists: [],
                album: [
                  {
                    id: 'alb1',
                    title: 'Album',
                    album_artists: [{ position: 1, artist: [{ name: 'Miles Davis' }] }],
                  },
                ],
              },
            ],
          },
        ],
      })
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [notif], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res[0].post?.vinyl.artist).toBe('Miles Davis')
    })

    it('retourne "Artiste inconnu" si vinyl_artists et album_artists sont vides', async () => {
      const notif = makeNotifDbResult({
        post: [
          {
            id: 'p1',
            vinyl_id: 'v1',
            vinyl: [
              {
                id: 'v1',
                title: 'Album',
                cover_url: null,
                vinyl_artists: [],
                album: [{ id: 'alb1', title: 'Album', album_artists: [] }],
              },
            ],
          },
        ],
      })
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [notif], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res[0].post?.vinyl.artist).toBe('Artiste inconnu')
    })

    it('mappe les champs du comment', async () => {
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [makeNotifWithComment()], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res[0].comment).toEqual({ id: 'c1', content: 'Super post !' })
    })

    it('ne mappe pas post si post est vide', async () => {
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [makeNotifDbResult()], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res[0].post).toBeUndefined()
    })

    it('ne mappe pas comment si comment est vide', async () => {
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: [makeNotifDbResult()], error: null }))

      const res = await service.getNotifications(TOKEN, USER_ID)

      expect(res[0].comment).toBeUndefined()
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAuthFrom.mockReturnValue(makeLimitChain({ data: null, error: { message: 'DB error' } }))

      await expect(service.getNotifications(TOKEN, USER_ID)).rejects.toThrow(
        'Error fetching notifications: DB error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // getUnreadCount
  // -----------------------------------------------------------------------

  describe('getUnreadCount', () => {
    const makeUnreadChain = (result: object) => {
      const secondEq = jest.fn().mockResolvedValue(result)
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({ eq: secondEq }),
        secondEq,
      }
      return chain
    }

    it('retourne le bon count', async () => {
      const chain = makeUnreadChain({ count: 4, error: null })
      mockAuthFrom.mockReturnValue(chain)

      const res = await service.getUnreadCount(TOKEN, USER_ID)

      expect(res).toBe(4)
    })

    it('retourne 0 si count est null', async () => {
      const chain = makeUnreadChain({ count: null, error: null })
      mockAuthFrom.mockReturnValue(chain)

      const res = await service.getUnreadCount(TOKEN, USER_ID)

      expect(res).toBe(0)
    })

    it('filtre par user_id et read=false', async () => {
      const chain = makeUnreadChain({ count: 0, error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.getUnreadCount(TOKEN, USER_ID)

      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
      expect(chain.secondEq).toHaveBeenCalledWith('read', false)
    })

    it('lève une erreur si Supabase échoue', async () => {
      const chain = makeUnreadChain({ count: null, error: { message: 'count error' } })
      mockAuthFrom.mockReturnValue(chain)

      await expect(service.getUnreadCount(TOKEN, USER_ID)).rejects.toThrow(
        'Error counting unread notifications: count error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // markAllAsRead
  // -----------------------------------------------------------------------

  describe('markAllAsRead', () => {
    const makeMarkChain = (result: object) => {
      const secondEq = jest.fn().mockResolvedValue(result)
      const chain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({ eq: secondEq }),
        secondEq,
      }
      return chain
    }

    it('met à jour read=true pour user_id et read=false', async () => {
      const chain = makeMarkChain({ error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.markAllAsRead(TOKEN, USER_ID)

      expect(chain.update).toHaveBeenCalledWith({ read: true })
      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
      expect(chain.secondEq).toHaveBeenCalledWith('read', false)
    })

    it("émet l'événement notification:read-all", async () => {
      mockAuthFrom.mockReturnValue(makeMarkChain({ error: null }))

      await service.markAllAsRead(TOKEN, USER_ID)

      expect(mockEventsService.emitToUser).toHaveBeenCalledWith(USER_ID, 'notification:read-all', {
        userId: USER_ID,
      })
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAuthFrom.mockReturnValue(makeMarkChain({ error: { message: 'update error' } }))

      await expect(service.markAllAsRead(TOKEN, USER_ID)).rejects.toThrow(
        'Error marking notifications as read: update error',
      )
    })

    it("ne doit pas émettre d'événement si Supabase échoue", async () => {
      mockAuthFrom.mockReturnValue(makeMarkChain({ error: { message: 'update error' } }))

      await service.markAllAsRead(TOKEN, USER_ID).catch(() => {})

      expect(mockEventsService.emitToUser).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // createNotification
  // -----------------------------------------------------------------------

  describe('createNotification', () => {
    it('insère avec les bons paramètres (sans postId ni commentId)', async () => {
      const chain = makeInsertSelectChain({ data: makeCreateNotifDbResult(), error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.createNotification(TOKEN, USER_ID, 'new_follower', ACTOR_ID)

      expect(chain.insert).toHaveBeenCalledWith({
        user_id: USER_ID,
        type: 'new_follower',
        actor_id: ACTOR_ID,
        post_id: null,
        comment_id: null,
      })
    })

    it('insère avec postId et commentId', async () => {
      const chain = makeInsertSelectChain({ data: makeCreateNotifDbResult(), error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.createNotification(
        TOKEN,
        USER_ID,
        'post_comment',
        ACTOR_ID,
        POST_ID,
        COMMENT_ID,
      )

      expect(chain.insert).toHaveBeenCalledWith({
        user_id: USER_ID,
        type: 'post_comment',
        actor_id: ACTOR_ID,
        post_id: POST_ID,
        comment_id: COMMENT_ID,
      })
    })

    it('émet notification:new si la notification est créée', async () => {
      mockAuthFrom.mockReturnValue(
        makeInsertSelectChain({ data: makeCreateNotifDbResult(), error: null }),
      )

      await service.createNotification(TOKEN, USER_ID, 'post_like', ACTOR_ID, POST_ID)

      expect(mockEventsService.emitToUser).toHaveBeenCalledWith(
        USER_ID,
        'notification:new',
        expect.objectContaining({ id: 'n1', type: 'post_like' }),
      )
    })

    it("ne lève pas d'exception si erreur 23505 (doublon)", async () => {
      mockAuthFrom.mockReturnValue(
        makeInsertSelectChain({ data: null, error: { code: '23505', message: 'duplicate' } }),
      )

      await expect(
        service.createNotification(TOKEN, USER_ID, 'post_like', ACTOR_ID),
      ).resolves.not.toThrow()
    })

    it("ne doit pas émettre d'événement si data est null", async () => {
      mockAuthFrom.mockReturnValue(
        makeInsertSelectChain({ data: null, error: { code: '23505', message: 'duplicate' } }),
      )

      await service.createNotification(TOKEN, USER_ID, 'post_like', ACTOR_ID)

      expect(mockEventsService.emitToUser).not.toHaveBeenCalled()
    })

    it('lève une erreur pour les erreurs non-23505', async () => {
      mockAuthFrom.mockReturnValue(
        makeInsertSelectChain({ data: null, error: { code: '500', message: 'insert error' } }),
      )

      await expect(
        service.createNotification(TOKEN, USER_ID, 'post_like', ACTOR_ID),
      ).rejects.toThrow('Error creating notification: insert error')
    })
  })

  // -----------------------------------------------------------------------
  // deleteByLike
  // -----------------------------------------------------------------------

  describe('deleteByLike', () => {
    const setupDeleteByLike = (notifData: object | null, deleteResult: object) => {
      mockAuthFrom
        .mockReturnValueOnce(makeSelectSingleChain({ data: notifData, error: null }))
        .mockReturnValueOnce(makeDeleteEqChain(deleteResult))
    }

    it('émet notification:deleted si la notification est non lue', async () => {
      setupDeleteByLike({ user_id: USER_ID, read: false }, { error: null })

      await service.deleteByLike(TOKEN, ACTOR_ID, POST_ID)

      expect(mockEventsService.emitToUser).toHaveBeenCalledWith(USER_ID, 'notification:deleted', {
        type: 'post_like',
        actorId: ACTOR_ID,
        postId: POST_ID,
      })
    })

    it("n'émet pas notification:deleted si la notification est déjà lue", async () => {
      setupDeleteByLike({ user_id: USER_ID, read: true }, { error: null })

      await service.deleteByLike(TOKEN, ACTOR_ID, POST_ID)

      expect(mockEventsService.emitToUser).not.toHaveBeenCalled()
    })

    it("n'émet pas notification:deleted si la notification n'existe pas", async () => {
      setupDeleteByLike(null, { error: null })

      await service.deleteByLike(TOKEN, ACTOR_ID, POST_ID)

      expect(mockEventsService.emitToUser).not.toHaveBeenCalled()
    })

    it('lève une erreur si la suppression échoue', async () => {
      setupDeleteByLike(null, { error: { message: 'delete error' } })

      await expect(service.deleteByLike(TOKEN, ACTOR_ID, POST_ID)).rejects.toThrow(
        'Error deleting like notification: delete error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // deleteByComment
  // -----------------------------------------------------------------------

  describe('deleteByComment', () => {
    const setupDeleteByComment = (notifData: object | null, deleteResult: object) => {
      mockAuthFrom
        .mockReturnValueOnce(makeSelectSingleChain({ data: notifData, error: null }))
        .mockReturnValueOnce(makeDeleteDoubleEqChain(deleteResult))
    }

    it('émet notification:deleted si la notification est non lue', async () => {
      setupDeleteByComment({ user_id: USER_ID, read: false }, { error: null })

      await service.deleteByComment(TOKEN, COMMENT_ID)

      expect(mockEventsService.emitToUser).toHaveBeenCalledWith(USER_ID, 'notification:deleted', {
        type: 'post_comment',
        commentId: COMMENT_ID,
      })
    })

    it("n'émet pas notification:deleted si la notification est déjà lue", async () => {
      setupDeleteByComment({ user_id: USER_ID, read: true }, { error: null })

      await service.deleteByComment(TOKEN, COMMENT_ID)

      expect(mockEventsService.emitToUser).not.toHaveBeenCalled()
    })

    it("n'émet pas notification:deleted si la notification n'existe pas", async () => {
      setupDeleteByComment(null, { error: null })

      await service.deleteByComment(TOKEN, COMMENT_ID)

      expect(mockEventsService.emitToUser).not.toHaveBeenCalled()
    })

    it('lève une erreur si la suppression échoue', async () => {
      setupDeleteByComment(null, { error: { message: 'delete error' } })

      await expect(service.deleteByComment(TOKEN, COMMENT_ID)).rejects.toThrow(
        'Error deleting comment notification: delete error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // deleteByFollow
  // -----------------------------------------------------------------------

  describe('deleteByFollow', () => {
    const FOLLOWER_ID = 'u1'
    const FOLLOWED_ID = 'u2'

    const setupDeleteByFollow = (notifData: object | null, deleteResult: object) => {
      mockAuthFrom
        .mockReturnValueOnce(makeSelectSingleChain({ data: notifData, error: null }))
        .mockReturnValueOnce(makeDeleteEqChain(deleteResult))
    }

    it('émet notification:deleted si la notification est non lue', async () => {
      setupDeleteByFollow({ user_id: FOLLOWED_ID, read: false }, { error: null })

      await service.deleteByFollow(TOKEN, FOLLOWER_ID, FOLLOWED_ID)

      expect(mockEventsService.emitToUser).toHaveBeenCalledWith(
        FOLLOWED_ID,
        'notification:deleted',
        { type: 'new_follower', followerId: FOLLOWER_ID, followedId: FOLLOWED_ID },
      )
    })

    it("n'émet pas notification:deleted si la notification est déjà lue", async () => {
      setupDeleteByFollow({ user_id: FOLLOWED_ID, read: true }, { error: null })

      await service.deleteByFollow(TOKEN, FOLLOWER_ID, FOLLOWED_ID)

      expect(mockEventsService.emitToUser).not.toHaveBeenCalled()
    })

    it("n'émet pas notification:deleted si la notification n'existe pas", async () => {
      setupDeleteByFollow(null, { error: null })

      await service.deleteByFollow(TOKEN, FOLLOWER_ID, FOLLOWED_ID)

      expect(mockEventsService.emitToUser).not.toHaveBeenCalled()
    })

    it('lève une erreur si la suppression échoue', async () => {
      setupDeleteByFollow(null, { error: { message: 'delete error' } })

      await expect(service.deleteByFollow(TOKEN, FOLLOWER_ID, FOLLOWED_ID)).rejects.toThrow(
        'Error deleting follow notification: delete error',
      )
    })
  })
})
