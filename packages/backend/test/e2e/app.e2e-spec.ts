import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createAppWithSupabaseMock } from '../utils/create-app-with-mocks'

describe('AppController (e2e)', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  it('GET /health → status ok', async () => {
    // pas besoin de mock spécifique
    app = await createAppWithSupabaseMock({})

    const res = await request(app.getHttpServer()).get('/health').expect(200)

    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('timestamp')
  })
})
