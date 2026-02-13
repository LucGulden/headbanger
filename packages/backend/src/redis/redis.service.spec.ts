import { Test, TestingModule } from '@nestjs/testing'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisService } from './redis.service'

// -------------------------------------------------------------------------
// Mock ioredis
// ioredis est instancié dans onModuleInit via new Redis({...}).
// On mock le module entier pour capturer les appels sur le client.
// -------------------------------------------------------------------------

const mockRedisClient = {
  ping: jest.fn().mockResolvedValue('PONG'),
  on: jest.fn(),
  quit: jest.fn().mockResolvedValue(undefined),
  setex: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
}

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisClient)
})

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeSession = (overrides: object = {}) => ({
  id: 'session-id',
  userId: 'u1',
  supabaseAccessToken: 'sb-access',
  supabaseRefreshToken: 'sb-refresh',
  csrfToken: 'csrf',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  lastActivity: new Date('2024-01-01T01:00:00Z'),
  ...overrides,
})

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      SESSION_EXPIRES_IN: '86400',
    }
    return config[key]
  }),
}

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('RedisService', () => {
  let service: RedisService

  beforeEach(async () => {
    jest.clearAllMocks()
    mockRedisClient.ping.mockResolvedValue('PONG')
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined)

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile()

    service = module.get<RedisService>(RedisService)

    // Initialise manuellement le client Redis (onModuleInit non appelé par compile())
    await service.onModuleInit()
  })

  // -----------------------------------------------------------------------
  // onModuleInit
  // -----------------------------------------------------------------------

  describe('onModuleInit', () => {
    it('appelle ping pour tester la connexion', async () => {
      expect(mockRedisClient.ping).toHaveBeenCalled()
    })

    it('lève une erreur si ping échoue', async () => {
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Connection refused'))

      await expect(service.onModuleInit()).rejects.toThrow('Connection refused')
    })

    it('enregistre les handlers on(connect) et on(error)', async () => {
      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function))
    })
  })

  // -----------------------------------------------------------------------
  // onModuleDestroy
  // -----------------------------------------------------------------------

  describe('onModuleDestroy', () => {
    it('appelle quit sur le client', async () => {
      await service.onModuleDestroy()

      expect(mockRedisClient.quit).toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // setSession
  // -----------------------------------------------------------------------

  describe('setSession', () => {
    it('stocke la session sérialisée avec setex', async () => {
      const session = makeSession()

      await service.setSession('session-id', session)

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'session:session-id',
        86400,
        expect.stringContaining('"userId":"u1"'),
      )
    })

    it('sérialise les dates en ISO string', async () => {
      const session = makeSession()

      await service.setSession('session-id', session)

      const stored = JSON.parse(mockRedisClient.setex.mock.calls[0][2])
      expect(stored.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(stored.lastActivity).toBe('2024-01-01T01:00:00.000Z')
    })

    it('utilise le TTL depuis la config', async () => {
      await service.setSession('session-id', makeSession())

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        expect.any(String),
        86400,
        expect.any(String),
      )
    })
  })

  // -----------------------------------------------------------------------
  // getSession
  // -----------------------------------------------------------------------

  describe('getSession', () => {
    it('retourne null si clé absente', async () => {
      mockRedisClient.get.mockResolvedValue(null)

      const result = await service.getSession('session-id')

      expect(result).toBeNull()
    })

    it('retourne la session désérialisée avec les dates reconstruites', async () => {
      const raw = JSON.stringify({
        id: 'session-id',
        userId: 'u1',
        supabaseAccessToken: 'sb-access',
        supabaseRefreshToken: 'sb-refresh',
        csrfToken: 'csrf',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastActivity: '2024-01-01T01:00:00.000Z',
      })
      mockRedisClient.get.mockResolvedValue(raw)

      const result = await service.getSession('session-id')

      expect(result?.userId).toBe('u1')
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.lastActivity).toBeInstanceOf(Date)
    })

    it('cherche avec la clé préfixée session:', async () => {
      mockRedisClient.get.mockResolvedValue(null)

      await service.getSession('abc')

      expect(mockRedisClient.get).toHaveBeenCalledWith('session:abc')
    })
  })

  // -----------------------------------------------------------------------
  // deleteSession
  // -----------------------------------------------------------------------

  describe('deleteSession', () => {
    it('supprime la clé préfixée session:', async () => {
      await service.deleteSession('session-id')

      expect(mockRedisClient.del).toHaveBeenCalledWith('session:session-id')
    })
  })

  // -----------------------------------------------------------------------
  // updateLastActivity
  // -----------------------------------------------------------------------

  describe('updateLastActivity', () => {
    it('met à jour lastActivity si la session existe', async () => {
      const raw = JSON.stringify({
        id: 'session-id',
        userId: 'u1',
        supabaseAccessToken: 'sb-access',
        supabaseRefreshToken: 'sb-refresh',
        csrfToken: 'csrf',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastActivity: '2024-01-01T01:00:00.000Z',
      })
      mockRedisClient.get.mockResolvedValue(raw)

      await service.updateLastActivity('session-id')

      const stored = JSON.parse(mockRedisClient.setex.mock.calls[0][2])
      const lastActivity = new Date(stored.lastActivity)
      expect(lastActivity.getTime()).toBeGreaterThan(new Date('2024-01-01T01:00:00.000Z').getTime())
    })

    it("ne fait rien si la session n'existe pas", async () => {
      mockRedisClient.get.mockResolvedValue(null)

      await service.updateLastActivity('session-id')

      expect(mockRedisClient.setex).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // getUserSessions
  // -----------------------------------------------------------------------

  describe('getUserSessions', () => {
    it("retourne un tableau vide si aucune clé session n'existe", async () => {
      mockRedisClient.keys.mockResolvedValue([])

      const result = await service.getUserSessions('u1')

      expect(result).toEqual([])
    })

    it("retourne uniquement les sessions appartenant à l'userId", async () => {
      const rawU1 = JSON.stringify({
        id: 'sid1',
        userId: 'u1',
        supabaseAccessToken: 'a',
        supabaseRefreshToken: 'b',
        csrfToken: 'c',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      })
      const rawU2 = JSON.stringify({
        id: 'sid2',
        userId: 'u2',
        supabaseAccessToken: 'a',
        supabaseRefreshToken: 'b',
        csrfToken: 'c',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      })

      mockRedisClient.keys.mockResolvedValue(['session:sid1', 'session:sid2'])
      mockRedisClient.get.mockResolvedValueOnce(rawU1).mockResolvedValueOnce(rawU2)

      const result = await service.getUserSessions('u1')

      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('u1')
    })
  })

  // -----------------------------------------------------------------------
  // isHealthy
  // -----------------------------------------------------------------------

  describe('isHealthy', () => {
    it('retourne true si ping retourne PONG', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG')

      const result = await service.isHealthy()

      expect(result).toBe(true)
    })

    it('retourne false si ping lève une exception', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Redis down'))

      const result = await service.isHealthy()

      expect(result).toBe(false)
    })
  })
})
