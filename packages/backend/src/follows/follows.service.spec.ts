import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { FollowsService } from './follows.service'
import { SupabaseService } from '../common/database/supabase.service'
import { UsersService } from '../users/users.service'
import { NotificationsService } from '../notifications/notifications.service'
import type { DbUser } from '../common/database/database.types'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockAnonFrom = jest.fn()
const mockAuthFrom = jest.fn()

const mockSupabaseService = {
  getClient: jest.fn(() => ({ from: mockAnonFrom })),
  getClientWithAuth: jest.fn(() => ({ from: mockAuthFrom })),
}

const mockUsersService = {
  getUserByUid: jest.fn().mockResolvedValue({ uid: 'u2', username: 'bill' }),
}

const mockNotificationsService = {
  createNotification: jest.fn().mockResolvedValue(undefined),
  deleteByFollow: jest.fn().mockResolvedValue(undefined),
}

// -------------------------------------------------------------------------
// Helpers — chain factories pour éviter la répétition
// -------------------------------------------------------------------------

const makeEqChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue(result),
})

const makeOrderChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue(result),
})

const makeInChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  in: jest.fn().mockResolvedValue(result),
})

const makeInsertChain = (result: object) => ({
  insert: jest.fn().mockResolvedValue(result),
})

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeDbUser = (overrides: Partial<DbUser> = {}): DbUser => ({
  uid: 'u1',
  username: 'miles',
  first_name: 'Miles',
  last_name: 'Davis',
  photo_url: 'miles.png',
  bio: 'Trumpet player',
  ...overrides,
})

