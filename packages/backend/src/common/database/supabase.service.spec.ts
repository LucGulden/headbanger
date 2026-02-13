import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { SupabaseService } from './supabase.service'

// -------------------------------------------------------------------------
// Mock @supabase/supabase-js
// -------------------------------------------------------------------------

const mockCreateClient = jest.fn((_url?: string, _key?: string, _options?: object) => ({
  from: jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: (url: string, key: string, options?: object) => mockCreateClient(url, key, options),
}))

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

const makeConfigService = (url = 'https://project.supabase.co', key = 'anon-key') => ({
  get: jest.fn((k: string) => {
    if (k === 'SUPABASE_URL') return url
    if (k === 'SUPABASE_ANON_KEY') return key
    return undefined
  }),
})

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('SupabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Constructeur
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('instancie le client Supabase avec url et anonKey', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [SupabaseService, { provide: ConfigService, useValue: makeConfigService() }],
      }).compile()

      module.get<SupabaseService>(SupabaseService)

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://project.supabase.co',
        'anon-key',
        undefined,
      )
    })

    it('lève une erreur si SUPABASE_URL est manquant', async () => {
      await expect(
        Test.createTestingModule({
          providers: [
            SupabaseService,
            { provide: ConfigService, useValue: makeConfigService('', 'anon-key') },
          ],
        })
          .compile()
          .then((m) => m.get<SupabaseService>(SupabaseService)),
      ).rejects.toThrow('Missing Supabase configuration')
    })

    it('lève une erreur si SUPABASE_ANON_KEY est manquant', async () => {
      await expect(
        Test.createTestingModule({
          providers: [
            SupabaseService,
            {
              provide: ConfigService,
              useValue: makeConfigService('https://project.supabase.co', ''),
            },
          ],
        })
          .compile()
          .then((m) => m.get<SupabaseService>(SupabaseService)),
      ).rejects.toThrow('Missing Supabase configuration')
    })
  })

  // -----------------------------------------------------------------------
  // getClient
  // -----------------------------------------------------------------------

  describe('getClient', () => {
    it('retourne le client anonyme créé au constructeur', async () => {
      const fakeClient = { from: jest.fn(), _type: 'anon' }
      mockCreateClient.mockReturnValueOnce(fakeClient)

      const module: TestingModule = await Test.createTestingModule({
        providers: [SupabaseService, { provide: ConfigService, useValue: makeConfigService() }],
      }).compile()

      const service = module.get<SupabaseService>(SupabaseService)
      const client = service.getClient()

      expect(client).toBe(fakeClient)
    })
  })

  // -----------------------------------------------------------------------
  // getClientWithAuth
  // -----------------------------------------------------------------------

  describe('getClientWithAuth', () => {
    it('crée un nouveau client avec le header Authorization Bearer', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [SupabaseService, { provide: ConfigService, useValue: makeConfigService() }],
      }).compile()

      const service = module.get<SupabaseService>(SupabaseService)
      service.getClientWithAuth('user-jwt-token')

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://project.supabase.co',
        'anon-key',
        expect.objectContaining({
          global: {
            headers: { Authorization: 'Bearer user-jwt-token' },
          },
        }),
      )
    })

    it('lève une erreur si la config est manquante', async () => {
      const configWithMissingUrl = {
        get: jest.fn((k: string) => {
          if (k === 'SUPABASE_URL') return 'https://project.supabase.co'
          if (k === 'SUPABASE_ANON_KEY') return 'anon-key'
          return undefined
        }),
      }

      // Force config manquante uniquement sur le 2e appel (getClientWithAuth)
      configWithMissingUrl.get
        .mockReturnValueOnce('https://project.supabase.co') // constructeur URL
        .mockReturnValueOnce('anon-key') // constructeur KEY
        .mockReturnValueOnce(undefined) // getClientWithAuth URL → manquant

      const module: TestingModule = await Test.createTestingModule({
        providers: [SupabaseService, { provide: ConfigService, useValue: configWithMissingUrl }],
      }).compile()

      const service = module.get<SupabaseService>(SupabaseService)

      expect(() => service.getClientWithAuth('token')).toThrow('Missing Supabase configuration')
    })
  })
})
