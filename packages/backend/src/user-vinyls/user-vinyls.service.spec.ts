import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, Logger } from '@nestjs/common'
import { UserVinylsService } from './user-vinyls.service'
import { SupabaseService } from '../common/database/supabase.service'
import { VinylsService } from '../vinyls/vinyls.service'
import { PostsService } from '../posts/posts.service'
import type { UserVinylQueryResult } from './user-vinyls.types'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockAnonFrom = jest.fn()
const mockSupabaseService = {
  getClient: jest.fn(() => ({ from: mockAnonFrom })),
}

const mockVinylsService = {
  getById: jest.fn().mockResolvedValue({ id: 'v1', title: 'Kind of Blue' }),
}

const mockPostsService = {
  createPost: jest.fn().mockResolvedValue(undefined),
}

// -------------------------------------------------------------------------
// Chain factories
// -------------------------------------------------------------------------

/**
 * Chaîne pour getUserVinyls — .limit() thenable + .lt() optionnel.
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

/**
 * Chaîne pour getUserVinylsCount — double eq terminal.
 */
const makeCountChain = (result: object) => {
  const secondEq = jest.fn().mockResolvedValue(result)
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue({ eq: secondEq }),
    secondEq,
  }
  return chain
}

/**
 * Chaîne pour hasVinyl — triple eq + single (tous sur le même objet).
 */
const makeHasVinylChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
})

/**
 * Chaîne pour addVinylToUser — insert → select → single.
 */
const makeInsertSingleChain = (result: object) => ({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
})

/**
 * Chaîne pour removeVinylFromUser — delete + triple eq terminal.
 */
const makeDeleteChain = (result: object) => {
  const thirdEq = jest.fn().mockResolvedValue(result)
  const secondEq = jest.fn().mockReturnValue({ eq: thirdEq })
  const chain = {
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue({ eq: secondEq }),
    secondEq,
    thirdEq,
  }
  return chain
}

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeUserVinylDbResult = (
  overrides: Partial<UserVinylQueryResult> = {},
): UserVinylQueryResult => ({
  id: 'uv1',
  added_at: '2024-01-01T10:00:00Z',
  release_id: 'v1',
  vinyls: {
    id: 'v1',
    title: 'Kind of Blue',
    cover_url: 'cover.png',
    year: 1959,
    country: 'US',
    catalog_number: 'CS 8163',
    vinyl_artists: [
      { position: 2, artist: { id: 'a2', name: 'Bill Evans', image_url: null } },
      { position: 1, artist: { id: 'a1', name: 'Miles Davis', image_url: 'miles.png' } },
    ],
  },
  ...overrides,
})

