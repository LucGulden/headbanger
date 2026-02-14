import { ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { FastifyAdapter } from '@nestjs/platform-fastify'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'

import { AppModule } from '../../src/app.module'
import { SupabaseService } from '../../src/common/database/supabase.service'
import { RedisService } from '../../src/redis/redis.service'
import fastifyCookie from '@fastify/cookie'

// ─── IDs de test ────────────────────────────────────────────────────────────
const TEST_USER_ID = 'test-user-id-00000000-0000-0000-0000-000000000001'
const TEST_SESSION_ID = 'test-session-id-00000000-0000-0000-0000-000000000001'
const TEST_EMAIL = 'test@headbanger.com'
const TEST_USERNAME = 'testuser'
const TEST_PASSWORD = 'Password123!'

// ─── Fixtures Supabase Auth ──────────────────────────────────────────────────
const supabaseUserFixture = {
  id: TEST_USER_ID,
  email: TEST_EMAIL,
  user_metadata: { username: TEST_USERNAME },
}

const supabaseSessionFixture = {
  access_token: 'sb-access-token',
  refresh_token: 'sb-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: supabaseUserFixture,
}

// ─── Mock Supabase Auth ──────────────────────────────────────────────────────
const mockAuthMethods = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  setSession: jest.fn(),
}

const mockSupabaseService: Partial<SupabaseService> = {
  getClient: jest.fn().mockReturnValue({
    auth: mockAuthMethods,
    from: jest.fn(),
  }),
  getClientWithAuth: jest.fn().mockReturnValue({
    auth: mockAuthMethods,
    from: jest.fn(),
  }),
}

// ─── Mock Redis ──────────────────────────────────────────────────────────────
const redisSessionStore = new Map<string, object>()

const mockRedisService: Partial<RedisService> = {
  getSession: jest
    .fn()
    .mockImplementation((id: string) => Promise.resolve(redisSessionStore.get(id) ?? null)),
  setSession: jest.fn().mockImplementation((id: string, session: object) => {
    redisSessionStore.set(id, session)
    return Promise.resolve()
  }),
  deleteSession: jest.fn().mockImplementation((id: string) => {
    redisSessionStore.delete(id)
    return Promise.resolve()
  }),
  updateLastActivity: jest.fn().mockResolvedValue(undefined),
}

// ─── Session Redis de test ────────────────────────────────────────────────────
const testRedisSession = {
  id: TEST_SESSION_ID,
  userId: TEST_USER_ID,
  supabaseAccessToken: 'sb-access-token',
  supabaseRefreshToken: 'sb-refresh-token',
  csrfToken: 'test-csrf-token',
  createdAt: new Date(),
  lastActivity: new Date(),
}

