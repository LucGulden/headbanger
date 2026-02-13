import { Test, TestingModule } from '@nestjs/testing'
import { Logger } from '@nestjs/common'
import { WebsocketsGateway } from './websockets.gateway'
import { EventsService } from '../events/events.service'
import { AuthService } from '../auth/auth.service'
import type { Socket } from 'socket.io'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockEventsService = {
  setServer: jest.fn(),
}

const mockAuthService = {
  validateSession: jest.fn(),
}

// -------------------------------------------------------------------------
// Socket factory
// -------------------------------------------------------------------------

const makeSocket = (
  cookieHeader?: string,
): jest.Mocked<Partial<Socket>> & { data: Record<string, unknown> } => ({
  id: 'socket1',
  handshake: {
    headers: { cookie: cookieHeader },
  } as Socket['handshake'],
  data: {},
  disconnect: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
})

const makeSession = (overrides: object = {}) => ({
  id: 'session-id',
  userId: 'u1',
  supabaseAccessToken: 'sb-access',
  supabaseRefreshToken: 'sb-refresh',
  csrfToken: 'csrf',
  createdAt: new Date(),
  lastActivity: new Date(),
  ...overrides,
})

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('WebsocketsGateway', () => {
  let gateway: WebsocketsGateway

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketsGateway,
        { provide: EventsService, useValue: mockEventsService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile()

    gateway = module.get<WebsocketsGateway>(WebsocketsGateway)
  })

  // -----------------------------------------------------------------------
  // afterInit
  // -----------------------------------------------------------------------

  describe('afterInit', () => {
    it('injecte le server dans EventsService', () => {
      const mockServer = { to: jest.fn() }

      gateway.afterInit(mockServer as never)

      expect(mockEventsService.setServer).toHaveBeenCalledWith(mockServer)
    })
  })

  // -----------------------------------------------------------------------
  // handleConnection
  // -----------------------------------------------------------------------

  describe('handleConnection', () => {
    it('déconnecte si le header cookie est absent', async () => {
      const client = makeSocket(undefined)

      await gateway.handleConnection(client as unknown as Socket)

      expect(client.disconnect).toHaveBeenCalled()
    })

    it('déconnecte si auth_token est absent des cookies', async () => {
      const client = makeSocket('other_cookie=abc')

      await gateway.handleConnection(client as unknown as Socket)

      expect(client.disconnect).toHaveBeenCalled()
    })

    it('déconnecte si la session est invalide', async () => {
      const client = makeSocket('auth_token=bad-token')
      mockAuthService.validateSession.mockResolvedValue(null)

      await gateway.handleConnection(client as unknown as Socket)

      expect(client.disconnect).toHaveBeenCalled()
    })

    it('rejoint la room user:{userId} si la session est valide', async () => {
      const client = makeSocket('auth_token=valid-token')
      mockAuthService.validateSession.mockResolvedValue(makeSession({ userId: 'u1' }))

      await gateway.handleConnection(client as unknown as Socket)

      expect(client.join).toHaveBeenCalledWith('user:u1')
    })

    it('stocke userId dans client.data', async () => {
      const client = makeSocket('auth_token=valid-token')
      mockAuthService.validateSession.mockResolvedValue(makeSession({ userId: 'u1' }))

      await gateway.handleConnection(client as unknown as Socket)

      expect(client.data.userId).toBe('u1')
    })

    it('extrait le bon token parmi plusieurs cookies', async () => {
      const client = makeSocket('session=xyz; auth_token=real-token; other=abc')
      mockAuthService.validateSession.mockResolvedValue(makeSession())

      await gateway.handleConnection(client as unknown as Socket)

      expect(mockAuthService.validateSession).toHaveBeenCalledWith('real-token')
    })

    it('déconnecte si validateSession lève une exception', async () => {
      const client = makeSocket('auth_token=valid-token')
      mockAuthService.validateSession.mockRejectedValue(new Error('redis down'))

      await gateway.handleConnection(client as unknown as Socket)

      expect(client.disconnect).toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // handleDisconnect
  // -----------------------------------------------------------------------

  describe('handleDisconnect', () => {
    it("ne lève pas d'erreur si client.data.userId est absent", () => {
      const client = makeSocket()

      expect(() => gateway.handleDisconnect(client as unknown as Socket)).not.toThrow()
    })

    it("ne lève pas d'erreur si client.data.userId est présent", () => {
      const client = makeSocket()
      client.data.userId = 'u1'

      expect(() => gateway.handleDisconnect(client as unknown as Socket)).not.toThrow()
    })
  })

  // -----------------------------------------------------------------------
  // handleJoinRoom
  // -----------------------------------------------------------------------

  describe('handleJoinRoom', () => {
    it('rejoint la room du dto', () => {
      const client = makeSocket()
      client.data.userId = 'u1'

      gateway.handleJoinRoom({ roomId: 'room:p1' }, client as unknown as Socket)

      expect(client.join).toHaveBeenCalledWith('room:p1')
    })

    it('retourne { success: true, room }', () => {
      const client = makeSocket()

      const result = gateway.handleJoinRoom({ roomId: 'room:p1' }, client as unknown as Socket)

      expect(result).toEqual({ success: true, room: 'room:p1' })
    })
  })

  // -----------------------------------------------------------------------
  // handleLeaveRoom
  // -----------------------------------------------------------------------

  describe('handleLeaveRoom', () => {
    it('quitte la room du dto', () => {
      const client = makeSocket()
      client.data.userId = 'u1'

      gateway.handleLeaveRoom({ roomId: 'room:p1' }, client as unknown as Socket)

      expect(client.leave).toHaveBeenCalledWith('room:p1')
    })

    it('retourne { success: true, room }', () => {
      const client = makeSocket()

      const result = gateway.handleLeaveRoom({ roomId: 'room:p1' }, client as unknown as Socket)

      expect(result).toEqual({ success: true, room: 'room:p1' })
    })
  })
})
