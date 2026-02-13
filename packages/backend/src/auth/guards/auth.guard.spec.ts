import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthGuard } from './auth.guard'
import { RedisService } from '../../redis/redis.service'
import type { FastifyRequest } from 'fastify'

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

const makeRequest = (cookie?: string, extra: object = {}): Partial<FastifyRequest> => ({
  headers: { cookie },
  ...extra,
})

const makeContext = (request: Partial<FastifyRequest>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext

const makeSession = (overrides: object = {}) => ({
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
// Mocks
// -------------------------------------------------------------------------

const mockJwtService = {
  verifyAsync: jest.fn(),
}

const mockRedisService = {
  getSession: jest.fn(),
  updateLastActivity: jest.fn(),
}

const mockConfigService = {
  get: jest.fn(() => 'test-secret'),
}

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('AuthGuard', () => {
  let guard: AuthGuard

  beforeEach(async () => {
    jest.clearAllMocks()
    mockRedisService.updateLastActivity.mockResolvedValue(undefined)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    guard = module.get<AuthGuard>(AuthGuard)
  })

  it('lève UnauthorizedException si cookie auth_token absent', async () => {
    const ctx = makeContext(makeRequest(undefined))

    await expect(guard.canActivate(ctx)).rejects.toThrow('No authentication token provided')
  })

  it('lève UnauthorizedException si le cookie header est vide', async () => {
    const ctx = makeContext(makeRequest('other_cookie=abc'))
    mockJwtService.verifyAsync.mockRejectedValue(new Error('no token'))

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('lève UnauthorizedException si verifyAsync échoue', async () => {
    const ctx = makeContext(makeRequest('auth_token=bad'))
    mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'))

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('lève UnauthorizedException si session Redis introuvable', async () => {
    const ctx = makeContext(makeRequest('auth_token=valid'))
    mockJwtService.verifyAsync.mockResolvedValue({ sessionId: 'sid', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(null)

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('attache user, session et token à la requête si valide', async () => {
    const request = makeRequest('auth_token=valid')
    const ctx = makeContext(request)
    const session = makeSession()
    mockJwtService.verifyAsync.mockResolvedValue({ sessionId: 'session-id', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(session)

    await guard.canActivate(ctx)

    expect(request['user']).toEqual({ id: 'u1' })
    expect(request['session']).toEqual(session)
    expect(request['token']).toBe('sb-access')
  })

  it('retourne true si le token et la session sont valides', async () => {
    const ctx = makeContext(makeRequest('auth_token=valid'))
    mockJwtService.verifyAsync.mockResolvedValue({ sessionId: 'session-id', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(makeSession())

    const result = await guard.canActivate(ctx)

    expect(result).toBe(true)
  })

  it('appelle updateLastActivity de façon non bloquante', async () => {
    const ctx = makeContext(makeRequest('auth_token=valid'))
    mockJwtService.verifyAsync.mockResolvedValue({ sessionId: 'session-id', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(makeSession())

    await guard.canActivate(ctx)

    expect(mockRedisService.updateLastActivity).toHaveBeenCalledWith('session-id')
  })

  it('extrait le bon token parmi plusieurs cookies', async () => {
    const ctx = makeContext(makeRequest('session=xyz; auth_token=real-token; other=abc'))
    mockJwtService.verifyAsync.mockResolvedValue({ sessionId: 'session-id', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(makeSession())

    await guard.canActivate(ctx)

    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
      'real-token',
      expect.objectContaining({ secret: 'test-secret' }),
    )
  })
})