// ─── Suite ───────────────────────────────────────────────────────────────────
describe('Auth (e2e)', () => {
  let app: NestFastifyApplication
  let jwtService: JwtService

  // NOTE : on n'utilise PAS createTestApp — les guards sont réels.
  // Seuls SupabaseService et RedisService sont mockés.
  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
    app.useLogger(false) // ← ajouter cette ligne
    await app.register(fastifyCookie as never)

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

    await app.init()
    await app.getHttpAdapter().getInstance().ready()

    jwtService = moduleRef.get<JwtService>(JwtService)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    redisSessionStore.clear()
    // Remettre les implémentations qui utilisent le store
    ;(mockRedisService.getSession as jest.Mock).mockImplementation((id: string) =>
      Promise.resolve(redisSessionStore.get(id) ?? null),
    )
    ;(mockRedisService.setSession as jest.Mock).mockImplementation(
      (id: string, session: object) => {
        redisSessionStore.set(id, session)
        return Promise.resolve()
      },
    )
  })

  // ─── Helper : crée un JWT valide pour les tests ───────────────────────────
  const createValidCookie = (): string => {
    const token = jwtService.sign({
      sessionId: TEST_SESSION_ID,
      userId: TEST_USER_ID,
    })
    return `auth_token=${token}`
  }

  // ─── Helper : pré-charge une session Redis ───────────────────────────────
  const seedSession = (): void => {
    redisSessionStore.set(TEST_SESSION_ID, testRedisSession)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/signup
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /auth/signup', () => {
    it('201 → crée un utilisateur et retourne auth_token en cookie httpOnly', async () => {
      mockAuthMethods.signUp.mockResolvedValue({
        data: { user: supabaseUserFixture, session: supabaseSessionFixture },
        error: null,
      })

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id', TEST_USER_ID)

      const cookies: string[] = (res.headers['set-cookie'] as unknown as string[]) ?? []
      expect(cookies.some((c) => c.startsWith('auth_token='))).toBe(true)
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true)
      expect(cookies.some((c) => c.startsWith('csrf_token='))).toBe(true)
    })

    it('401 → Supabase renvoie une erreur (email déjà utilisé)', async () => {
      mockAuthMethods.signUp.mockResolvedValue({
        data: {},
        error: { message: 'User already registered' },
      })

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD })

      expect(res.status).toBe(401)
    })

    it('401 → Supabase ne renvoie pas de session', async () => {
      mockAuthMethods.signUp.mockResolvedValue({
        data: { user: supabaseUserFixture, session: null },
        error: null,
      })

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD })

      expect(res.status).toBe(401)
    })

    it('400 → email invalide', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'not-an-email', username: TEST_USERNAME, password: TEST_PASSWORD })

      expect(res.status).toBe(400)
    })

    it('400 → mot de passe trop court (< 8 caractères)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: TEST_EMAIL, username: TEST_USERNAME, password: 'short' })

      expect(res.status).toBe(400)
    })

    it('400 → body vide', async () => {
      const res = await request(app.getHttpServer()).post('/auth/signup').send({})

      expect(res.status).toBe(400)
    })

    it('401 → Supabase renvoie session mais pas de user (ligne 49)', async () => {
      mockAuthMethods.signUp.mockResolvedValue({
        data: { user: null, session: supabaseSessionFixture },
        error: null,
      })

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: TEST_EMAIL, username: TEST_USERNAME, password: TEST_PASSWORD })

      expect(res.status).toBe(401)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/login
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /auth/login', () => {
    it('200 → credentials valides → auth_token httpOnly + csrf_token', async () => {
      mockAuthMethods.signInWithPassword.mockResolvedValue({
        data: { user: supabaseUserFixture, session: supabaseSessionFixture },
        error: null,
      })

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', TEST_USER_ID)

      const cookies: string[] = (res.headers['set-cookie'] as unknown as string[]) ?? []
      expect(cookies.some((c) => c.startsWith('auth_token='))).toBe(true)
      // auth_token doit être httpOnly
      const authCookie = cookies.find((c) => c.startsWith('auth_token='))!
      expect(authCookie).toContain('HttpOnly')
      // csrf_token ne doit PAS être httpOnly (lisible par le JS frontend)
      const csrfCookie = cookies.find((c) => c.startsWith('csrf_token='))!
      expect(csrfCookie).toBeDefined()
      expect(csrfCookie).not.toContain('HttpOnly')
    })

    it('401 → credentials invalides', async () => {
      mockAuthMethods.signInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' },
      })

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: 'wrongpassword' })

      expect(res.status).toBe(401)
    })

    it('401 → Supabase ne renvoie pas de session', async () => {
      mockAuthMethods.signInWithPassword.mockResolvedValue({
        data: { user: supabaseUserFixture, session: null },
        error: null,
      })

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

      expect(res.status).toBe(401)
    })

    it('400 → mot de passe manquant', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email: TEST_EMAIL })

      expect(res.status).toBe(400)
    })

    it('400 → email invalide', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'bad-email', password: TEST_PASSWORD })

      expect(res.status).toBe(400)
    })

    it('401 → Supabase renvoie session mais pas de user (ligne 81)', async () => {
      mockAuthMethods.signInWithPassword.mockResolvedValue({
        data: { user: null, session: supabaseSessionFixture },
        error: null,
      })

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })

      expect(res.status).toBe(401)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/logout
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /auth/logout', () => {
    it('200 → supprime la session Redis et efface les cookies', async () => {
      seedSession()
      const cookie = createValidCookie()

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookie)
        .set('x-csrf-token', testRedisSession.csrfToken)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true })
      expect(mockRedisService.deleteSession).toHaveBeenCalledWith(TEST_SESSION_ID)

      // Les cookies doivent être vidés (Max-Age=0 ou Expires dans le passé)
      const cookies: string[] = (res.headers['set-cookie'] as unknown as string[]) ?? []
      const authCookieCleared = cookies.some(
        (c) => c.startsWith('auth_token=;') || c.includes('auth_token=; Max-Age=0'),
      )
      expect(authCookieCleared).toBe(true)
    })

    it('401 → pas de cookie', async () => {
      const res = await request(app.getHttpServer()).post('/auth/logout')
      expect(res.status).toBe(401)
    })

    it('401 → cookie présent mais session introuvable dans Redis', async () => {
      // redisSessionStore est vide → getSession renvoie null
      const cookie = createValidCookie()

      const res = await request(app.getHttpServer()).post('/auth/logout').set('Cookie', cookie)

      expect(res.status).toBe(401)
    })

    it('401 → JWT malformé', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', 'auth_token=not.a.jwt.token')

      expect(res.status).toBe(401)
    })

    it('403 → cookie valide, session active, mais header x-csrf-token absent', async () => {
      seedSession()
      const cookie = createValidCookie()

      const res = await request(app.getHttpServer()).post('/auth/logout').set('Cookie', cookie)

      expect(res.status).toBe(403)
    })

    it('403 → cookie valide, session active, mais x-csrf-token invalide', async () => {
      seedSession()
      const cookie = createValidCookie()

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookie)
        .set('x-csrf-token', 'wrong-csrf-token')

      expect(res.status).toBe(403)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /auth/me
  // ═══════════════════════════════════════════════════════════════════════════
  describe('GET /auth/me', () => {
    it('200 → retourne { id } avec un cookie valide et session active', async () => {
      seedSession()
      const cookie = createValidCookie()

      const res = await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', TEST_USER_ID)
    })

    it('401 → aucun cookie', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me')
      expect(res.status).toBe(401)
    })

    it('401 → cookie valide mais session expirée (introuvable dans Redis)', async () => {
      // redisSessionStore vide : getSession retourne null
      const cookie = createValidCookie()

      const res = await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie)

      expect(res.status).toBe(401)
    })

    it('401 → JWT invalide (mauvaise signature)', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', 'auth_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.fakesig')

      expect(res.status).toBe(401)
    })

    it('401 → JWT expiré', async () => {
      // Signe un token déjà expiré
      const expiredToken = jwtService.sign(
        { sessionId: TEST_SESSION_ID, userId: TEST_USER_ID },
        { expiresIn: -1 },
      )

      seedSession()

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `auth_token=${expiredToken}`)

      expect(res.status).toBe(401)
    })

    it('200 → met à jour lastActivity après une requête valide', async () => {
      seedSession()
      const cookie = createValidCookie()

      await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie)

      expect(mockRedisService.updateLastActivity).toHaveBeenCalledWith(TEST_SESSION_ID)
    })

    it('401 → JWT valide mais payload sans sessionId (branche auth.guard ligne 49)', async () => {
      // Token correctement signé mais sans les champs attendus
      const badToken = jwtService.sign({ foo: 'bar' })

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `auth_token=${badToken}`)

      expect(res.status).toBe(401)
    })

    it('200 → updateLastActivity qui échoue ne bloque pas la réponse (catch ligne 66)', async () => {
      seedSession()
      const cookie = createValidCookie()
      ;(mockRedisService.updateLastActivity as jest.Mock).mockRejectedValueOnce(
        new Error('Redis down'),
      )

      const res = await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', TEST_USER_ID)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/refresh
  // ═══════════════════════════════════════════════════════════════════════════
  describe('POST /auth/refresh', () => {
    it('200 → session valide → nouveau auth_token en cookie', async () => {
      seedSession()
      const cookie = createValidCookie()

      mockAuthMethods.setSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'new-sb-access-token',
            refresh_token: 'new-sb-refresh-token',
          },
        },
        error: null,
      })

      const res = await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true })

      // Un nouveau cookie auth_token doit être posé
      const cookies: string[] = (res.headers['set-cookie'] as unknown as string[]) ?? []
      expect(cookies.some((c) => c.startsWith('auth_token='))).toBe(true)
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true)
    })

    it('200 → JWT expiré accepté par RefreshGuard (decode sans vérif expiry)', async () => {
      seedSession()

      // Token expiré : RefreshGuard utilise jwtService.decode(), pas verify()
      const expiredToken = jwtService.sign(
        { sessionId: TEST_SESSION_ID, userId: TEST_USER_ID },
        { expiresIn: -1 },
      )

      mockAuthMethods.setSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'new-sb-access-token',
            refresh_token: 'new-sb-refresh-token',
          },
        },
        error: null,
      })

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `auth_token=${expiredToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ success: true })
    })

    it('401 → pas de cookie', async () => {
      const res = await request(app.getHttpServer()).post('/auth/refresh')
      expect(res.status).toBe(401)
    })

    it('401 → token malformé (decode échoue)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'auth_token=not.a.valid.jwt')

      expect(res.status).toBe(401)
    })

    it('401 → session introuvable dans Redis', async () => {
      // redisSessionStore vide → getSession retourne null
      const cookie = createValidCookie()

      const res = await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', cookie)

      expect(res.status).toBe(401)
    })

    it('401 → Supabase setSession retourne une erreur', async () => {
      seedSession()
      const cookie = createValidCookie()

      mockAuthMethods.setSession.mockResolvedValue({
        data: {},
        error: { message: 'Token expired' },
      })

      const res = await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', cookie)

      expect(res.status).toBe(401)
    })

    it('401 → Supabase setSession ne retourne pas de session', async () => {
      seedSession()
      const cookie = createValidCookie()

      mockAuthMethods.setSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const res = await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', cookie)

      expect(res.status).toBe(401)
    })
  })
})
