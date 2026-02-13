import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { TEST_USER_ID, TEST_USER_ID_2 } from '../mocks/auth.mock'
import { dbUserFixture2 } from '../fixtures'

describe('Follows E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /follows/stats/:userId ──────────────────────────────────────────────

  describe('GET /follows/stats/:userId', () => {
    it('retourne les stats de follow (200, public)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:count': { count: 5, data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/follows/stats/${TEST_USER_ID}`)
        .expect(200)

      // Deux appels count (followers + following) — les deux utilisent la même clé
      expect(res.body).toHaveProperty('followersCount')
      expect(res.body).toHaveProperty('followingCount')
      expect(typeof res.body.followersCount).toBe('number')
    })
  })

  // ─── GET /follows/check/:userId ──────────────────────────────────────────────

  describe('GET /follows/check/:userId', () => {
    it("retourne { isFollowing: true } si l'utilisateur suit (200)", async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:single': {
            data: { id: 'follow-1' },
            error: null,
          },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/follows/check/${TEST_USER_ID_2}`)
        .expect(200)

      expect(res.body).toEqual({ isFollowing: true })
    })

    it("retourne { isFollowing: false } si l'utilisateur ne suit pas (200)", async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/follows/check/${TEST_USER_ID_2}`)
        .expect(200)

      expect(res.body).toEqual({ isFollowing: false })
    })
  })

  // ─── POST /follows/:userId ────────────────────────────────────────────────────

  describe('POST /follows/:userId', () => {
    it('suit un utilisateur avec succès (201)', async () => {
      app = await createTestApp({
        supabase: {
          // getUserByUid (vérifie que la cible existe)
          'users:select:single': { data: dbUserFixture2, error: null },
          // insert follow
          'follows:insert': { data: null, error: null },
          // createFollowNotification → insert notification
          'notifications:insert:single': { data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).post(`/follows/${TEST_USER_ID_2}`).expect(201)

      expect(res.body).toEqual({ success: true })
    })

    it('retourne 400 si on essaie de se suivre soi-même', async () => {
      app = await createTestApp()

      await request(app.getHttpServer()).post(`/follows/${TEST_USER_ID}`).expect(400)
    })

    it("retourne 400 si l'utilisateur est déjà suivi (duplicate key)", async () => {
      app = await createTestApp({
        supabase: {
          'users:select:single': { data: dbUserFixture2, error: null },
          'follows:insert': {
            data: null,
            error: { message: 'duplicate key', code: '23505', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).post(`/follows/${TEST_USER_ID_2}`).expect(400)
    })
  })

  // ─── DELETE /follows/:userId ──────────────────────────────────────────────────

  describe('DELETE /follows/:userId', () => {
    it('ne plus suivre un utilisateur avec succès (200)', async () => {
      app = await createTestApp({
        supabase: {
          // deleteByFollow → select notification
          'notifications:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
          // deleteByFollow → delete notification
          'notifications:delete': { data: null, error: null },
          // delete follow
          'follows:delete': { data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .delete(`/follows/${TEST_USER_ID_2}`)
        .expect(200)

      expect(res.body).toEqual({ success: true })
    })
  })

  // ─── GET /follows/followers/:userId ──────────────────────────────────────────

  describe('GET /follows/followers/:userId', () => {
    it('retourne la liste des followers (200, public)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [{ follower_id: TEST_USER_ID_2 }], error: null },
          'users:select:many': { data: [dbUserFixture2], error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/follows/followers/${TEST_USER_ID}`)
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('uid', TEST_USER_ID_2)
    })

    it('retourne un tableau vide si aucun follower (200)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/follows/followers/${TEST_USER_ID}`)
        .expect(200)

      expect(res.body).toEqual([])
    })
  })

  // ─── GET /follows/following/:userId ──────────────────────────────────────────

  describe('GET /follows/following/:userId', () => {
    it('retourne la liste des following (200, public)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:select:many': { data: [{ following_id: TEST_USER_ID_2 }], error: null },
          'users:select:many': { data: [dbUserFixture2], error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get(`/follows/following/${TEST_USER_ID}`)
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
    })
  })
})
