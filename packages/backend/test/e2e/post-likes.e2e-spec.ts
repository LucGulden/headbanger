import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { TEST_USER_ID } from '../mocks/auth.mock'

const POST_ID = 'post-1'
const OTHER_USER_ID = 'other-user-id'

describe('PostLikes E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── POST /post-likes/:postId ─────────────────────────────────────────────────

  describe('POST /post-likes/:postId', () => {
    it('like un post avec succès (201)', async () => {
      app = await createTestApp({
        supabase: {
          'post_likes:insert': { data: null, error: null },
          // createLikeNotification → récupère l'auteur du post
          'posts:select:single': {
            data: { user_id: OTHER_USER_ID },
            error: null,
          },
          'notifications:insert:single': { data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).post(`/post-likes/${POST_ID}`).expect(201)

      expect(res.body).toEqual({ success: true })
    })

    it('retourne 400 si le post est déjà liké (duplicate key)', async () => {
      app = await createTestApp({
        supabase: {
          'post_likes:insert': {
            data: null,
            error: { message: 'duplicate key', code: '23505', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).post(`/post-likes/${POST_ID}`).expect(400)
    })

    it('ne crée pas de notification si on like son propre post', async () => {
      // L'auteur du post = TEST_USER_ID (même que l'utilisateur connecté)
      app = await createTestApp({
        supabase: {
          'post_likes:insert': { data: null, error: null },
          'posts:select:single': {
            data: { user_id: TEST_USER_ID },
            error: null,
          },
        },
      })

      // Doit quand même retourner 201 (la notification est juste skippée)
      const res = await request(app.getHttpServer()).post(`/post-likes/${POST_ID}`).expect(201)

      expect(res.body).toEqual({ success: true })
    })
  })

  // ─── DELETE /post-likes/:postId ───────────────────────────────────────────────

  describe('DELETE /post-likes/:postId', () => {
    it('unlike un post avec succès (200)', async () => {
      app = await createTestApp({
        supabase: {
          // deleteByLike → select notification existante
          'notifications:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
          'notifications:delete': { data: null, error: null },
          'post_likes:delete': { data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).delete(`/post-likes/${POST_ID}`).expect(200)

      expect(res.body).toEqual({ success: true })
    })
  })

  // ─── GET /post-likes/check/:postId ────────────────────────────────────────────

  describe('GET /post-likes/check/:postId', () => {
    it('retourne { hasLiked: true } si le post est liké (200)', async () => {
      app = await createTestApp({
        supabase: {
          'post_likes:select:single': { data: { id: 'like-1' }, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get(`/post-likes/check/${POST_ID}`).expect(200)

      expect(res.body).toEqual({ hasLiked: true })
    })

    it("retourne { hasLiked: false } si le post n'est pas liké (200)", async () => {
      app = await createTestApp({
        supabase: {
          'post_likes:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      const res = await request(app.getHttpServer()).get(`/post-likes/check/${POST_ID}`).expect(200)

      expect(res.body).toEqual({ hasLiked: false })
    })
  })

  // ─── GET /post-likes/count/:postId ────────────────────────────────────────────

  describe('GET /post-likes/count/:postId', () => {
    it('retourne le nombre de likes (200, public)', async () => {
      app = await createTestApp({
        supabase: {
          'post_likes:select:count': { count: 42, data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get(`/post-likes/count/${POST_ID}`).expect(200)

      expect(res.body).toEqual({ count: 42 })
    })
  })
})
