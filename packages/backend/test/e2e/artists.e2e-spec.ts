import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import { artistDbFixture, albumArtistsDbFixture } from '../fixtures'

describe('Artists E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /artists/:id ────────────────────────────────────────────────────────

  describe('GET /artists/:id', () => {
    it('retourne un artiste avec ses albums (200)', async () => {
      app = await createTestApp({
        supabase: {
          'artists:select:single': { data: artistDbFixture, error: null },
          'album_artists:select:many': { data: albumArtistsDbFixture, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/artists/artist-1').expect(200)

      expect(res.body).toHaveProperty('id', 'artist-1')
      expect(res.body).toHaveProperty('name', 'The Beatles')
      expect(res.body).toHaveProperty('spotifyId', 'spotify-123')
      expect(Array.isArray(res.body.albums)).toBe(true)
      expect(res.body.albums[0]).toHaveProperty('id', 'album-1')
      expect(res.body.albums[0]).toHaveProperty('title', 'Abbey Road')
      // Vérifie la transformation snake_case → camelCase
      expect(res.body).toHaveProperty('imageUrl')
      expect(res.body).not.toHaveProperty('image_url')
    })

    it("retourne un artiste sans albums si aucun n'est associé (200)", async () => {
      app = await createTestApp({
        supabase: {
          'artists:select:single': { data: artistDbFixture, error: null },
          'album_artists:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/artists/artist-1').expect(200)

      expect(res.body.albums).toEqual([])
    })

    it("retourne 404 si l'artiste n'existe pas", async () => {
      app = await createTestApp({
        supabase: {
          'artists:select:single': {
            data: null,
            error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/artists/does-not-exist').expect(404)
    })
  })

  // ─── GET /artists ─────────────────────────────────────────────────────────────

  describe('GET /artists (search)', () => {
    it('retourne les artistes correspondant à la recherche (200)', async () => {
      app = await createTestApp({
        supabase: {
          'artists:select:many': { data: [artistDbFixture], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/artists?query=beatles').expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('id', 'artist-1')
      expect(res.body[0]).toHaveProperty('name', 'The Beatles')
      // ArtistLight ne contient pas d'albums
      expect(res.body[0]).not.toHaveProperty('albums')
    })

    it('retourne un tableau vide si aucun résultat (200)', async () => {
      app = await createTestApp({
        supabase: {
          'artists:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/artists?query=zzz').expect(200)

      expect(res.body).toEqual([])
    })

    it('retourne un tableau vide si la query est trop courte (< 2 chars)', async () => {
      app = await createTestApp()

      const res = await request(app.getHttpServer()).get('/artists?query=a').expect(200)

      expect(res.body).toEqual([])
    })

    it('accepte les params limit et offset (200)', async () => {
      app = await createTestApp({
        supabase: {
          'artists:select:many': { data: [artistDbFixture], error: null },
        },
      })

      await request(app.getHttpServer()).get('/artists?query=beatles&limit=5&offset=10').expect(200)
    })
  })
})