const USER_ID = 'u1'
const VINYL_ID = 'v1'

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('UserVinylsService', () => {
  let service: UserVinylsService

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserVinylsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: VinylsService, useValue: mockVinylsService },
        { provide: PostsService, useValue: mockPostsService },
      ],
    }).compile()

    service = module.get<UserVinylsService>(UserVinylsService)
  })

  // -----------------------------------------------------------------------
  // getUserVinyls
  // -----------------------------------------------------------------------

  describe('getUserVinyls', () => {
    it('filtre par user_id et type corrects', async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.getUserVinyls(USER_ID, 'collection')

      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
      expect(chain.eq).toHaveBeenCalledWith('type', 'collection')
    })

    it('applique la limite par défaut (20)', async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.getUserVinyls(USER_ID, 'collection')

      expect(chain.limit).toHaveBeenCalledWith(20)
    })

    it('applique une limite personnalisée', async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.getUserVinyls(USER_ID, 'collection', 5)

      expect(chain.limit).toHaveBeenCalledWith(5)
    })

    it("n'applique pas .lt() si lastAddedAt est absent", async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.getUserVinyls(USER_ID, 'collection')

      expect(chain.limitResult.lt).not.toHaveBeenCalled()
    })

    it('applique .lt() si lastAddedAt est fourni', async () => {
      const chain = makeLimitChain({ data: [], error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.getUserVinyls(USER_ID, 'collection', 20, '2024-01-01T00:00:00Z')

      expect(chain.limitResult.lt).toHaveBeenCalledWith('added_at', '2024-01-01T00:00:00Z')
    })

    it('retourne un tableau vide si aucun vinyl', async () => {
      mockAnonFrom.mockReturnValue(makeLimitChain({ data: [], error: null }))

      const res = await service.getUserVinyls(USER_ID, 'collection')

      expect(res).toHaveLength(0)
    })

    it("mappe tous les champs d'un UserVinyl", async () => {
      mockAnonFrom.mockReturnValue(makeLimitChain({ data: [makeUserVinylDbResult()], error: null }))

      const res = await service.getUserVinyls(USER_ID, 'collection')

      expect(res[0].id).toBe('uv1')
      expect(res[0].addedAt).toBe('2024-01-01T10:00:00Z')
      expect(res[0].vinyl.id).toBe('v1')
      expect(res[0].vinyl.title).toBe('Kind of Blue')
      expect(res[0].vinyl.coverUrl).toBe('cover.png')
      expect(res[0].vinyl.year).toBe(1959)
      expect(res[0].vinyl.country).toBe('US')
      expect(res[0].vinyl.catalogNumber).toBe('CS 8163')
    })

    it('trie les vinyl_artists par position', async () => {
      mockAnonFrom.mockReturnValue(makeLimitChain({ data: [makeUserVinylDbResult()], error: null }))

      const res = await service.getUserVinyls(USER_ID, 'collection')

      expect(res[0].vinyl.artists[0]).toEqual({
        id: 'a1',
        name: 'Miles Davis',
        imageUrl: 'miles.png',
      })
      expect(res[0].vinyl.artists[1]).toEqual({ id: 'a2', name: 'Bill Evans', imageUrl: null })
    })

    it('filtre les vinyl_artists avec id ou name vide', async () => {
      mockAnonFrom.mockReturnValue(
        makeLimitChain({
          data: [
            makeUserVinylDbResult({
              vinyls: {
                ...makeUserVinylDbResult().vinyls[0],
                vinyl_artists: [
                  { position: 1, artist: { id: '', name: 'Invalid', image_url: null } },
                  { position: 2, artist: { id: 'a2', name: 'Valide', image_url: null } },
                ],
              },
            }),
          ],
          error: null,
        }),
      )

      const res = await service.getUserVinyls(USER_ID, 'collection')

      expect(res[0].vinyl.artists).toHaveLength(1)
      expect(res[0].vinyl.artists[0].name).toBe('Valide')
    })

    it('retourne "Artiste inconnu" si vinyl_artists est vide', async () => {
      mockAnonFrom.mockReturnValue(
        makeLimitChain({
          data: [
            makeUserVinylDbResult({
              vinyls: { ...makeUserVinylDbResult().vinyls[0], vinyl_artists: [] },
            }),
          ],
          error: null,
        }),
      )

      const res = await service.getUserVinyls(USER_ID, 'collection')

      expect(res[0].vinyl.artists[0]).toEqual({ id: '', name: 'Artiste inconnu', imageUrl: null })
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAnonFrom.mockReturnValue(makeLimitChain({ data: null, error: { message: 'DB error' } }))

      await expect(service.getUserVinyls(USER_ID, 'collection')).rejects.toThrow(
        'Error fetching user vinyls: DB error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // getUserVinylsCount
  // -----------------------------------------------------------------------

  describe('getUserVinylsCount', () => {
    it('retourne le bon count', async () => {
      mockAnonFrom.mockReturnValue(makeCountChain({ count: 42, error: null }))

      const res = await service.getUserVinylsCount(USER_ID, 'collection')

      expect(res).toBe(42)
    })

    it('retourne 0 si count est null', async () => {
      mockAnonFrom.mockReturnValue(makeCountChain({ count: null, error: null }))

      const res = await service.getUserVinylsCount(USER_ID, 'collection')

      expect(res).toBe(0)
    })

    it('filtre par user_id et type corrects', async () => {
      const chain = makeCountChain({ count: 0, error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.getUserVinylsCount(USER_ID, 'wishlist')

      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
      expect(chain.secondEq).toHaveBeenCalledWith('type', 'wishlist')
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAnonFrom.mockReturnValue(
        makeCountChain({ count: null, error: { message: 'count error' } }),
      )

      await expect(service.getUserVinylsCount(USER_ID, 'collection')).rejects.toThrow(
        'Error counting vinyls: count error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // hasVinyl
  // -----------------------------------------------------------------------

  describe('hasVinyl', () => {
    it('retourne true si le vinyl existe', async () => {
      mockAnonFrom.mockReturnValue(makeHasVinylChain({ data: { id: 'uv1' }, error: null }))

      const res = await service.hasVinyl(USER_ID, VINYL_ID, 'collection')

      expect(res).toBe(true)
    })

    it('retourne false si PGRST116 (non trouvé)', async () => {
      mockAnonFrom.mockReturnValue(makeHasVinylChain({ data: null, error: { code: 'PGRST116' } }))

      const res = await service.hasVinyl(USER_ID, VINYL_ID, 'collection')

      expect(res).toBe(false)
    })

    it('retourne false si data est null sans erreur', async () => {
      mockAnonFrom.mockReturnValue(makeHasVinylChain({ data: null, error: null }))

      const res = await service.hasVinyl(USER_ID, VINYL_ID, 'collection')

      expect(res).toBe(false)
    })

    it('filtre par user_id, release_id et type', async () => {
      const chain = makeHasVinylChain({ data: { id: 'uv1' }, error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.hasVinyl(USER_ID, VINYL_ID, 'collection')

      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
      expect(chain.eq).toHaveBeenCalledWith('release_id', VINYL_ID)
      expect(chain.eq).toHaveBeenCalledWith('type', 'collection')
    })

    it('lève une erreur pour les erreurs non-PGRST116', async () => {
      mockAnonFrom.mockReturnValue(
        makeHasVinylChain({ data: null, error: { code: '500', message: 'DB error' } }),
      )

      await expect(service.hasVinyl(USER_ID, VINYL_ID, 'collection')).rejects.toThrow(
        'Error checking vinyl: DB error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // addVinylToUser
  // -----------------------------------------------------------------------

  describe('addVinylToUser', () => {
    const setupAdd = (hasVinylResult: boolean, insertResult: object) => {
      mockAnonFrom
        .mockReturnValueOnce(
          makeHasVinylChain({ data: hasVinylResult ? { id: 'uv1' } : null, error: null }),
        )
        .mockReturnValueOnce(makeInsertSingleChain(insertResult))
    }

    it('vérifie que le vinyl existe via VinylsService', async () => {
      setupAdd(false, { data: makeUserVinylDbResult(), error: null })

      await service.addVinylToUser(USER_ID, VINYL_ID, 'collection')

      expect(mockVinylsService.getById).toHaveBeenCalledWith(VINYL_ID)
    })

    it('lève BadRequestException si déjà dans la collection', async () => {
      mockAnonFrom.mockReturnValueOnce(makeHasVinylChain({ data: { id: 'uv1' }, error: null }))

      await expect(service.addVinylToUser(USER_ID, VINYL_ID, 'collection')).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('lève BadRequestException si déjà dans la wishlist', async () => {
      mockAnonFrom.mockReturnValueOnce(makeHasVinylChain({ data: { id: 'uv1' }, error: null }))

      await expect(service.addVinylToUser(USER_ID, VINYL_ID, 'wishlist')).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('insère avec les bons paramètres', async () => {
      const hasVinylChain = makeHasVinylChain({ data: null, error: null })
      const insertChain = makeInsertSingleChain({ data: makeUserVinylDbResult(), error: null })
      mockAnonFrom.mockReturnValueOnce(hasVinylChain).mockReturnValueOnce(insertChain)

      await service.addVinylToUser(USER_ID, VINYL_ID, 'collection')

      expect(insertChain.insert).toHaveBeenCalledWith({
        user_id: USER_ID,
        release_id: VINYL_ID,
        type: 'collection',
      })
    })

    it('retourne le UserVinyl mappé', async () => {
      setupAdd(false, { data: makeUserVinylDbResult(), error: null })

      const res = await service.addVinylToUser(USER_ID, VINYL_ID, 'collection')

      expect(res.id).toBe('uv1')
      expect(res.vinyl.title).toBe('Kind of Blue')
    })

    it('crée un post de type collection_add pour la collection', async () => {
      setupAdd(false, { data: makeUserVinylDbResult(), error: null })

      await service.addVinylToUser(USER_ID, VINYL_ID, 'collection')

      expect(mockPostsService.createPost).toHaveBeenCalledWith(USER_ID, VINYL_ID, 'collection_add')
    })

    it('crée un post de type wishlist_add pour la wishlist', async () => {
      setupAdd(false, { data: makeUserVinylDbResult(), error: null })

      await service.addVinylToUser(USER_ID, VINYL_ID, 'wishlist')

      expect(mockPostsService.createPost).toHaveBeenCalledWith(USER_ID, VINYL_ID, 'wishlist_add')
    })

    it("ne lève pas d'exception si createPost échoue", async () => {
      setupAdd(false, { data: makeUserVinylDbResult(), error: null })
      mockPostsService.createPost.mockRejectedValueOnce(new Error('post error'))

      await expect(service.addVinylToUser(USER_ID, VINYL_ID, 'collection')).resolves.not.toThrow()
    })

    it("lève une erreur si l'insert Supabase échoue", async () => {
      setupAdd(false, { data: null, error: { message: 'insert error' } })

      await expect(service.addVinylToUser(USER_ID, VINYL_ID, 'collection')).rejects.toThrow(
        'Error adding vinyl: insert error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // removeVinylFromUser
  // -----------------------------------------------------------------------

  describe('removeVinylFromUser', () => {
    it('supprime le bon vinyl', async () => {
      const deleteChain = makeDeleteChain({ error: null })
      mockAnonFrom.mockReturnValue(deleteChain)

      await service.removeVinylFromUser(USER_ID, VINYL_ID, 'collection')

      expect(mockAnonFrom).toHaveBeenCalledWith('user_vinyls')
      expect(deleteChain.delete).toHaveBeenCalled()
    })

    it('filtre par user_id, release_id et type', async () => {
      const deleteChain = makeDeleteChain({ error: null })
      mockAnonFrom.mockReturnValue(deleteChain)

      await service.removeVinylFromUser(USER_ID, VINYL_ID, 'collection')

      expect(deleteChain.eq).toHaveBeenCalledWith('user_id', USER_ID)
      expect(deleteChain.secondEq).toHaveBeenCalledWith('release_id', VINYL_ID)
      expect(deleteChain.thirdEq).toHaveBeenCalledWith('type', 'collection')
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAnonFrom.mockReturnValue(makeDeleteChain({ error: { message: 'delete error' } }))

      await expect(service.removeVinylFromUser(USER_ID, VINYL_ID, 'collection')).rejects.toThrow(
        'Error removing vinyl: delete error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // moveToCollection
  // -----------------------------------------------------------------------

  describe('moveToCollection', () => {
    it("lève BadRequestException si le vinyl n'est pas dans la wishlist", async () => {
      jest.spyOn(service, 'hasVinyl').mockResolvedValueOnce(false)

      await expect(service.moveToCollection(USER_ID, VINYL_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('lève BadRequestException si le vinyl est déjà dans la collection', async () => {
      jest
        .spyOn(service, 'hasVinyl')
        .mockResolvedValueOnce(true) // in wishlist ✓
        .mockResolvedValueOnce(true) // in collection ✓

      await expect(service.moveToCollection(USER_ID, VINYL_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('appelle removeVinylFromUser avant addVinylToUser', async () => {
      const mockAdd = jest
        .spyOn(service, 'addVinylToUser')
        .mockResolvedValue({ id: 'uv1' } as never)
      const mockRemove = jest.spyOn(service, 'removeVinylFromUser').mockResolvedValue(undefined)
      jest.spyOn(service, 'hasVinyl').mockResolvedValueOnce(true).mockResolvedValueOnce(false)

      await service.moveToCollection(USER_ID, VINYL_ID)

      const removeOrder = mockRemove.mock.invocationCallOrder[0]
      const addOrder = mockAdd.mock.invocationCallOrder[0]
      expect(removeOrder).toBeLessThan(addOrder)
    })

    it('supprime de la wishlist', async () => {
      const mockRemove = jest.spyOn(service, 'removeVinylFromUser').mockResolvedValue(undefined)
      jest.spyOn(service, 'addVinylToUser').mockResolvedValue({ id: 'uv1' } as never)
      jest.spyOn(service, 'hasVinyl').mockResolvedValueOnce(true).mockResolvedValueOnce(false)

      await service.moveToCollection(USER_ID, VINYL_ID)

      expect(mockRemove).toHaveBeenCalledWith(USER_ID, VINYL_ID, 'wishlist')
    })

    it('ajoute à la collection', async () => {
      jest.spyOn(service, 'removeVinylFromUser').mockResolvedValue(undefined)
      const mockAdd = jest
        .spyOn(service, 'addVinylToUser')
        .mockResolvedValue({ id: 'uv1' } as never)
      jest.spyOn(service, 'hasVinyl').mockResolvedValueOnce(true).mockResolvedValueOnce(false)

      await service.moveToCollection(USER_ID, VINYL_ID)

      expect(mockAdd).toHaveBeenCalledWith(USER_ID, VINYL_ID, 'collection')
    })

    it('retourne le UserVinyl ajouté à la collection', async () => {
      const expected = { id: 'uv1', vinyl: { title: 'Kind of Blue' } } as never
      jest.spyOn(service, 'removeVinylFromUser').mockResolvedValue(undefined)
      jest.spyOn(service, 'addVinylToUser').mockResolvedValue(expected)
      jest.spyOn(service, 'hasVinyl').mockResolvedValueOnce(true).mockResolvedValueOnce(false)

      const res = await service.moveToCollection(USER_ID, VINYL_ID)

      expect(res).toBe(expected)
    })
  })

  // -----------------------------------------------------------------------
  // getVinylStats
  // -----------------------------------------------------------------------

  describe('getVinylStats', () => {
    it('retourne les bons counts collection et wishlist', async () => {
      jest
        .spyOn(service, 'getUserVinylsCount')
        .mockResolvedValueOnce(10) // collection
        .mockResolvedValueOnce(3) // wishlist

      const res = await service.getVinylStats(USER_ID)

      expect(res.collectionCount).toBe(10)
      expect(res.wishlistCount).toBe(3)
    })

    it('appelle getUserVinylsCount pour collection et wishlist', async () => {
      const spy = jest.spyOn(service, 'getUserVinylsCount').mockResolvedValue(0)

      await service.getVinylStats(USER_ID)

      expect(spy).toHaveBeenCalledWith(USER_ID, 'collection')
      expect(spy).toHaveBeenCalledWith(USER_ID, 'wishlist')
    })

    it('exécute les deux requêtes en parallèle', async () => {
      const calls: string[] = []
      jest.spyOn(service, 'getUserVinylsCount').mockImplementation(async (_, type) => {
        calls.push(type as string)
        return 0
      })

      await service.getVinylStats(USER_ID)

      expect(calls).toHaveLength(2)
      expect(calls).toContain('collection')
      expect(calls).toContain('wishlist')
    })
  })
})
