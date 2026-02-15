import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { albumJoinFixture, albumVinylsFixture, albumNoArtistsFixture } from '../fixtures'

describe('Albums E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /albums/:id ──────────────────────────────────────────────────────

  describe('GET /albums/:id', () => {
    it('retourne un album avec ses vinyles (200)', async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:single': { data: albumJoinFixture, error: null },
          'vinyls:select:many': { data: albumVinylsFixture, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/album-1').expect(200)

      expect(res.body).toHaveProperty('id', 'album-1')
      expect(res.body).toHaveProperty('title', 'Test Album')
      expect(res.body).toHaveProperty('year', 2020)
      expect(res.body.artists[0]).toHaveProperty('name', 'Test Artist')
      expect(Array.isArray(res.body.vinyls)).toBe(true)
      expect(res.body.vinyls[0]).toHaveProperty('id', 'vinyl-1')
      expect(res.body).toHaveProperty('coverUrl')
      expect(res.body).not.toHaveProperty('cover_url')
    })

    it("retourne un album sans vinyles si aucun n'est associé (200)", async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:single': { data: albumJoinFixture, error: null },
          'vinyls:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/album-1').expect(200)

      expect(res.body.vinyls).toEqual([])
    })

    it("retourne 404 si l'album n'existe pas", async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/albums/does-not-exist').expect(404)
    })

    it('retourne 200 avec vinyls vides si la requête vinyls échoue (ligne 62)', async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:single': { data: albumJoinFixture, error: null },
          'vinyls:select:many': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/album-1').expect(200)

      expect(res.body).toHaveProperty('id', 'album-1')
      expect(res.body.vinyls).toEqual([])
    })

    it("retourne \"Artiste inconnu\" si l'album n'a pas d'artistes (ligne 129)", async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:single': { data: albumNoArtistsFixture, error: null },
          'vinyls:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/album-no-artists').expect(200)

      expect(res.body.artists).toEqual([{ id: '', name: 'Artiste inconnu', imageUrl: null }])
    })
  })

  // ─── GET /albums/search ───────────────────────────────────────────────────

  describe('GET /albums/search', () => {
    it('retourne les albums correspondant à la recherche (200)', async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:many': { data: [albumJoinFixture], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/search?query=test').expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('id', 'album-1')
      expect(res.body[0]).toHaveProperty('title', 'Test Album')
      expect(res.body[0]).not.toHaveProperty('vinyls')
    })

    it('retourne un tableau vide si aucun résultat (200)', async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/search?query=zzz').expect(200)

      expect(res.body).toEqual([])
    })

    it('retourne un tableau vide si la query est trop courte (< 2 chars)', async () => {
      app = await createTestApp()

      const res = await request(app.getHttpServer()).get('/albums/search?query=a').expect(200)

      expect(res.body).toEqual([])
    })

    it('accepte les params limit et offset (200)', async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:many': { data: [albumJoinFixture], error: null },
        },
      })

      await request(app.getHttpServer())
        .get('/albums/search?query=test&limit=5&offset=10')
        .expect(200)
    })

    it('retourne 500 si la requête Supabase échoue (ligne 109)', async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:many': {
            data: null,
            error: { message: 'Connection error', code: '500', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/albums/search?query=test').expect(500)
    })

    it('retourne tableau vide si data est null sans erreur (ligne 113)', async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:many': { data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/search?query=test').expect(200)

      expect(res.body).toEqual([])
    })

    it("retourne \"Artiste inconnu\" si l'album n'a pas d'artistes (ligne 141)", async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:many': { data: [albumNoArtistsFixture], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/search?query=mystery').expect(200)

      expect(res.body[0].artists).toEqual([{ id: '', name: 'Artiste inconnu', imageUrl: null }])
    })
  })
})
