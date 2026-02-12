import { Session } from '../../src/common/interfaces/session.interface'

export const createRedisServiceMock = (overrides: any = {}) => {
  const store = new Map<string, string>() // simulate Redis KV store

  return {
    // Fake onModuleInit / onModuleDestroy (no real Redis connection)
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),

    // ---- Session methods ----
    setSession: jest.fn(async (sessionId: string, session: Session) => {
      store.set(
        `session:${sessionId}`,
        JSON.stringify({
          ...session,
          createdAt: session.createdAt.toISOString(),
          lastActivity: session.lastActivity.toISOString(),
        }),
      )
    }),

    getSession: jest.fn(async (sessionId: string): Promise<Session | null> => {
      const raw = store.get(`session:${sessionId}`)
      if (!raw) return null

      const parsed = JSON.parse(raw)
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastActivity: new Date(parsed.lastActivity),
      }
    }),

    deleteSession: jest.fn(async (sessionId: string) => {
      store.delete(`session:${sessionId}`)
    }),

    updateLastActivity: jest.fn(async (sessionId: string) => {
      const existing = await (this as any).getSession(sessionId)
      if (existing) {
        existing.lastActivity = new Date()
        await (this as any).setSession(sessionId, existing)
      }
    }),

    getUserSessions: jest.fn(async (userId: string): Promise<Session[]> => {
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
    }),

    isHealthy: jest.fn(async () => true),

    // Allow overrides for special cases
    ...overrides,
  }
}
