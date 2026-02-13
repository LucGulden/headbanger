import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { TEST_USER_ID } from '../mocks/auth.mock'
import { commentDbFixture } from '../fixtures'

const POST_ID = 'post-1'
const COMMENT_ID = 'comment-1'
const OTHER_USER_ID = 'other-user-id'

describe('Comments E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /comments/post/:postId ───────────────────────────────────────────────

  describe('GET /comments/post/:postId', () => {
    it("retourne les commentaires d'un post (200, public)", async () => {
      app = await createTestApp({
        supabase: {
          'comments:select:many': { data: [commentDbFixture], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get(`/comments/post/${POST_ID}`).expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('id', COMMENT_ID)
      expect(res.body[0]).toHaveProperty('content', 'Super vinyle !')
      expect(res.body[0].user).toHaveProperty('username', 'testuser')
    })

    it('retourne un tableau vide si aucun commentaire (200)', async () => {
      app = await createTestApp({
        supabase: {
          'comments:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get(`/comments/post/${POST_ID}`).expect(200)

      expect(res.body).toEqual([])
    })
  })

  // ─── GET /comments/post/:postId/count ─────────────────────────────────────────

  describe('GET /comments/post/:postId/count', () => {
    it('retourne le nombre de commentaires (200, public)', async () => {
      app = await createTestApp({
        supabase: {
          'comments:select:count': { count: 7, data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/comments/post/${POST_ID}/count`)
        .expect(200)

      expect(res.body).toEqual({ count: 7 })
    })
  })

  // ─── POST /comments ───────────────────────────────────────────────────────────

  describe('POST /comments', () => {
    it('ajoute un commentaire avec succès (201)', async () => {
      app = await createTestApp({
        supabase: {
          'comments:insert:single': { data: commentDbFixture, error: null },
          // createCommentNotification → récupère auteur du post
          'posts:select:single': {
            data: { user_id: OTHER_USER_ID },
            error: null,
          },
          'notifications:insert:single': { data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({ postId: POST_ID, content: 'Super vinyle !' })
        .expect(201)

      expect(res.body).toHaveProperty('id', COMMENT_ID)
      expect(res.body).toHaveProperty('content', 'Super vinyle !')
    })

    it('retourne 400 si le contenu est vide', async () => {
      app = await createTestApp()

      await request(app.getHttpServer())
        .post('/comments')
        .send({ postId: POST_ID, content: '' })
        .expect(400)
    })

    it('retourne 400 si le contenu dépasse 500 caractères', async () => {
      app = await createTestApp()

      await request(app.getHttpServer())
        .post('/comments')
        .send({ postId: POST_ID, content: 'a'.repeat(501) })
        .expect(400)
    })

    it("retourne 400 si le contenu n'est que des espaces", async () => {
      app = await createTestApp()

      await request(app.getHttpServer())
        .post('/comments')
        .send({ postId: POST_ID, content: '   ' })
        .expect(400)
    })
  })

  // ─── DELETE /comments/:id ─────────────────────────────────────────────────────

  describe('DELETE /comments/:id', () => {
    it('supprime son propre commentaire (200)', async () => {
      app = await createTestApp({
        supabase: {
          // Vérifie que le commentaire appartient à l'utilisateur
          'comments:select:single': {
            data: { user_id: TEST_USER_ID, post_id: POST_ID },
            error: null,
          },
          // deleteByComment → select notification
          'notifications:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
          'notifications:delete': { data: null, error: null },
          'comments:delete': { data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).delete(`/comments/${COMMENT_ID}`).expect(200)

      expect(res.body).toEqual({ success: true })
    })

    it("retourne 400 si on tente de supprimer le commentaire de quelqu'un d'autre", async () => {
      app = await createTestApp({
        supabase: {
          'comments:select:single': {
            data: { user_id: OTHER_USER_ID, post_id: POST_ID },
            error: null,
          },
        },
      })

      await request(app.getHttpServer()).delete(`/comments/${COMMENT_ID}`).expect(400)
    })

    it("retourne 404 si le commentaire n'existe pas", async () => {
      app = await createTestApp({
        supabase: {
          'comments:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).delete('/comments/does-not-exist').expect(404)
    })
  })
})
