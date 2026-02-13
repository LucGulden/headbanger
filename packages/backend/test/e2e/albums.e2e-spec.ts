import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { artistJoinFixture } from '../fixtures'

// ─── Fixtures locales ─────────────────────────────────────────────────────────

const albumDbFixture = {
  id: 'album-1',
  title: 'Abbey Road',
  cover_url: 'https://example.com/cover.jpg',
  year: 1969,
  album_artists: [artistJoinFixture],
}

const vinylsDbFixture = [
  {
    id: 'vinyl-1',
    title: 'Abbey Road (UK Press)',
    cover_url: null,
    year: 1969,
    country: 'UK',
    catalog_number: 'PCS 7088',
    vinyl_artists: [],
  },
]

describe('Albums E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /albums/:id ────────────────────────────────────────────────────────

  describe('GET /albums/:id', () => {
    it('retourne un album avec ses vinyles (200)', async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:single': { data: albumDbFixture, error: null },
          'vinyls:select:many': { data: vinylsDbFixture, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/album-1').expect(200)

      expect(res.body).toHaveProperty('id', 'album-1')
      expect(res.body).toHaveProperty('title', 'Abbey Road')
      expect(res.body).toHaveProperty('year', 1969)
      expect(res.body.artists[0]).toHaveProperty('name', 'Test Artist')
      expect(Array.isArray(res.body.vinyls)).toBe(true)
      expect(res.body.vinyls[0]).toHaveProperty('id', 'vinyl-1')
      // Vérifie la transformation snake_case → camelCase
      expect(res.body).toHaveProperty('coverUrl')
      expect(res.body).not.toHaveProperty('cover_url')
    })

    it("retourne un album sans vinyles si aucun n'est associé (200)", async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:single': { data: albumDbFixture, error: null },
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
  })

  // ─── GET /albums/search ──────────────────────────────────────────────────────

  describe('GET /albums/search', () => {
    it('retourne les albums correspondant à la recherche (200)', async () => {
      app = await createTestApp({
        supabase: {
          'albums:select:many': { data: [albumDbFixture], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/albums/search?query=abbey').expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('id', 'album-1')
      expect(res.body[0]).toHaveProperty('title', 'Abbey Road')
      // AlbumLight ne contient pas de vinyls
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
          'albums:select:many': { data: [albumDbFixture], error: null },
        },
      })

      await request(app.getHttpServer())
        .get('/albums/search?query=abbey&limit=5&offset=10')
        .expect(200)
    })
  })
})
