import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthGuard } from './guards/auth.guard'
import { RefreshGuard } from './guards/refresh.guard'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Session, AuthenticatedUser } from '../common/database/database.types'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockAuthService = {
  signup: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refresh: jest.fn(),
}

// Fastify reply mock — setCookie, clearCookie, send sont toutes chainables
const makeMockReply = () => ({
  setCookie: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
})

const makeMockRequest = (overrides: object = {}): Partial<FastifyRequest> => ({
  ip: '127.0.0.1',
  headers: { 'user-agent': 'Jest/1.0' },
  ...overrides,
})

const makeSession = (): Session =>
  ({
    id: 'session-id',
    userId: 'u1',
    supabaseAccessToken: 'sb-access',
    supabaseRefreshToken: 'sb-refresh',
    csrfToken: 'csrf-token',
    createdAt: new Date(),
    lastActivity: new Date(),
  }) as Session

const mockUser: AuthenticatedUser = { id: 'u1' } as AuthenticatedUser

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RefreshGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<AuthController>(AuthController)
  })

  // -----------------------------------------------------------------------
  // signup
  // -----------------------------------------------------------------------

  describe('signup', () => {
    const signupDto = { email: 'a@a.com', username: 'alice', password: 'pass' }

    it('appelle authService.signup avec email, username, password, ip et userAgent', async () => {
      mockAuthService.signup.mockResolvedValue({ jwt: 'jwt', csrfToken: 'csrf', userId: 'u1' })
      const reply = makeMockReply()
      const request = makeMockRequest()

      await controller.signup(
        signupDto as never,
        request as FastifyRequest,
        reply as unknown as FastifyReply,
      )

      expect(mockAuthService.signup).toHaveBeenCalledWith(
        'a@a.com',
        'alice',
        'pass',
        '127.0.0.1',
        'Jest/1.0',
      )
    })

    it('pose le cookie auth_token httpOnly', async () => {
      mockAuthService.signup.mockResolvedValue({
        jwt: 'jwt-token',
        csrfToken: 'csrf',
        userId: 'u1',
      })
      const reply = makeMockReply()

      await controller.signup(
        signupDto as never,
        makeMockRequest() as FastifyRequest,
        reply as unknown as FastifyReply,
      )

      expect(reply.setCookie).toHaveBeenCalledWith(
        'auth_token',
        'jwt-token',
        expect.objectContaining({ httpOnly: true, maxAge: 15 * 60 }),
      )
    })

    it('pose le cookie csrf_token non httpOnly', async () => {
      mockAuthService.signup.mockResolvedValue({ jwt: 'jwt', csrfToken: 'csrf-val', userId: 'u1' })
      const reply = makeMockReply()

      await controller.signup(
        signupDto as never,
        makeMockRequest() as FastifyRequest,
        reply as unknown as FastifyReply,
      )

      expect(reply.setCookie).toHaveBeenCalledWith(
        'csrf_token',
        'csrf-val',
        expect.objectContaining({ httpOnly: false, maxAge: 24 * 60 * 60 }),
      )
    })

    it('retourne { id: userId } via reply.send', async () => {
      mockAuthService.signup.mockResolvedValue({ jwt: 'jwt', csrfToken: 'csrf', userId: 'u1' })
      const reply = makeMockReply()

      await controller.signup(
        signupDto as never,
        makeMockRequest() as FastifyRequest,
        reply as unknown as FastifyReply,
      )

      expect(reply.send).toHaveBeenCalledWith({ id: 'u1' })
    })
  })

  // -----------------------------------------------------------------------
  // login
  // -----------------------------------------------------------------------

  describe('login', () => {
    const loginDto = { email: 'a@a.com', password: 'pass' }

    it('appelle authService.login avec email, password, ip et userAgent', async () => {
      mockAuthService.login.mockResolvedValue({ jwt: 'jwt', csrfToken: 'csrf', userId: 'u1' })
      const reply = makeMockReply()

      await controller.login(
        loginDto as never,
        makeMockRequest() as FastifyRequest,
        reply as unknown as FastifyReply,
      )

      expect(mockAuthService.login).toHaveBeenCalledWith('a@a.com', 'pass', '127.0.0.1', 'Jest/1.0')
    })

    it('pose le cookie auth_token httpOnly', async () => {
      mockAuthService.login.mockResolvedValue({ jwt: 'jwt-token', csrfToken: 'csrf', userId: 'u1' })
      const reply = makeMockReply()

      await controller.login(
        loginDto as never,
        makeMockRequest() as FastifyRequest,
        reply as unknown as FastifyReply,
      )

      expect(reply.setCookie).toHaveBeenCalledWith(
        'auth_token',
        'jwt-token',
        expect.objectContaining({ httpOnly: true }),
      )
    })

    it('pose le cookie csrf_token non httpOnly', async () => {
      mockAuthService.login.mockResolvedValue({ jwt: 'jwt', csrfToken: 'csrf-val', userId: 'u1' })
      const reply = makeMockReply()

      await controller.login(
        loginDto as never,
        makeMockRequest() as FastifyRequest,
        reply as unknown as FastifyReply,
      )

      expect(reply.setCookie).toHaveBeenCalledWith(
        'csrf_token',
        'csrf-val',
        expect.objectContaining({ httpOnly: false }),
      )
    })

    it('retourne { id: userId } via reply.send', async () => {
      mockAuthService.login.mockResolvedValue({ jwt: 'jwt', csrfToken: 'csrf', userId: 'u1' })
      const reply = makeMockReply()

      await controller.login(
        loginDto as never,
        makeMockRequest() as FastifyRequest,
        reply as unknown as FastifyReply,
      )

      expect(reply.send).toHaveBeenCalledWith({ id: 'u1' })
    })
  })

  // -----------------------------------------------------------------------
  // logout
  // -----------------------------------------------------------------------

  describe('logout', () => {
    it('appelle authService.logout avec le sessionId', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)
      const reply = makeMockReply()

      await controller.logout(makeSession(), reply as unknown as FastifyReply)

      expect(mockAuthService.logout).toHaveBeenCalledWith('session-id')
    })

    it('efface les cookies auth_token et csrf_token', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)
      const reply = makeMockReply()

      await controller.logout(makeSession(), reply as unknown as FastifyReply)

      expect(reply.clearCookie).toHaveBeenCalledWith(
        'auth_token',
        expect.objectContaining({ path: '/' }),
      )
      expect(reply.clearCookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.objectContaining({ path: '/' }),
      )
    })

    it('retourne { success: true } via reply.send', async () => {
      mockAuthService.logout.mockResolvedValue(undefined)
      const reply = makeMockReply()

      await controller.logout(makeSession(), reply as unknown as FastifyReply)

      expect(reply.send).toHaveBeenCalledWith({ success: true })
    })
  })

  // -----------------------------------------------------------------------
  // me
  // -----------------------------------------------------------------------

  describe('me', () => {
    it('retourne { id } du user courant', async () => {
      const result = await controller.me(mockUser)

      expect(result).toEqual({ id: 'u1' })
    })
  })

  // -----------------------------------------------------------------------
  // refresh
  // -----------------------------------------------------------------------

  describe('refresh', () => {
    it('appelle authService.refresh avec le sessionId', async () => {
      mockAuthService.refresh.mockResolvedValue('new-jwt')
      const reply = makeMockReply()

      await controller.refresh(makeSession(), reply as unknown as FastifyReply)

      expect(mockAuthService.refresh).toHaveBeenCalledWith('session-id')
    })

    it('pose un nouveau cookie auth_token httpOnly', async () => {
      mockAuthService.refresh.mockResolvedValue('new-jwt')
      const reply = makeMockReply()

      await controller.refresh(makeSession(), reply as unknown as FastifyReply)

      expect(reply.setCookie).toHaveBeenCalledWith(
        'auth_token',
        'new-jwt',
        expect.objectContaining({ httpOnly: true, maxAge: 15 * 60 }),
      )
    })

    it('retourne { success: true } via reply.send', async () => {
      mockAuthService.refresh.mockResolvedValue('new-jwt')
      const reply = makeMockReply()

      await controller.refresh(makeSession(), reply as unknown as FastifyReply)

      expect(reply.send).toHaveBeenCalledWith({ success: true })
    })
  })
})
