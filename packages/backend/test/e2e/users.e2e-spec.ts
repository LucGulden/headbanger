import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { TEST_USER_ID } from '../mocks/auth.mock'
import { dbUserFixture } from '../fixtures'

describe('Users E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /users/me ────────────────────────────────────────────────────────────

  describe('GET /users/me', () => {
    it("retourne le profil de l'utilisateur connecté (200)", async () => {
      app = await createTestApp({
        supabase: {
          'users:select:single': { data: dbUserFixture, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/users/me').expect(200)

      expect(res.body).toHaveProperty('uid', TEST_USER_ID)
      expect(res.body).toHaveProperty('username', 'testuser')
      // Vérifie la transformation snake_case → camelCase
      expect(res.body).toHaveProperty('firstName', 'Test')
      expect(res.body).toHaveProperty('lastName', 'User')
      expect(res.body).not.toHaveProperty('first_name')
    })

    it("retourne 404 si le profil n'existe pas en base", async () => {
      app = await createTestApp({
        supabase: {
          'users:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/users/me').expect(404)
    })
  })

  // ─── PUT /users/me ────────────────────────────────────────────────────────────

  describe('PUT /users/me', () => {
    it('met à jour le profil avec succès (200)', async () => {
      const updatedUser = { ...dbUserFixture, username: 'newusername' }

      app = await createTestApp({
        supabase: {
          // checkUsernameAvailability → select:many (pas de conflit)
          'users:select:many': { data: [], error: null },
          // update profil
          'users:update:single': { data: updatedUser, error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .put('/users/me')
        .send({ username: 'newusername' })
        .expect(200)

      expect(res.body).toHaveProperty('username', 'newusername')
    })

    it('retourne 400 si le username est déjà pris par un autre utilisateur', async () => {
      app = await createTestApp({
        supabase: {
          // checkUsernameAvailability → username déjà pris par quelqu'un d'autre
          'users:select:many': {
            data: [{ uid: 'other-user', username: 'takenusername' }],
            error: null,
          },
        },
      })

      await request(app.getHttpServer())
        .put('/users/me')
        .send({ username: 'takenusername' })
        .expect(400)
    })
  })

  // ─── GET /users/username/:username ────────────────────────────────────────────

  describe('GET /users/username/:username', () => {
    it("retourne l'utilisateur par username (200, public)", async () => {
      app = await createTestApp({
        supabase: {
          'users:select:single': { data: dbUserFixture, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/users/username/testuser').expect(200)

      expect(res.body).toHaveProperty('username', 'testuser')
    })

    it("retourne 404 si le username n'existe pas", async () => {
      app = await createTestApp({
        supabase: {
          'users:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/users/username/does-not-exist').expect(404)
    })
  })

  // ─── GET /users/search ────────────────────────────────────────────────────────

  describe('GET /users/search', () => {
    it('retourne les résultats de recherche (200, public)', async () => {
      app = await createTestApp({
        supabase: {
          'users:select:many': { data: [dbUserFixture], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/users/search?query=test').expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('uid', TEST_USER_ID)
    })

    it('retourne un tableau vide si la query est trop courte (< 2 chars)', async () => {
      app = await createTestApp()

      const res = await request(app.getHttpServer()).get('/users/search?query=t').expect(200)

      expect(res.body).toEqual([])
    })
  })

  // ─── GET /users/check-username ────────────────────────────────────────────────

  describe('GET /users/check-username', () => {
    it('retourne { available: true } si le username est libre (200)', async () => {
      app = await createTestApp({
        supabase: {
          'users:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get('/users/check-username?username=freeusername')
        .expect(200)

      expect(res.body).toEqual({ available: true })
    })

    it('retourne { available: false } si le username est pris (200)', async () => {
      app = await createTestApp({
        supabase: {
          'users:select:many': { data: [{ uid: 'other-user', username: 'taken' }], error: null },
        },
      })

      const res = await request(app.getHttpServer())
        .get('/users/check-username?username=taken')
        .expect(200)

      expect(res.body).toEqual({ available: false })
    })
  })

  // ─── GET /users/:uid ──────────────────────────────────────────────────────────

  describe('GET /users/:uid', () => {
    it('retourne un utilisateur par uid (200, public)', async () => {
      app = await createTestApp({
        supabase: {
          'users:select:single': { data: dbUserFixture, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get(`/users/${TEST_USER_ID}`).expect(200)

      expect(res.body).toHaveProperty('uid', TEST_USER_ID)
    })

    it("retourne 404 si l'utilisateur n'existe pas", async () => {
      app = await createTestApp({
        supabase: {
          'users:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/users/does-not-exist').expect(404)
    })
  })
})
