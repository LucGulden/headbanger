import { Test, TestingModule } from '@nestjs/testing'
import { PostsService } from './posts.service'
import { SupabaseService } from '../common/database/supabase.service'
import type { PostQueryResult } from './posts.types'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockAnonFrom = jest.fn()
const mockSupabaseService = {
  getClient: jest.fn(() => ({ from: mockAnonFrom })),
}

// -------------------------------------------------------------------------
// Chain factories
// -------------------------------------------------------------------------

/** Chaîne terminale sur .eq() — pour follows */
const makeEqChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue(result),
})

/**
 * Chaîne pour fetchPostsByUserIds — posts query.
 * .limit() retourne un objet thenable + .lt() pour la pagination.
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
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnValue(limitResult),
    limitResult,
  }
}

/** Chaîne terminale sur .in() — pour post_likes et comments */
const makeInChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  in: jest.fn().mockResolvedValue(result),
})

/** Chaîne pour createPost — insert → select → single */
const makeInsertSingleChain = (result: object) => ({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
})

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makePostDbResult = (overrides: Partial<PostQueryResult> = {}): PostQueryResult => ({
  id: 'post1',
  user_id: 'u1',
  vinyl_id: 'v1',
  type: 'listened',
  created_at: '2024-01-01T10:00:00Z',
  user: [{ uid: 'u1', username: 'miles', photo_url: 'avatar.png' }],
  vinyl: [
    {
      id: 'v1',
      title: 'Kind of Blue',
      cover_url: 'cover.png',
      year: 1959,
      country: 'US',
      catalog_number: 'CS 8163',
      album_id: 'alb1',
      vinyl_artists: [
        { position: 2, artist: [{ id: 'a2', name: 'Bill Evans', image_url: null }] },
        { position: 1, artist: [{ id: 'a1', name: 'Miles Davis', image_url: 'miles.png' }] },
      ],
      album: [
        {
          id: 'alb1',
          title: 'Kind of Blue',
          cover_url: 'alb.png',
          album_artists: [
            { position: 1, artist: [{ id: 'a1', name: 'Miles Davis', image_url: 'miles.png' }] },
          ],
        },
      ],
    },
  ],
  ...overrides,
})

/** Setup standard pour fetchPostsByUserIds (3 appels from) */
const setupFetchPosts = (
  posts: PostQueryResult[],
  options: { likesData?: object[]; commentsData?: object[] } = {},
) => {
  const postsChain = makeLimitChain({ data: posts, error: null })
  const likesChain = makeInChain({ data: options.likesData ?? [], error: null })
  const commentsChain = makeInChain({ data: options.commentsData ?? [], error: null })

  mockAnonFrom
    .mockReturnValueOnce(postsChain)
    .mockReturnValueOnce(likesChain)
    .mockReturnValueOnce(commentsChain)

  return { postsChain, likesChain, commentsChain }
}

