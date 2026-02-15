import { ExecutionContext } from '@nestjs/common'
import { Session } from '../../src/common/interfaces/session.interface'

// ─── Utilisateur de test partagé ───────────────────────────────────────────

export const TEST_USER_ID = 'test-user-id-00000000-0000-0000-0000-000000000001'
export const TEST_USER_ID_2 = 'test-user-id-00000000-0000-0000-0000-000000000002'
export const TEST_TOKEN = 'test-supabase-jwt-token'

export const TEST_SESSION: Session = {
  id: 'test-session-id',
  userId: TEST_USER_ID,
  supabaseAccessToken: TEST_TOKEN,
  supabaseRefreshToken: 'test-supabase-refresh-token',
  csrfToken: 'test-csrf-token',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  lastActivity: new Date('2024-01-01T00:00:00.000Z'),
}

// ─── Guard mocks ───────────────────────────────────────────────────────────

/**
 * Override de l'AuthGuard pour les tests e2e.
 * Injecte TEST_USER_ID dans req.user, req.token et req.session
 * sans passer par Redis ni valider de JWT.
 *
 * Usage dans createAppWithSupabaseMock :
 *   .overrideGuard(AuthGuard).useValue(createAuthGuardMock())
 */
export const createAuthGuardMock = (overrides?: { userId?: string; token?: string }) => ({
  canActivate: (ctx: ExecutionContext): boolean => {
    const req = ctx.switchToHttp().getRequest()
    req.user = { id: overrides?.userId ?? TEST_USER_ID }
    req.token = overrides?.token ?? TEST_TOKEN
    req.session = {
      ...TEST_SESSION,
      userId: overrides?.userId ?? TEST_USER_ID,
      supabaseAccessToken: overrides?.token ?? TEST_TOKEN,
    }
    return true
  },
})

/**
 * Guard qui simule un utilisateur non authentifié (renvoie false).
 * Utilisé dans auth.e2e-spec.ts pour tester les routes protégées sans cookie.
 */
export const createUnauthorizedGuardMock = () => ({
  canActivate: (_ctx: ExecutionContext): boolean => false,
})

/**
 * Override du CsrfGuard — désactivé en test (pas de cookie CSRF à gérer).
 */
export const createCsrfGuardMock = () => ({
  canActivate: (_ctx: ExecutionContext): boolean => true,
})
