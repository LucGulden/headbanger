import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { TEST_USER_ID } from '../mocks/auth.mock'
import { userVinylDbFixture, vinylDbFixture, postDbFixture } from '../fixtures'

const VINYL_ID = 'vinyl-1'

describe('UserVinyls E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /user-vinyls/user/:userId ────────────────────────────────────────────

  describe('GET /user-vinyls/user/:userId', () => {
    it("retourne les vinyles de la collection d'un utilisateur (200)", async () => {
      app = await createTestApp({
        supabase: {
          'user_vinyls:select:many': { data: [userVinylDbFixture], error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/user-vinyls/user/${TEST_USER_ID}?type=collection`)
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('id', 'uv-1')
      expect(res.body[0].vinyl).toHaveProperty('title', 'Test Vinyl')
    })

    it('retourne un tableau vide si la collection est vide (200)', async () => {
      app = await createTestApp({
        supabase: {
          'user_vinyls:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/user-vinyls/user/${TEST_USER_ID}?type=collection`)
        .expect(200)

      expect(res.body).toEqual([])
    })
  })

  // ─── GET /user-vinyls/user/:userId/count ──────────────────────────────────────

  describe('GET /user-vinyls/user/:userId/count', () => {
    it("retourne le nombre de vinyles d'un utilisateur (200)", async () => {
      app = await createTestApp({
        supabase: {
          'user_vinyls:select:count': { count: 12, data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/user-vinyls/user/${TEST_USER_ID}/count?type=collection`)
        .expect(200)

      expect(res.body).toEqual({ count: 12 })
    })
  })

  // ─── GET /user-vinyls/user/:userId/stats ──────────────────────────────────────

  describe('GET /user-vinyls/user/:userId/stats', () => {
    it('retourne les stats (collectionCount + wishlistCount) (200)', async () => {
      app = await createTestApp({
        supabase: {
          // Les deux appels getUserVinylsCount utilisent la même clé (collection + wishlist)
          'user_vinyls:select:count': { count: 5, data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/user-vinyls/user/${TEST_USER_ID}/stats`)
        .expect(200)

      expect(res.body).toHaveProperty('collectionCount', 5)
      expect(res.body).toHaveProperty('wishlistCount', 5)
    })
  })

  // ─── GET /user-vinyls/check/:vinylId ──────────────────────────────────────────

  describe('GET /user-vinyls/check/:vinylId', () => {
    it('retourne { has: true } si le vinyl est dans la collection (200)', async () => {
      app = await createTestApp({
        supabase: {
          'user_vinyls:select:single': { data: { id: 'uv-1' }, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/user-vinyls/check/${VINYL_ID}?type=collection`)
        .expect(200)

      expect(res.body).toEqual({ has: true })
    })

    it("retourne { has: false } si le vinyl n'est pas dans la collection (200)", async () => {
      app = await createTestApp({
        supabase: {
          'user_vinyls:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/user-vinyls/check/${VINYL_ID}?type=collection`)
        .expect(200)

      expect(res.body).toEqual({ has: false })
    })
  })

  // ─── POST /user-vinyls ────────────────────────────────────────────────────────

  describe('POST /user-vinyls', () => {
    it('ajoute un vinyl à la collection avec succès (201)', async () => {
      app = await createTestApp({
        supabase: {
          // addVinylToUser → vinylsService.getById (vérifie que le vinyl existe)
          'vinyls:select:single': { data: vinylDbFixture, error: null },
          // addVinylToUser → hasVinyl (pas encore dans la collection)
          'user_vinyls:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
          // addVinylToUser → insert
          'user_vinyls:insert:single': { data: userVinylDbFixture, error: null },
          // createVinylPost (async, non bloquant) → insert post
          'posts:insert:single': { data: postDbFixture, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .post('/user-vinyls')
        .send({ vinylId: VINYL_ID, type: 'collection' })
        .expect(201)

      expect(res.body).toHaveProperty('id', 'uv-1')
      expect(res.body.vinyl).toHaveProperty('title', 'Test Vinyl')
    })

    it('retourne 400 si le vinyl est déjà dans la collection', async () => {
      app = await createTestApp({
        supabase: {
          'vinyls:select:single': { data: vinylDbFixture, error: null },
          // hasVinyl → le vinyl existe déjà
          'user_vinyls:select:single': { data: { id: 'uv-1' }, error: null },
        },
      })

      await request(app.getHttpServer())
        .post('/user-vinyls')
        .send({ vinylId: VINYL_ID, type: 'collection' })
        .expect(400)
    })

    it("retourne 404 si le vinyl n'existe pas", async () => {
      app = await createTestApp({
        supabase: {
          'vinyls:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer())
        .post('/user-vinyls')
        .send({ vinylId: 'does-not-exist', type: 'collection' })
        .expect(404)
    })
  })

  // ─── DELETE /user-vinyls/:vinylId ─────────────────────────────────────────────

  describe('DELETE /user-vinyls/:vinylId', () => {
    it('retire un vinyl de la collection avec succès (200)', async () => {
      app = await createTestApp({
        supabase: {
          'user_vinyls:delete': { data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .delete(`/user-vinyls/${VINYL_ID}?type=collection`)
        .expect(200)

      expect(res.body).toEqual({ success: true })
    })
  })

  // ─── POST /user-vinyls/:vinylId/move-to-collection ───────────────────────────

  describe('POST /user-vinyls/:vinylId/move-to-collection', () => {
    it("retourne 400 si le vinyl n'est pas dans la wishlist", async () => {
      app = await createTestApp({
        supabase: {
          // hasVinyl(wishlist) → not found
          'user_vinyls:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer())
        .post(`/user-vinyls/${VINYL_ID}/move-to-collection`)
        .expect(400)
    })

    it('retourne 400 si le vinyl est déjà dans la collection', async () => {
      // Les deux appels hasVinyl retournent la même clé mock.
      // Si on configure un résultat positif, hasVinyl(wishlist)=true, hasVinyl(collection)=true
      // → throws 'already in collection'
      app = await createTestApp({
        supabase: {
          'user_vinyls:select:single': { data: { id: 'uv-1' }, error: null },
        },
      })

      await request(app.getHttpServer())
        .post(`/user-vinyls/${VINYL_ID}/move-to-collection`)
        .expect(400)
    })
  })
})
