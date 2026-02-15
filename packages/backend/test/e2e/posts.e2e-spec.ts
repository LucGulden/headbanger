import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { postDbFixture, postWithVinylArtistDbFixture, postWithNoArtistDbFixture } from '../fixtures'
describe('Posts E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /posts/feed ────────────────────────────────────────────────────────

  describe('GET /posts/feed', () => {
    it('retourne le feed global (200)', async () => {
      app = await createTestApp({
        supabase: {
          // 1. Récupère les follows de l'utilisateur
          'follows:select:many': { data: [], error: null },
          // 2. Récupère les posts des users suivis + soi-même
          'posts:select:many': { data: [postDbFixture], error: null },
          // 3. Compte les likes et commentaires des posts
          'post_likes:select:many': { data: [], error: null },
          'comments:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/posts/feed').expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(1)
      expect(res.body[0]).toHaveProperty('id', 'post-1')
      expect(res.body[0]).toHaveProperty('type', 'collection_add')
    })

    it('retourne un feed vide si aucun post (200)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [], error: null },
          'posts:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/posts/feed').expect(200)

      expect(res.body).toEqual([])
    })

    it('accepte les query params limit et lastCreatedAt (200)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [], error: null },
          'posts:select:many': { data: [], error: null },
        },
      })

      await request(app.getHttpServer())
        .get('/posts/feed?limit=5&lastCreatedAt=2024-01-01T00:00:00.000Z')
        .expect(200)
    })

    it('retourne 401 sans authentification', async () => {
      // On recréé l'app sans override du guard
      const { Test } = await import('@nestjs/testing')
      const { AppModule } = await import('../../src/app.module')
      const { SupabaseService } = await import('../../src/common/database/supabase.service')
      const { RedisService } = await import('../../src/redis/redis.service')
      const { createSupabaseServiceMock } = await import('../mocks/supabase.mock')
      const { createRedisServiceMock } = await import('../mocks/redis.mock')

      const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(SupabaseService)
        .useValue(createSupabaseServiceMock({}))
        .overrideProvider(RedisService)
        .useValue(createRedisServiceMock())
        .compile()

      app = moduleFixture.createNestApplication()
      await app.init()

      await request(app.getHttpServer()).get('/posts/feed').expect(401)
    })

    it('500 → erreur Supabase sur getGlobalFeed (follows, ligne 24)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/posts/feed').expect(500)
    })

    it('500 → erreur Supabase sur fetchPostsByUserIds (posts, ligne 125)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [], error: null },
          'posts:select:many': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/posts/feed').expect(500)
    })

    it('retourne [] si posts data est null (ligne 128)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [], error: null },
          'posts:select:many': { data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/posts/feed').expect(200)

      expect(res.body).toEqual([])
    })

    it('retourne les artistes depuis vinyl_artists (lignes 221-233, branche false de 239)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [], error: null },
          'posts:select:many': { data: [postWithVinylArtistDbFixture], error: null },
          'post_likes:select:many': { data: [], error: null },
          'comments:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/posts/feed').expect(200)

      expect(res.body[0].vinyl.artists[0]).toHaveProperty('name', 'Test Artist')
    })

    it('fallback "Artiste inconnu" si vinyl_artists et album_artists vides (ligne 255)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [], error: null },
          'posts:select:many': { data: [postWithNoArtistDbFixture], error: null },
          'post_likes:select:many': { data: [], error: null },
          'comments:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/posts/feed').expect(200)

      expect(res.body[0].vinyl.artists[0]).toHaveProperty('name', 'Artiste inconnu')
    })

    it('inclut les likes et commentaires dans le feed (likesCountMap / commentsCountMap)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [], error: null },
          'posts:select:many': { data: [postDbFixture], error: null },
          'post_likes:select:many': {
            data: [{ post_id: 'post-1' }, { post_id: 'post-1' }],
            error: null,
          },
          'comments:select:many': { data: [{ post_id: 'post-1' }], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/posts/feed').expect(200)

      expect(res.body[0]).toHaveProperty('likesCount', 2)
      expect(res.body[0]).toHaveProperty('commentsCount', 1)
    })
  })

  // ─── GET /posts/profile/:userId ─────────────────────────────────────────────

  describe('GET /posts/profile/:userId', () => {
    it('retourne le feed du profil (200, public)', async () => {
      app = await createTestApp({
        supabase: {
          'posts:select:many': { data: [postDbFixture], error: null },
          'post_likes:select:many': { data: [], error: null },
          'comments:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/posts/profile/${postDbFixture.user_id}`)
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0].userId).toBe(postDbFixture.user_id)
    })

    it("retourne un tableau vide si le profil n'a pas de posts (200)", async () => {
      app = await createTestApp({
        supabase: {
          'posts:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/posts/profile/unknown-user').expect(200)

      expect(res.body).toEqual([])
    })

    it('500 → erreur Supabase sur getProfileFeed (ligne 125)', async () => {
      app = await createTestApp({
        supabase: {
          'posts:select:many': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get(`/posts/profile/${postDbFixture.user_id}`).expect(500)
    })

    it('retourne les artistes depuis vinyl_artists sur le profil (lignes 221-233)', async () => {
      app = await createTestApp({
        supabase: {
          'posts:select:many': { data: [postWithVinylArtistDbFixture], error: null },
          'post_likes:select:many': { data: [], error: null },
          'comments:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/posts/profile/${postDbFixture.user_id}`)
        .expect(200)

      expect(res.body[0].vinyl.artists[0]).toHaveProperty('name', 'Test Artist')
    })
  })
})