const TOKEN = 'auth-token'
const FOLLOWER_ID = 'u1'
const FOLLOWING_ID = 'u2'

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('FollowsService', () => {
  let service: FollowsService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile()

    service = module.get<FollowsService>(FollowsService)
  })

  // -----------------------------------------------------------------------
  // getFollowStats
  // -----------------------------------------------------------------------

  describe('getFollowStats', () => {
    it('retourne les bons counts followers et following', async () => {
      mockAnonFrom
        .mockReturnValueOnce(makeEqChain({ count: 10, error: null })) // followers
        .mockReturnValueOnce(makeEqChain({ count: 5, error: null })) // following

      const res = await service.getFollowStats('u1')

      expect(res.followersCount).toBe(10)
      expect(res.followingCount).toBe(5)
    })

    it('retourne 0 si counts sont null', async () => {
      mockAnonFrom
        .mockReturnValueOnce(makeEqChain({ count: null, error: null }))
        .mockReturnValueOnce(makeEqChain({ count: null, error: null }))

      const res = await service.getFollowStats('u1')

      expect(res.followersCount).toBe(0)
      expect(res.followingCount).toBe(0)
    })

    it('filtre les followers avec le bon champ following_id', async () => {
      const followersChain = makeEqChain({ count: 3, error: null })
      mockAnonFrom
        .mockReturnValueOnce(followersChain)
        .mockReturnValueOnce(makeEqChain({ count: 0, error: null }))

      await service.getFollowStats('u1')

      expect(followersChain.eq).toHaveBeenCalledWith('following_id', 'u1')
    })

    it('filtre les following avec le bon champ follower_id', async () => {
      const followingChain = makeEqChain({ count: 2, error: null })
      mockAnonFrom
        .mockReturnValueOnce(makeEqChain({ count: 0, error: null }))
        .mockReturnValueOnce(followingChain)

      await service.getFollowStats('u1')

      expect(followingChain.eq).toHaveBeenCalledWith('follower_id', 'u1')
    })

    it('lève une erreur si la requête followers échoue', async () => {
      mockAnonFrom.mockReturnValueOnce(makeEqChain({ count: null, error: { message: 'DB error' } }))

      await expect(service.getFollowStats('u1')).rejects.toThrow(
        'Error counting followers: DB error',
      )
    })

    it('lève une erreur si la requête following échoue', async () => {
      mockAnonFrom
        .mockReturnValueOnce(makeEqChain({ count: 5, error: null }))
        .mockReturnValueOnce(makeEqChain({ count: null, error: { message: 'DB error' } }))

      await expect(service.getFollowStats('u1')).rejects.toThrow(
        'Error counting following: DB error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // followUser — validations
  // -----------------------------------------------------------------------

  describe('followUser — validations', () => {
    it('lève BadRequestException si follower === following', async () => {
      await expect(service.followUser(TOKEN, 'u1', 'u1')).rejects.toBeInstanceOf(
        BadRequestException,
      )
      expect(mockUsersService.getUserByUid).not.toHaveBeenCalled()
    })

    it("vérifie que l'utilisateur cible existe", async () => {
      mockAuthFrom.mockReturnValue(makeInsertChain({ error: null }))

      await service.followUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)

      expect(mockUsersService.getUserByUid).toHaveBeenCalledWith(FOLLOWING_ID)
    })

    it('lève BadRequestException si déjà en train de suivre (code 23505)', async () => {
      mockAuthFrom.mockReturnValue(
        makeInsertChain({ error: { code: '23505', message: 'duplicate' } }),
      )

      await expect(service.followUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('lève une erreur générique pour les autres erreurs Supabase', async () => {
      mockAuthFrom.mockReturnValue(makeInsertChain({ error: { code: '500', message: 'unknown' } }))

      await expect(service.followUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)).rejects.toThrow(
        'Error following user: unknown',
      )
    })
  })

  // -----------------------------------------------------------------------
  // followUser — comportement nominal
  // -----------------------------------------------------------------------

  describe('followUser — comportement nominal', () => {
    it('utilise getClientWithAuth avec le bon token', async () => {
      mockAuthFrom.mockReturnValue(makeInsertChain({ error: null }))

      await service.followUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)

      expect(mockSupabaseService.getClientWithAuth).toHaveBeenCalledWith(TOKEN)
    })

    it('insère le follow avec follower_id et following_id corrects', async () => {
      const insertChain = makeInsertChain({ error: null })
      mockAuthFrom.mockReturnValue(insertChain)

      await service.followUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)

      expect(mockAuthFrom).toHaveBeenCalledWith('follows')
      expect(insertChain.insert).toHaveBeenCalledWith({
        follower_id: FOLLOWER_ID,
        following_id: FOLLOWING_ID,
      })
    })

    it('crée une notification après le follow', async () => {
      mockAuthFrom.mockReturnValue(makeInsertChain({ error: null }))

      await service.followUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)

      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        TOKEN,
        FOLLOWING_ID,
        'new_follower',
        FOLLOWER_ID,
      )
    })

    it("ne lève pas d'exception si la notification échoue", async () => {
      mockAuthFrom.mockReturnValue(makeInsertChain({ error: null }))
      mockNotificationsService.createNotification.mockRejectedValueOnce(new Error('notif error'))

      await expect(service.followUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)).resolves.not.toThrow()
    })
  })

  // -----------------------------------------------------------------------
  // unfollowUser
  // -----------------------------------------------------------------------

  describe('unfollowUser', () => {
    const makeUnfollowChain = (result: object) => {
      const lastEq = jest.fn().mockResolvedValue(result)
      const chain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({ eq: lastEq }),
        lastEq,
      }
      return chain
    }

    it('supprime la notification avant de supprimer le follow', async () => {
      const unfollowChain = makeUnfollowChain({ error: null })
      mockAuthFrom.mockReturnValue(unfollowChain)

      await service.unfollowUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)

      const deleteByFollowOrder =
        mockNotificationsService.deleteByFollow.mock.invocationCallOrder[0]
      const deleteOrder = unfollowChain.delete.mock.invocationCallOrder[0]
      expect(deleteByFollowOrder).toBeLessThan(deleteOrder)
    })

    it('appelle deleteByFollow avec les bons paramètres', async () => {
      mockAuthFrom.mockReturnValue(makeUnfollowChain({ error: null }))

      await service.unfollowUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)

      expect(mockNotificationsService.deleteByFollow).toHaveBeenCalledWith(
        TOKEN,
        FOLLOWER_ID,
        FOLLOWING_ID,
      )
    })

    it('filtre par follower_id et following_id corrects', async () => {
      const unfollowChain = makeUnfollowChain({ error: null })
      mockAuthFrom.mockReturnValue(unfollowChain)

      await service.unfollowUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)

      expect(unfollowChain.eq).toHaveBeenCalledWith('follower_id', FOLLOWER_ID)
      expect(unfollowChain.lastEq).toHaveBeenCalledWith('following_id', FOLLOWING_ID)
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAuthFrom.mockReturnValue(makeUnfollowChain({ error: { message: 'delete error' } }))

      await expect(service.unfollowUser(TOKEN, FOLLOWER_ID, FOLLOWING_ID)).rejects.toThrow(
        'Error unfollowing user: delete error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // isFollowing
  // -----------------------------------------------------------------------

  describe('isFollowing', () => {
    const makeSingleChain = (result: object) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(result),
    })

    it('retourne true si le follow existe', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: { id: 'f1' }, error: null }))

      const res = await service.isFollowing(FOLLOWER_ID, FOLLOWING_ID)

      expect(res).toBe(true)
    })

    it('retourne false si aucun follow trouvé (PGRST116)', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: { code: 'PGRST116' } }))

      const res = await service.isFollowing(FOLLOWER_ID, FOLLOWING_ID)

      expect(res).toBe(false)
    })

    it('retourne false si data est null sans erreur', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: null }))

      const res = await service.isFollowing(FOLLOWER_ID, FOLLOWING_ID)

      expect(res).toBe(false)
    })

    it('lève une erreur pour les erreurs non-PGRST116', async () => {
      mockAnonFrom.mockReturnValue(
        makeSingleChain({ data: null, error: { code: '500', message: 'DB error' } }),
      )

      await expect(service.isFollowing(FOLLOWER_ID, FOLLOWING_ID)).rejects.toThrow(
        'Error checking follow: DB error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // getFollowers
  // -----------------------------------------------------------------------

  describe('getFollowers', () => {
    it('retourne [] si aucun follower', async () => {
      mockAnonFrom.mockReturnValueOnce(makeOrderChain({ data: [], error: null }))

      const res = await service.getFollowers('u1')

      expect(res).toEqual([])
      expect(mockAnonFrom).toHaveBeenCalledTimes(1)
    })

    it('filtre par following_id correct', async () => {
      const followsChain = makeOrderChain({ data: [], error: null })
      mockAnonFrom.mockReturnValueOnce(followsChain)

      await service.getFollowers('u1')

      expect(followsChain.eq).toHaveBeenCalledWith('following_id', 'u1')
    })

    it('mappe les followers en User', async () => {
      mockAnonFrom
        .mockReturnValueOnce(makeOrderChain({ data: [{ follower_id: 'u2' }], error: null }))
        .mockReturnValueOnce(
          makeInChain({ data: [makeDbUser({ uid: 'u2', username: 'bill' })], error: null }),
        )

      const res = await service.getFollowers('u1')

      expect(res).toHaveLength(1)
      expect(res[0].uid).toBe('u2')
      expect(res[0].username).toBe('bill')
      expect(res[0].firstName).toBe('Miles')
      expect(res[0].photoUrl).toBe('miles.png')
    })

    it('récupère les users par leurs ids avec .in()', async () => {
      const usersChain = makeInChain({ data: [makeDbUser({ uid: 'u2' })], error: null })
      mockAnonFrom
        .mockReturnValueOnce(
          makeOrderChain({ data: [{ follower_id: 'u2' }, { follower_id: 'u3' }], error: null }),
        )
        .mockReturnValueOnce(usersChain)

      await service.getFollowers('u1')

      expect(usersChain.in).toHaveBeenCalledWith('uid', ['u2', 'u3'])
    })

    it('lève une erreur si la requête follows échoue', async () => {
      mockAnonFrom.mockReturnValueOnce(
        makeOrderChain({ data: null, error: { message: 'follows error' } }),
      )

      await expect(service.getFollowers('u1')).rejects.toThrow(
        'Error fetching followers: follows error',
      )
    })

    it('lève une erreur si la requête users échoue', async () => {
      mockAnonFrom
        .mockReturnValueOnce(makeOrderChain({ data: [{ follower_id: 'u2' }], error: null }))
        .mockReturnValueOnce(makeInChain({ data: null, error: { message: 'users error' } }))

      await expect(service.getFollowers('u1')).rejects.toThrow('Error fetching users: users error')
    })
  })

  // -----------------------------------------------------------------------
  // getFollowing
  // -----------------------------------------------------------------------

  describe('getFollowing', () => {
    it('retourne [] si ne suit personne', async () => {
      mockAnonFrom.mockReturnValueOnce(makeOrderChain({ data: [], error: null }))

      const res = await service.getFollowing('u1')

      expect(res).toEqual([])
      expect(mockAnonFrom).toHaveBeenCalledTimes(1)
    })

    it('filtre par follower_id correct', async () => {
      const followsChain = makeOrderChain({ data: [], error: null })
      mockAnonFrom.mockReturnValueOnce(followsChain)

      await service.getFollowing('u1')

      expect(followsChain.eq).toHaveBeenCalledWith('follower_id', 'u1')
    })

    it('mappe les following en User', async () => {
      mockAnonFrom
        .mockReturnValueOnce(makeOrderChain({ data: [{ following_id: 'u2' }], error: null }))
        .mockReturnValueOnce(
          makeInChain({ data: [makeDbUser({ uid: 'u2', username: 'bill' })], error: null }),
        )

      const res = await service.getFollowing('u1')

      expect(res).toHaveLength(1)
      expect(res[0].uid).toBe('u2')
    })

    it('récupère les users par leurs ids avec .in()', async () => {
      const usersChain = makeInChain({ data: [makeDbUser()], error: null })
      mockAnonFrom
        .mockReturnValueOnce(
          makeOrderChain({ data: [{ following_id: 'u2' }, { following_id: 'u3' }], error: null }),
        )
        .mockReturnValueOnce(usersChain)

      await service.getFollowing('u1')

      expect(usersChain.in).toHaveBeenCalledWith('uid', ['u2', 'u3'])
    })

    it('lève une erreur si la requête follows échoue', async () => {
      mockAnonFrom.mockReturnValueOnce(
        makeOrderChain({ data: null, error: { message: 'following error' } }),
      )

      await expect(service.getFollowing('u1')).rejects.toThrow(
        'Error fetching following: following error',
      )
    })

    it('lève une erreur si la requête users échoue', async () => {
      mockAnonFrom
        .mockReturnValueOnce(makeOrderChain({ data: [{ following_id: 'u2' }], error: null }))
        .mockReturnValueOnce(makeInChain({ data: null, error: { message: 'users error' } }))

      await expect(service.getFollowing('u1')).rejects.toThrow('Error fetching users: users error')
    })
  })

  // -----------------------------------------------------------------------
  // transformUserData (via getFollowers)
  // -----------------------------------------------------------------------

  describe('transformUserData', () => {
    it('mappe snake_case en camelCase', async () => {
      mockAnonFrom
        .mockReturnValueOnce(makeOrderChain({ data: [{ follower_id: 'u2' }], error: null }))
        .mockReturnValueOnce(
          makeInChain({
            data: [
              makeDbUser({
                uid: 'u2',
                username: 'bill',
                first_name: 'Bill',
                last_name: 'Evans',
                photo_url: 'bill.png',
                bio: 'Pianist',
              }),
            ],
            error: null,
          }),
        )

      const res = await service.getFollowers('u1')

      expect(res[0]).toEqual({
        uid: 'u2',
        username: 'bill',
        firstName: 'Bill',
        lastName: 'Evans',
        photoUrl: 'bill.png',
        bio: 'Pianist',
      })
    })
  })
})
