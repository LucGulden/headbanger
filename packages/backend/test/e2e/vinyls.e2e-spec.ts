import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'

describe('Vinyls E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  it('GET /vinyls/:id → retourne un vinyl transformé', async () => {
    app = await createTestApp({
      supabase: {
        'vinyls:select:single': {
          data: {
            id: '123',
            title: 'Test Vinyl',
            cover_url: null,
            year: 2000,
            label: null,
            catalog_number: null,
            country: null,
            format: null,
            vinyl_artists: [],
            albums: {
              id: 'alb1',
              title: 'Album 1',
              cover_url: null,
              year: 2000,
              album_artists: [],
            },
          },
          error: null,
        },
      },
    })

    const res = await request(app.getHttpServer()).get('/vinyls/123').expect(200)

    expect(res.body).toHaveProperty('id', '123')
    expect(res.body.album.title).toBe('Album 1')
  })

  it('GET /vinyls/:id → 404 si introuvable', async () => {
    app = await createTestApp({
      supabase: {
        'vinyls:select:single': {
          data: null,
          error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
        },
      },
    })

    await request(app.getHttpServer()).get('/vinyls/does-not-exist').expect(404)
  })
})
