import { Session } from '../../src/common/interfaces/session.interface'

export interface RedisServiceMock {
  onModuleInit: () => Promise<void>
  onModuleDestroy: () => Promise<void>

  setSession: (sessionId: string, session: Session) => Promise<void>
  getSession: (sessionId: string) => Promise<Session | null>
  deleteSession: (sessionId: string) => Promise<void>
  updateLastActivity: (sessionId: string) => Promise<void>
  getUserSessions: (userId: string) => Promise<Session[]>
  isHealthy: () => Promise<boolean>
}

export type RedisMockOverrides = Partial<RedisServiceMock>

export const createRedisServiceMock = (overrides: RedisMockOverrides = {}): RedisServiceMock => {
  const store = new Map<string, string>() // simulate Redis KV store

  const mock: RedisServiceMock = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),

    async setSession(sessionId: string, session: Session) {
      store.set(
        `session:${sessionId}`,
        JSON.stringify({
          ...session,
          createdAt: session.createdAt.toISOString(),
          lastActivity: session.lastActivity.toISOString(),
        }),
      )
    },

    async getSession(sessionId: string): Promise<Session | null> {
      const raw = store.get(`session:${sessionId}`)
      if (!raw) return null

      const parsed = JSON.parse(raw)
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastActivity: new Date(parsed.lastActivity),
      }
    },

    async deleteSession(sessionId: string): Promise<void> {
      store.delete(`session:${sessionId}`)
    },

    async updateLastActivity(sessionId: string): Promise<void> {
      const existing = await mock.getSession(sessionId)

      if (existing) {
        existing.lastActivity = new Date()
        await mock.setSession(sessionId, existing)
      }
    },

    async getUserSessions(userId: string): Promise<Session[]> {
      const sessions: Session[] = []

      for (const [key, raw] of store.entries()) {
        if (key.startsWith('session:')) {
          const parsed = JSON.parse(raw)
          if (parsed.userId === userId) {
            sessions.push({
              ...parsed,
              createdAt: new Date(parsed.createdAt),
              lastActivity: new Date(parsed.lastActivity),
            })
          }
        }
      }

      return sessions
    },

    async isHealthy() {
      return true
    },
  }

  return { ...mock, ...overrides }
}
