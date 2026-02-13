import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { RefreshGuard } from './refresh.guard'
import { RedisService } from '../../redis/redis.service'
import type { FastifyRequest } from 'fastify'

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

const makeRequest = (cookie?: string): Partial<FastifyRequest> => ({
  headers: { cookie },
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
  decode: jest.fn(),
}

const mockRedisService = {
  getSession: jest.fn(),
}

const mockConfigService = {
  get: jest.fn(() => 'test-secret'),
}

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('RefreshGuard', () => {
  let guard: RefreshGuard

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    guard = module.get<RefreshGuard>(RefreshGuard)
  })

  it('lève UnauthorizedException si cookie auth_token absent', async () => {
    const ctx = makeContext(makeRequest(undefined))

    await expect(guard.canActivate(ctx)).rejects.toThrow('No refresh token provided')
  })

  it('lève UnauthorizedException si decode retourne null', async () => {
    const ctx = makeContext(makeRequest('auth_token=bad'))
    mockJwtService.decode.mockReturnValue(null)

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('lève UnauthorizedException si payload sans sessionId', async () => {
    const ctx = makeContext(makeRequest('auth_token=token'))
    mockJwtService.decode.mockReturnValue({ userId: 'u1' }) // pas de sessionId

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('lève UnauthorizedException si session Redis introuvable', async () => {
    const ctx = makeContext(makeRequest('auth_token=token'))
    mockJwtService.decode.mockReturnValue({ sessionId: 'session-id', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(null)

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('utilise decode (pas verifyAsync) — supporte les tokens expirés', async () => {
    const request = makeRequest('auth_token=expired-token')
    const ctx = makeContext(request)
    mockJwtService.decode.mockReturnValue({ sessionId: 'session-id', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(makeSession())

    await guard.canActivate(ctx)

    // decode doit être appelé, verifyAsync ne doit PAS exister sur le mock
    expect(mockJwtService.decode).toHaveBeenCalledWith('expired-token')
  })

  it('attache la session à la requête', async () => {
    const request = makeRequest('auth_token=token')
    const ctx = makeContext(request)
    const session = makeSession()
    mockJwtService.decode.mockReturnValue({ sessionId: 'session-id', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(session)

    await guard.canActivate(ctx)

    expect(request['session']).toEqual(session)
  })

  it('retourne true si token décodable et session valide', async () => {
    const ctx = makeContext(makeRequest('auth_token=token'))
    mockJwtService.decode.mockReturnValue({ sessionId: 'session-id', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(makeSession())

    const result = await guard.canActivate(ctx)

    expect(result).toBe(true)
  })

  it('extrait le bon token parmi plusieurs cookies', async () => {
    const ctx = makeContext(makeRequest('session=xyz; auth_token=real-token'))
    mockJwtService.decode.mockReturnValue({ sessionId: 'session-id', userId: 'u1' })
    mockRedisService.getSession.mockResolvedValue(makeSession())

    await guard.canActivate(ctx)

    expect(mockJwtService.decode).toHaveBeenCalledWith('real-token')
  })
})
