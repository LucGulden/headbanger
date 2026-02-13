import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { notificationDbFixture } from '../fixtures'

describe('Notifications E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /notifications ───────────────────────────────────────────────────────

  describe('GET /notifications', () => {
    it("retourne les notifications de l'utilisateur (200)", async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:many': { data: [notificationDbFixture], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications').expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('id', 'notif-1')
      expect(res.body[0]).toHaveProperty('type', 'new_follower')
      expect(res.body[0]).toHaveProperty('read', false)
      expect(res.body[0].actor).toHaveProperty('username', 'testuser2')
    })

    it('retourne un tableau vide si aucune notification (200)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications').expect(200)

      expect(res.body).toEqual([])
    })

    it('accepte les query params limit et lastCreatedAt (200)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:many': { data: [], error: null },
        },
      })

      await request(app.getHttpServer())
        .get('/notifications?limit=5&lastCreatedAt=2024-01-01T00:00:00.000Z')
        .expect(200)
    })
  })

  // ─── GET /notifications/unread-count ─────────────────────────────────────────

  describe('GET /notifications/unread-count', () => {
    it('retourne le nombre de notifications non lues (200)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:count': { count: 3, data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications/unread-count').expect(200)

      expect(res.body).toEqual({ count: 3 })
    })

    it('retourne 0 si toutes les notifications sont lues (200)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:count': { count: 0, data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications/unread-count').expect(200)

      expect(res.body).toEqual({ count: 0 })
    })
  })

  // ─── PUT /notifications/mark-all-read ────────────────────────────────────────

  describe('PUT /notifications/mark-all-read', () => {
    it('marque toutes les notifications comme lues (200)', async () => {
      // L'opération update sans .single() résout via then() avec la valeur par défaut
      app = await createTestApp()

      const res = await request(app.getHttpServer()).put('/notifications/mark-all-read').expect(200)

      expect(res.body).toEqual({ success: true })
    })
  })
})
