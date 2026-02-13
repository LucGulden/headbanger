import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { SupabaseService } from '../../src/common/database/supabase.service'
import { RedisService } from '../../src/redis/redis.service'
import { AuthGuard } from '../../src/auth/guards/auth.guard'
import { CsrfGuard } from '../../src/auth/guards/csrf.guard'
import { RefreshGuard } from '../../src/auth/guards/refresh.guard'
import { createSupabaseServiceMock, SupabaseMockResponses } from '../mocks/supabase.mock'
import { createRedisServiceMock, RedisMockOverrides } from '../mocks/redis.mock'
import { createAuthGuardMock, createCsrfGuardMock } from '../mocks/auth.mock'

export interface CreateAppOptions {
  /** Données Supabase à injecter (clés au format "table:operation") */
  supabase?: SupabaseMockResponses
  /** Overrides optionnels du RedisService */
  redis?: RedisMockOverrides
  /** Simuler un utilisateur différent de TEST_USER_ID */
  userId?: string
  /** Simuler un token différent de TEST_TOKEN */
  token?: string
}

/**
 * Crée une instance NestJS complète avec tous les providers extérieurs mockés :
 *   - SupabaseService  → QueryBuilder chainable configuré par `supabase`
 *   - RedisService     → store en mémoire (Map)
 *   - AuthGuard        → injecte req.user / req.token / req.session sans JWT
 *   - CsrfGuard        → désactivé
 *   - RefreshGuard     → désactivé (même approche)
 *
 * Utilisation typique (beforeAll + afterAll pour performance) :
 *
 *   let app: INestApplication
 *
 *   beforeAll(async () => {
 *     app = await createTestApp({
 *       supabase: { 'vinyls:select:single': { data: vinylFixture, error: null } },
 *     })
 *   })
 *
 *   afterAll(async () => { await app.close() })
 *
 * Utilisation par test (afterEach pour isolation maximale) :
 *
 *   afterEach(async () => { if (app) await app.close() })
 *
 *   it('...', async () => {
 *     app = await createTestApp({ supabase: { ... } })
 *   })
 */
export async function createTestApp(options: CreateAppOptions = {}): Promise<INestApplication> {
  const { supabase = {}, redis = {}, userId, token } = options

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SupabaseService)
    .useValue(createSupabaseServiceMock(supabase))
    .overrideProvider(RedisService)
    .useValue(createRedisServiceMock(redis))
    .overrideGuard(AuthGuard)
    .useValue(createAuthGuardMock({ userId, token }))
    .overrideGuard(CsrfGuard)
    .useValue(createCsrfGuardMock())
    .overrideGuard(RefreshGuard)
    .useValue(createCsrfGuardMock()) // même comportement : laisse passer
    .compile()

  const app = moduleFixture.createNestApplication()
  await app.init()
  return app
}

/**
 * Alias de compatibilité avec l'ancienne signature.
 * @deprecated Préférer createTestApp({ supabase: responses })
 */
export async function createAppWithSupabaseMock(
  responses: SupabaseMockResponses,
): Promise<INestApplication> {
  return createTestApp({ supabase: responses })
}
