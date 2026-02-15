import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { CsrfGuard } from './csrf.guard'
import type { FastifyRequest } from 'fastify'

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

const makeSession = (csrfToken = 'valid-csrf') => ({
  id: 'session-id',
  userId: 'u1',
  csrfToken,
})

type TestRequest = Partial<FastifyRequest> & { session?: object | null }

const makeRequest = (session: object | null, csrfHeader?: string): TestRequest => ({
  headers: {
    'x-csrf-token': csrfHeader,
  } as FastifyRequest['headers'],
  session,
})

const makeContext = (request: TestRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('CsrfGuard', () => {
  let guard: CsrfGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsrfGuard],
    }).compile()

    guard = module.get<CsrfGuard>(CsrfGuard)
  })

  it('lève ForbiddenException si la session est absente de la requête', () => {
    const ctx = makeContext(makeRequest(null, 'any-token'))

    expect(() => guard.canActivate(ctx)).toThrow('No session found for CSRF validation')
  })

  it('lève ForbiddenException si le header x-csrf-token est absent', () => {
    const ctx = makeContext(makeRequest(makeSession(), undefined))

    expect(() => guard.canActivate(ctx)).toThrow('Invalid CSRF token')
  })

  it('lève ForbiddenException si le token ne correspond pas à la session', () => {
    const ctx = makeContext(makeRequest(makeSession('good-csrf'), 'bad-csrf'))

    expect(() => guard.canActivate(ctx)).toThrow('Invalid CSRF token')
  })

  it('retourne true si le token correspond à la session', () => {
    const ctx = makeContext(makeRequest(makeSession('my-csrf'), 'my-csrf'))

    const result = guard.canActivate(ctx)

    expect(result).toBe(true)
  })

  it('lève ForbiddenException si le header est une chaîne vide', () => {
    const ctx = makeContext(makeRequest(makeSession('valid-csrf'), ''))

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
  })
})
