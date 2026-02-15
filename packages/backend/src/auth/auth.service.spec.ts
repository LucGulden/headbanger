import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { SupabaseService } from '../common/database/supabase.service'
import { RedisService } from '../redis/redis.service'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockAuthClient = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  setSession: jest.fn(),
  getUser: jest.fn(),
}

const mockSupabaseClient = {
  auth: mockAuthClient,
}

const mockSupabaseService = {
  getClient: jest.fn(() => mockSupabaseClient),
}

const mockRedisService = {
  getSession: jest.fn(),
  setSession: jest.fn(),
  deleteSession: jest.fn(),
}

const mockJwtService = {
  sign: jest.fn(() => 'jwt-token'),
  verify: jest.fn(),
}

const mockConfigService = {
  get: jest.fn(),
}

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeSupabaseSession = (overrides: object = {}) => ({
  access_token: 'sb-access',
  refresh_token: 'sb-refresh',
  ...overrides,
})

const makeSupabaseUser = (overrides: object = {}) => ({
  id: 'u1',
  email: 'miles@example.com',
  ...overrides,
})

const makeRedisSession = (overrides: object = {}) => ({
  id: 'session-id',
  userId: 'u1',
  supabaseAccessToken: 'sb-access',
  supabaseRefreshToken: 'sb-refresh',
  csrfToken: 'csrf-token',
  createdAt: new Date(),
  lastActivity: new Date(),
  ...overrides,
})

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    jest.clearAllMocks()
    mockJwtService.sign.mockReturnValue('jwt-token')
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  // -----------------------------------------------------------------------
  // signup
  // -----------------------------------------------------------------------

  describe('signup', () => {
    it('lève UnauthorizedException si Supabase échoue', async () => {
      mockAuthClient.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already in use' },
      })

      await expect(service.signup('a@a.com', 'alice', 'pass')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('lève UnauthorizedException si pas de session Supabase', async () => {
      mockAuthClient.signUp.mockResolvedValue({
        data: { user: makeSupabaseUser(), session: null },
        error: null,
      })

      await expect(service.signup('a@a.com', 'alice', 'pass')).rejects.toThrow(
        'No session created after signup',
      )
    })

    it('lève UnauthorizedException si pas de user Supabase', async () => {
      mockAuthClient.signUp.mockResolvedValue({
        data: { user: null, session: makeSupabaseSession() },
        error: null,
      })

      await expect(service.signup('a@a.com', 'alice', 'pass')).rejects.toThrow(
        'No user created after signup',
      )
    })

    it('crée une session Redis avec les tokens Supabase', async () => {
      mockAuthClient.signUp.mockResolvedValue({
        data: { user: makeSupabaseUser(), session: makeSupabaseSession() },
        error: null,
      })

      await service.signup('a@a.com', 'alice', 'pass', '127.0.0.1', 'Firefox')

      expect(mockRedisService.setSession).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: 'u1',
          supabaseAccessToken: 'sb-access',
          supabaseRefreshToken: 'sb-refresh',
          ip: '127.0.0.1',
          userAgent: 'Firefox',
        }),
      )
    })

    it('retourne { jwt, csrfToken, userId }', async () => {
      mockAuthClient.signUp.mockResolvedValue({
        data: { user: makeSupabaseUser(), session: makeSupabaseSession() },
        error: null,
      })

      const result = await service.signup('a@a.com', 'alice', 'pass')

      expect(result.jwt).toBe('jwt-token')
      expect(result.userId).toBe('u1')
      expect(typeof result.csrfToken).toBe('string')
      expect(result.csrfToken).toHaveLength(64) // 32 bytes hex
    })

    it("passe l'username dans les metadata Supabase", async () => {
      mockAuthClient.signUp.mockResolvedValue({
        data: { user: makeSupabaseUser(), session: makeSupabaseSession() },
        error: null,
      })

      await service.signup('a@a.com', 'alice', 'pass')

      expect(mockAuthClient.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { data: { username: 'alice' } },
        }),
      )
    })
  })

  // -----------------------------------------------------------------------
  // login
  // -----------------------------------------------------------------------

  describe('login', () => {
    it('lève UnauthorizedException si Supabase échoue', async () => {
      mockAuthClient.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      await expect(service.login('a@a.com', 'wrong')).rejects.toThrow(UnauthorizedException)
    })

    it('lève UnauthorizedException si pas de session Supabase', async () => {
      mockAuthClient.signInWithPassword.mockResolvedValue({
        data: { user: makeSupabaseUser(), session: null },
        error: null,
      })

      await expect(service.login('a@a.com', 'pass')).rejects.toThrow(
        'No session created after login',
      )
    })

    it('lève UnauthorizedException si pas de user Supabase', async () => {
      mockAuthClient.signInWithPassword.mockResolvedValue({
        data: { user: null, session: makeSupabaseSession() },
        error: null,
      })

      await expect(service.login('a@a.com', 'pass')).rejects.toThrow('No user found after login')
    })

    it('crée une session Redis avec les tokens Supabase', async () => {
      mockAuthClient.signInWithPassword.mockResolvedValue({
        data: { user: makeSupabaseUser(), session: makeSupabaseSession() },
        error: null,
      })

      await service.login('a@a.com', 'pass')

      expect(mockRedisService.setSession).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: 'u1',
          supabaseAccessToken: 'sb-access',
          supabaseRefreshToken: 'sb-refresh',
        }),
      )
    })

    it('retourne { jwt, csrfToken, userId }', async () => {
      mockAuthClient.signInWithPassword.mockResolvedValue({
        data: { user: makeSupabaseUser(), session: makeSupabaseSession() },
        error: null,
      })

      const result = await service.login('a@a.com', 'pass')

      expect(result.jwt).toBe('jwt-token')
      expect(result.userId).toBe('u1')
      expect(typeof result.csrfToken).toBe('string')
    })
  })

  // -----------------------------------------------------------------------
  // logout
  // -----------------------------------------------------------------------

  describe('logout', () => {
    it('supprime la session Redis avec le bon sessionId', async () => {
      mockRedisService.deleteSession.mockResolvedValue(undefined)

      await service.logout('session-id')

      expect(mockRedisService.deleteSession).toHaveBeenCalledWith('session-id')
    })
  })

  // -----------------------------------------------------------------------
  // refresh
  // -----------------------------------------------------------------------

  describe('refresh', () => {
    it('lève UnauthorizedException si la session Redis est introuvable', async () => {
      mockRedisService.getSession.mockResolvedValue(null)

      await expect(service.refresh('session-id')).rejects.toThrow('Invalid session')
    })

    it('lève UnauthorizedException si Supabase setSession échoue', async () => {
      mockRedisService.getSession.mockResolvedValue(makeRedisSession())
      mockAuthClient.setSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Token expired' },
      })

      await expect(service.refresh('session-id')).rejects.toThrow('Token expired')
    })

    it('lève UnauthorizedException si setSession ne retourne pas de session', async () => {
      mockRedisService.getSession.mockResolvedValue(makeRedisSession())
      mockAuthClient.setSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      await expect(service.refresh('session-id')).rejects.toThrow(
        'No session returned from refresh',
      )
    })

    it('met à jour les tokens Supabase dans Redis', async () => {
      mockRedisService.getSession.mockResolvedValue(makeRedisSession())
      mockAuthClient.setSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'sb-access-new',
            refresh_token: 'sb-refresh-new',
          },
        },
        error: null,
      })

      await service.refresh('session-id')

      expect(mockRedisService.setSession).toHaveBeenCalledWith(
        'session-id',
        expect.objectContaining({
          supabaseAccessToken: 'sb-access-new',
          supabaseRefreshToken: 'sb-refresh-new',
        }),
      )
    })

    it('retourne un nouveau JWT', async () => {
      mockRedisService.getSession.mockResolvedValue(makeRedisSession())
      mockAuthClient.setSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'sb-access-new',
            refresh_token: 'sb-refresh-new',
          },
        },
        error: null,
      })

      const result = await service.refresh('session-id')

      expect(mockJwtService.sign).toHaveBeenCalled()
      expect(result).toBe('jwt-token')
    })
  })

  // -----------------------------------------------------------------------
  // getUserFromSession
  // -----------------------------------------------------------------------

  describe('getUserFromSession', () => {
    it('lève UnauthorizedException si la session Redis est introuvable', async () => {
      mockRedisService.getSession.mockResolvedValue(null)

      await expect(service.getUserFromSession('session-id')).rejects.toThrow('Invalid session')
    })

    it('lève UnauthorizedException si Supabase getUser échoue', async () => {
      mockRedisService.getSession.mockResolvedValue(makeRedisSession())
      mockAuthClient.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token invalid' },
      })

      await expect(service.getUserFromSession('session-id')).rejects.toThrow('Failed to get user')
    })

    it('lève UnauthorizedException si user est null', async () => {
      mockRedisService.getSession.mockResolvedValue(makeRedisSession())
      mockAuthClient.getUser.mockResolvedValue({ data: { user: null }, error: null })

      await expect(service.getUserFromSession('session-id')).rejects.toThrow('Failed to get user')
    })

    it('retourne { id, email } du user', async () => {
      mockRedisService.getSession.mockResolvedValue(makeRedisSession())
      mockAuthClient.getUser.mockResolvedValue({
        data: { user: { id: 'u1', email: 'miles@example.com' } },
        error: null,
      })

      const result = await service.getUserFromSession('session-id')

      expect(result).toEqual({ id: 'u1', email: 'miles@example.com' })
    })

    it('appelle getUser avec le token Supabase de la session', async () => {
      mockRedisService.getSession.mockResolvedValue(
        makeRedisSession({ supabaseAccessToken: 'sb-access' }),
      )
      mockAuthClient.getUser.mockResolvedValue({
        data: { user: makeSupabaseUser() },
        error: null,
      })

      await service.getUserFromSession('session-id')

      expect(mockAuthClient.getUser).toHaveBeenCalledWith('sb-access')
    })
  })

  // -----------------------------------------------------------------------
  // validateSession
  // -----------------------------------------------------------------------

  describe('validateSession', () => {
    it('retourne null si le JWT est invalide (verify lève une erreur)', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token')
      })

      const result = await service.validateSession('bad-token')

      expect(result).toBeNull()
    })

    it('retourne null si le payload ne contient pas sessionId', async () => {
      mockJwtService.verify.mockReturnValue({ userId: 'u1' }) // pas de sessionId

      const result = await service.validateSession('token')

      expect(result).toBeNull()
    })

    it('retourne null si la session Redis est introuvable', async () => {
      mockJwtService.verify.mockReturnValue({ sessionId: 'session-id', userId: 'u1' })
      mockRedisService.getSession.mockResolvedValue(null)

      const result = await service.validateSession('token')

      expect(result).toBeNull()
    })

    it('met à jour lastActivity et sauvegarde la session', async () => {
      const session = makeRedisSession()
      mockJwtService.verify.mockReturnValue({ sessionId: 'session-id', userId: 'u1' })
      mockRedisService.getSession.mockResolvedValue(session)

      await service.validateSession('token')

      expect(mockRedisService.setSession).toHaveBeenCalledWith(
        'session-id',
        expect.objectContaining({ userId: 'u1' }),
      )
    })

    it('retourne la session si tout est valide', async () => {
      const session = makeRedisSession()
      mockJwtService.verify.mockReturnValue({ sessionId: 'session-id', userId: 'u1' })
      mockRedisService.getSession.mockResolvedValue(session)

      const result = await service.validateSession('token')

      expect(result).toMatchObject({ userId: 'u1' })
    })
  })
})