const USER_ID = 'u1'

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('PostsService', () => {
  let service: PostsService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [PostsService, { provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile()

    service = module.get<PostsService>(PostsService)
  })

  // -----------------------------------------------------------------------
  // getGlobalFeed
  // -----------------------------------------------------------------------

  describe('getGlobalFeed', () => {
    it('récupère les follows du bon utilisateur', async () => {
      const followsChain = makeEqChain({ data: [], error: null })
      mockAnonFrom.mockReturnValueOnce(followsChain)
      setupFetchPosts([])

      await service.getGlobalFeed(USER_ID)

      expect(followsChain.eq).toHaveBeenCalledWith('follower_id', USER_ID)
    })

    it('inclut le userId dans les ids du feed', async () => {
      mockAnonFrom.mockReturnValueOnce(makeEqChain({ data: [{ following_id: 'u2' }], error: null }))
      const { postsChain } = setupFetchPosts([])

      await service.getGlobalFeed(USER_ID)

      expect(postsChain.in).toHaveBeenCalledWith('user_id', expect.arrayContaining([USER_ID, 'u2']))
    })

    it('retourne [] si aucun post', async () => {
      mockAnonFrom.mockReturnValueOnce(makeEqChain({ data: [], error: null }))
      setupFetchPosts([])

      const res = await service.getGlobalFeed(USER_ID)

      expect(res).toEqual([])
    })

    it('lève une erreur si la requête follows échoue', async () => {
      mockAnonFrom.mockReturnValueOnce(
        makeEqChain({ data: null, error: { message: 'follows error' } }),
      )

      await expect(service.getGlobalFeed(USER_ID)).rejects.toThrow(
        'Error fetching follows: follows error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // getProfileFeed
  // -----------------------------------------------------------------------

  describe('getProfileFeed', () => {
    it('filtre uniquement par le userId du profil', async () => {
      const { postsChain } = setupFetchPosts([])

      await service.getProfileFeed(USER_ID)

      expect(postsChain.in).toHaveBeenCalledWith('user_id', [USER_ID])
    })

    it('retourne [] si aucun post', async () => {
      setupFetchPosts([])

      const res = await service.getProfileFeed(USER_ID)

      expect(res).toEqual([])
    })

    it('applique la limite par défaut (20)', async () => {
      const { postsChain } = setupFetchPosts([])

      await service.getProfileFeed(USER_ID)

      expect(postsChain.limit).toHaveBeenCalledWith(20)
    })

    it('applique une limite personnalisée', async () => {
      const { postsChain } = setupFetchPosts([])

      await service.getProfileFeed(USER_ID, 5)

      expect(postsChain.limit).toHaveBeenCalledWith(5)
    })

    it("n'applique pas .lt() si lastCreatedAt est absent", async () => {
      const { postsChain } = setupFetchPosts([])

      await service.getProfileFeed(USER_ID)

      expect(postsChain.limitResult.lt).not.toHaveBeenCalled()
    })

    it('applique .lt() si lastCreatedAt est fourni', async () => {
      const { postsChain } = setupFetchPosts([])

      await service.getProfileFeed(USER_ID, 20, '2024-01-01T00:00:00Z')

      expect(postsChain.limitResult.lt).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00Z')
    })

    it('lève une erreur si la requête posts échoue', async () => {
      const postsChain = makeLimitChain({ data: null, error: { message: 'posts error' } })
      mockAnonFrom.mockReturnValueOnce(postsChain)

      await expect(service.getProfileFeed(USER_ID)).rejects.toThrow(
        'Error fetching posts: posts error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // fetchPostsByUserIds — counts likes et commentaires
  // -----------------------------------------------------------------------

  describe('counts likes et commentaires', () => {
    it('récupère les likes pour les post_ids retournés', async () => {
      const { likesChain } = setupFetchPosts([makePostDbResult()])

      await service.getProfileFeed(USER_ID)

      expect(likesChain.in).toHaveBeenCalledWith('post_id', ['post1'])
    })

    it('récupère les commentaires pour les post_ids retournés', async () => {
      const { commentsChain } = setupFetchPosts([makePostDbResult()])

      await service.getProfileFeed(USER_ID)

      expect(commentsChain.in).toHaveBeenCalledWith('post_id', ['post1'])
    })

    it('calcule le bon likesCount par post', async () => {
      setupFetchPosts([makePostDbResult()], {
        likesData: [{ post_id: 'post1' }, { post_id: 'post1' }, { post_id: 'post1' }],
      })

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].likesCount).toBe(3)
    })

    it('calcule le bon commentsCount par post', async () => {
      setupFetchPosts([makePostDbResult()], {
        commentsData: [{ post_id: 'post1' }, { post_id: 'post1' }],
      })

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].commentsCount).toBe(2)
    })

    it('retourne 0 si aucun like ni commentaire', async () => {
      setupFetchPosts([makePostDbResult()])

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].likesCount).toBe(0)
      expect(res[0].commentsCount).toBe(0)
    })

    it('distingue les counts entre plusieurs posts', async () => {
      setupFetchPosts([makePostDbResult({ id: 'post1' }), makePostDbResult({ id: 'post2' })], {
        likesData: [{ post_id: 'post1' }, { post_id: 'post1' }, { post_id: 'post2' }],
        commentsData: [{ post_id: 'post2' }, { post_id: 'post2' }],
      })

      const res = await service.getProfileFeed(USER_ID)
      const p1 = res.find((p) => p.id === 'post1')!
      const p2 = res.find((p) => p.id === 'post2')!

      expect(p1.likesCount).toBe(2)
      expect(p1.commentsCount).toBe(0)
      expect(p2.likesCount).toBe(1)
      expect(p2.commentsCount).toBe(2)
    })

    it('gère les likes/comments data null sans erreur', async () => {
      const postsChain = makeLimitChain({ data: [makePostDbResult()], error: null })
      mockAnonFrom
        .mockReturnValueOnce(postsChain)
        .mockReturnValueOnce(makeInChain({ data: null, error: null }))
        .mockReturnValueOnce(makeInChain({ data: null, error: null }))

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].likesCount).toBe(0)
      expect(res[0].commentsCount).toBe(0)
    })
  })

  // -----------------------------------------------------------------------
  // transformPostData — mapping champs de base
  // -----------------------------------------------------------------------

  describe('transformPostData — mapping champs de base', () => {
    it('mappe tous les champs du post', async () => {
      setupFetchPosts([makePostDbResult()])

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].id).toBe('post1')
      expect(res[0].userId).toBe('u1')
      expect(res[0].type).toBe('listened')
      expect(res[0].createdAt).toBe('2024-01-01T10:00:00Z')
    })

    it('mappe les champs du user', async () => {
      setupFetchPosts([makePostDbResult()])

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].user).toEqual({ uid: 'u1', username: 'miles', photoUrl: 'avatar.png' })
    })

    it('mappe les champs du vinyl', async () => {
      setupFetchPosts([makePostDbResult()])

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].vinyl.id).toBe('v1')
      expect(res[0].vinyl.title).toBe('Kind of Blue')
      expect(res[0].vinyl.coverUrl).toBe('cover.png')
      expect(res[0].vinyl.year).toBe(1959)
      expect(res[0].vinyl.country).toBe('US')
      expect(res[0].vinyl.catalogNumber).toBe('CS 8163')
    })
  })

  // -----------------------------------------------------------------------
  // transformPostData — logique artistes
  // -----------------------------------------------------------------------

  describe('transformPostData — logique artistes', () => {
    it('trie les vinyl_artists par position', async () => {
      setupFetchPosts([makePostDbResult()])

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].vinyl.artists[0]).toEqual({
        id: 'a1',
        name: 'Miles Davis',
        imageUrl: 'miles.png',
      })
      expect(res[0].vinyl.artists[1]).toEqual({ id: 'a2', name: 'Bill Evans', imageUrl: null })
    })

    it('filtre les vinyl_artists avec id ou name vide', async () => {
      setupFetchPosts([
        makePostDbResult({
          vinyl: [
            {
              ...makePostDbResult().vinyl[0],
              vinyl_artists: [
                { position: 1, artist: [{ id: '', name: 'Invalid', image_url: null }] },
                { position: 2, artist: [{ id: 'a2', name: '', image_url: null }] },
                { position: 3, artist: [{ id: 'a3', name: 'Valide', image_url: null }] },
              ],
            },
          ],
        }),
      ])

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].vinyl.artists).toHaveLength(1)
      expect(res[0].vinyl.artists[0].name).toBe('Valide')
    })

    it('utilise album_artists en fallback si vinyl_artists est vide', async () => {
      setupFetchPosts([
        makePostDbResult({
          vinyl: [
            {
              ...makePostDbResult().vinyl[0],
              vinyl_artists: [],
              album: [
                {
                  id: 'alb1',
                  title: 'Kind of Blue',
                  cover_url: null,
                  album_artists: [
                    { position: 1, artist: [{ id: 'a1', name: 'Miles Davis', image_url: null }] },
                  ],
                },
              ],
            },
          ],
        }),
      ])

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].vinyl.artists[0].name).toBe('Miles Davis')
    })

    it('retourne "Artiste inconnu" si vinyl_artists et album_artists sont vides', async () => {
      setupFetchPosts([
        makePostDbResult({
          vinyl: [
            {
              ...makePostDbResult().vinyl[0],
              vinyl_artists: [],
              album: [{ id: 'alb1', title: 'Kind of Blue', cover_url: null, album_artists: [] }],
            },
          ],
        }),
      ])

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].vinyl.artists).toHaveLength(1)
      expect(res[0].vinyl.artists[0]).toEqual({ id: '', name: 'Artiste inconnu', imageUrl: null })
    })

    it('retourne "Artiste inconnu" si vinyl_artists est vide et album est null', async () => {
      setupFetchPosts([
        makePostDbResult({
          vinyl: [
            {
              ...makePostDbResult().vinyl[0],
              vinyl_artists: [],
              album: [],
            },
          ],
        }),
      ])

      const res = await service.getProfileFeed(USER_ID)

      expect(res[0].vinyl.artists[0]).toEqual({ id: '', name: 'Artiste inconnu', imageUrl: null })
    })
  })

  // -----------------------------------------------------------------------
  // createPost
  // -----------------------------------------------------------------------

  describe('createPost', () => {
    it('insère avec les bons paramètres', async () => {
      const insertChain = makeInsertSingleChain({ data: makePostDbResult(), error: null })
      mockAnonFrom.mockReturnValue(insertChain)

      await service.createPost('u1', 'v1', 'listened')

      expect(mockAnonFrom).toHaveBeenCalledWith('posts')
      expect(insertChain.insert).toHaveBeenCalledWith({
        user_id: 'u1',
        vinyl_id: 'v1',
        type: 'listened',
      })
    })

    it('retourne 0 pour likesCount et commentsCount', async () => {
      mockAnonFrom.mockReturnValue(makeInsertSingleChain({ data: makePostDbResult(), error: null }))

      const res = await service.createPost('u1', 'v1', 'listened')

      expect(res.likesCount).toBe(0)
      expect(res.commentsCount).toBe(0)
    })

    it('mappe les champs du post créé', async () => {
      mockAnonFrom.mockReturnValue(makeInsertSingleChain({ data: makePostDbResult(), error: null }))

      const res = await service.createPost('u1', 'v1', 'listened')

      expect(res.id).toBe('post1')
      expect(res.userId).toBe('u1')
      expect(res.type).toBe('listened')
      expect(res.user.username).toBe('miles')
      expect(res.vinyl.title).toBe('Kind of Blue')
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAnonFrom.mockReturnValue(
        makeInsertSingleChain({ data: null, error: { message: 'insert error' } }),
      )

      await expect(service.createPost('u1', 'v1', 'listened')).rejects.toThrow(
        'Error creating post: insert error',
      )
    })
  })
})
