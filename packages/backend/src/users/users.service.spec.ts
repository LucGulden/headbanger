import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { UsersService } from './users.service'
import { SupabaseService } from '../common/database/supabase.service'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { DbUser } from '../common/database/database.types'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockAnonFrom = jest.fn()
const mockAuthFrom = jest.fn()

const mockSupabaseService = {
  getClient: jest.fn(() => ({ from: mockAnonFrom })),
  getClientWithAuth: jest.fn(() => ({ from: mockAuthFrom })),
}

// -------------------------------------------------------------------------
// Chain factories
// -------------------------------------------------------------------------

const makeSingleChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
})

const makeOrChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockResolvedValue(result),
})

const makeEqSelectChain = (result: object) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue(result),
})

const makeUpdateChain = (result: object) => ({
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(result),
})

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeDbUser = (overrides: Partial<DbUser> = {}): DbUser => ({
  uid: 'u1',
  username: 'miles',
  first_name: 'Miles',
  last_name: 'Davis',
  photo_url: 'miles.png',
  bio: 'Trumpet player',
  ...overrides,
})

const TOKEN = 'auth-token'
const USER_ID = 'u1'

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  // -----------------------------------------------------------------------
  // getUserByUid
  // -----------------------------------------------------------------------

  describe('getUserByUid', () => {
    it('interroge users avec le bon uid', async () => {
      const chain = makeSingleChain({ data: makeDbUser(), error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.getUserByUid(USER_ID)

      expect(mockAnonFrom).toHaveBeenCalledWith('users')
      expect(chain.eq).toHaveBeenCalledWith('uid', USER_ID)
    })

    it('mappe tous les champs snake_case en camelCase', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: makeDbUser(), error: null }))

      const res = await service.getUserByUid(USER_ID)

      expect(res).toEqual({
        uid: 'u1',
        username: 'miles',
        firstName: 'Miles',
        lastName: 'Davis',
        photoUrl: 'miles.png',
        bio: 'Trumpet player',
      })
    })

    it('lève NotFoundException si Supabase retourne une erreur', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: { message: 'not found' } }))

      await expect(service.getUserByUid('xxx')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lève NotFoundException si data est null sans erreur', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: null }))

      await expect(service.getUserByUid('xxx')).rejects.toBeInstanceOf(NotFoundException)
    })

    it("inclut l'uid dans le message d'erreur", async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: { message: 'not found' } }))

      await expect(service.getUserByUid('abc')).rejects.toThrow('abc')
    })
  })

  // -----------------------------------------------------------------------
  // getUserByUsername
  // -----------------------------------------------------------------------

  describe('getUserByUsername', () => {
    it('interroge users avec le bon username', async () => {
      const chain = makeSingleChain({ data: makeDbUser(), error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.getUserByUsername('miles')

      expect(chain.eq).toHaveBeenCalledWith('username', 'miles')
    })

    it("retourne l'utilisateur mappé", async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: makeDbUser(), error: null }))

      const res = await service.getUserByUsername('miles')

      expect(res.uid).toBe('u1')
      expect(res.username).toBe('miles')
    })

    it('lève NotFoundException si Supabase retourne une erreur', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: { message: 'not found' } }))

      await expect(service.getUserByUsername('inconnu')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lève NotFoundException si data est null sans erreur', async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: null }))

      await expect(service.getUserByUsername('inconnu')).rejects.toBeInstanceOf(NotFoundException)
    })

    it("inclut le username dans le message d'erreur", async () => {
      mockAnonFrom.mockReturnValue(makeSingleChain({ data: null, error: { message: 'not found' } }))

      await expect(service.getUserByUsername('xyz')).rejects.toThrow('xyz')
    })
  })

  // -----------------------------------------------------------------------
  // searchUsers — validations entrée
  // -----------------------------------------------------------------------

  describe('searchUsers — validations entrée', () => {
    it('retourne [] si query est vide', async () => {
      const res = await service.searchUsers('')
      expect(res).toEqual([])
      expect(mockAnonFrom).not.toHaveBeenCalled()
    })

    it('retourne [] si query est un espace', async () => {
      const res = await service.searchUsers('   ')
      expect(res).toEqual([])
      expect(mockAnonFrom).not.toHaveBeenCalled()
    })

    it('retourne [] si query fait 1 caractère', async () => {
      const res = await service.searchUsers('a')
      expect(res).toEqual([])
      expect(mockAnonFrom).not.toHaveBeenCalled()
    })

    it('lance une recherche si query fait 2 caractères', async () => {
      mockAnonFrom.mockReturnValue(makeOrChain({ data: [], error: null }))

      await service.searchUsers('mi')

      expect(mockAnonFrom).toHaveBeenCalledWith('users')
    })
  })

  // -----------------------------------------------------------------------
  // searchUsers — appels Supabase
  // -----------------------------------------------------------------------

  describe('searchUsers — appels Supabase', () => {
    it('utilise .or() avec les trois champs en lowercase', async () => {
      const chain = makeOrChain({ data: [], error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.searchUsers('Miles')

      expect(chain.or).toHaveBeenCalledWith(
        'username.ilike.%miles%,first_name.ilike.%miles%,last_name.ilike.%miles%',
      )
    })

    it('trim et lowercase la query', async () => {
      const chain = makeOrChain({ data: [], error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.searchUsers('  Miles  ')

      expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('%miles%'))
    })

    it('applique la pagination par défaut (limit=20, offset=0)', async () => {
      const chain = makeOrChain({ data: [], error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.searchUsers('miles')

      expect(chain.range).toHaveBeenCalledWith(0, 19)
    })

    it('applique une pagination personnalisée', async () => {
      const chain = makeOrChain({ data: [], error: null })
      mockAnonFrom.mockReturnValue(chain)

      await service.searchUsers('miles', 10, 20)

      expect(chain.range).toHaveBeenCalledWith(20, 29)
    })
  })

  // -----------------------------------------------------------------------
  // searchUsers — résultats
  // -----------------------------------------------------------------------

  describe('searchUsers — résultats', () => {
    it('mappe les résultats en User', async () => {
      mockAnonFrom.mockReturnValue(
        makeOrChain({
          data: [makeDbUser(), makeDbUser({ uid: 'u2', username: 'bill' })],
          error: null,
        }),
      )

      const res = await service.searchUsers('miles')

      expect(res).toHaveLength(2)
      expect(res[0].uid).toBe('u1')
      expect(res[1].username).toBe('bill')
    })

    it('retourne [] si data est null', async () => {
      mockAnonFrom.mockReturnValue(makeOrChain({ data: null, error: null }))

      const res = await service.searchUsers('miles')

      expect(res).toEqual([])
    })

    it('retourne [] si aucun résultat', async () => {
      mockAnonFrom.mockReturnValue(makeOrChain({ data: [], error: null }))

      const res = await service.searchUsers('zzzzz')

      expect(res).toEqual([])
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAnonFrom.mockReturnValue(makeOrChain({ data: null, error: { message: 'DB error' } }))

      await expect(service.searchUsers('miles')).rejects.toThrow('Error searching users: DB error')
    })
  })

  // -----------------------------------------------------------------------
  // checkUsernameAvailability
  // -----------------------------------------------------------------------

  describe('checkUsernameAvailability', () => {
    it('retourne true si aucun utilisateur avec ce username', async () => {
      mockAnonFrom.mockReturnValue(makeEqSelectChain({ data: [], error: null }))

      const res = await service.checkUsernameAvailability('nouveau')

      expect(res).toBe(true)
    })

    it('retourne true si data est null', async () => {
      mockAnonFrom.mockReturnValue(makeEqSelectChain({ data: null, error: null }))

      const res = await service.checkUsernameAvailability('nouveau')

      expect(res).toBe(true)
    })

    it('retourne false si username pris et sans excludeUserId', async () => {
      mockAnonFrom.mockReturnValue(
        makeEqSelectChain({
          data: [{ uid: 'u2', username: 'miles' }],
          error: null,
        }),
      )

      const res = await service.checkUsernameAvailability('miles')

      expect(res).toBe(false)
    })

    it("retourne true si username pris mais par l'utilisateur exclu", async () => {
      mockAnonFrom.mockReturnValue(
        makeEqSelectChain({
          data: [{ uid: USER_ID, username: 'miles' }],
          error: null,
        }),
      )

      const res = await service.checkUsernameAvailability('miles', USER_ID)

      expect(res).toBe(true)
    })

    it('retourne false si username pris par un autre utilisateur même avec excludeUserId', async () => {
      mockAnonFrom.mockReturnValue(
        makeEqSelectChain({
          data: [{ uid: 'u2', username: 'miles' }],
          error: null,
        }),
      )

      const res = await service.checkUsernameAvailability('miles', USER_ID)

      expect(res).toBe(false)
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAnonFrom.mockReturnValue(
        makeEqSelectChain({ data: null, error: { message: 'DB error' } }),
      )

      await expect(service.checkUsernameAvailability('miles')).rejects.toThrow(
        'Error checking username: DB error',
      )
    })
  })

  // -----------------------------------------------------------------------
  // updateUserProfile — validations
  // -----------------------------------------------------------------------

  describe('updateUserProfile — validations', () => {
    it("vérifie la disponibilité du username s'il est fourni", async () => {
      const spy = jest.spyOn(service, 'checkUsernameAvailability').mockResolvedValue(true)
      mockAuthFrom.mockReturnValue(makeUpdateChain({ data: makeDbUser(), error: null }))

      await service.updateUserProfile(TOKEN, USER_ID, { username: 'nouveau' })

      expect(spy).toHaveBeenCalledWith('nouveau', USER_ID)
    })

    it('ne vérifie pas la disponibilité si username absent du dto', async () => {
      const spy = jest.spyOn(service, 'checkUsernameAvailability').mockResolvedValue(true)
      mockAuthFrom.mockReturnValue(makeUpdateChain({ data: makeDbUser(), error: null }))

      await service.updateUserProfile(TOKEN, USER_ID, { bio: 'Nouvelle bio' })

      expect(spy).not.toHaveBeenCalled()
    })

    it('lève BadRequestException si le username est déjà pris', async () => {
      jest.spyOn(service, 'checkUsernameAvailability').mockResolvedValue(false)

      await expect(
        service.updateUserProfile(TOKEN, USER_ID, { username: 'pris' }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })
  })

  // -----------------------------------------------------------------------
  // updateUserProfile — mapping snake_case
  // -----------------------------------------------------------------------

  describe('updateUserProfile — mapping snake_case', () => {
    const setupUpdate = (dto: UpdateUserDto) => {
      jest.spyOn(service, 'checkUsernameAvailability').mockResolvedValue(true)
      const chain = makeUpdateChain({ data: makeDbUser(), error: null })
      mockAuthFrom.mockReturnValue(chain)
      return chain
    }

    it('convertit username correctement', async () => {
      const chain = setupUpdate({ username: 'nouveau' })

      await service.updateUserProfile(TOKEN, USER_ID, { username: 'nouveau' })

      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ username: 'nouveau' }))
    })

    it('convertit firstName en first_name', async () => {
      const chain = setupUpdate({ firstName: 'John' })

      await service.updateUserProfile(TOKEN, USER_ID, { firstName: 'John' })

      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'John' }))
    })

    it('convertit lastName en last_name', async () => {
      const chain = setupUpdate({ lastName: 'Coltrane' })

      await service.updateUserProfile(TOKEN, USER_ID, { lastName: 'Coltrane' })

      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ last_name: 'Coltrane' }))
    })

    it('convertit photoUrl en photo_url', async () => {
      const chain = setupUpdate({ photoUrl: 'new.png' })

      await service.updateUserProfile(TOKEN, USER_ID, { photoUrl: 'new.png' })

      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ photo_url: 'new.png' }))
    })

    it("n'inclut pas les champs undefined dans la mise à jour", async () => {
      const chain = setupUpdate({ bio: 'Nouvelle bio' })

      await service.updateUserProfile(TOKEN, USER_ID, { bio: 'Nouvelle bio' })

      const updateArg = chain.update.mock.calls[0][0]
      expect(updateArg).toEqual({ bio: 'Nouvelle bio' })
      expect(updateArg.username).toBeUndefined()
      expect(updateArg.first_name).toBeUndefined()
    })

    it('inclut tous les champs si tous sont fournis', async () => {
      const chain = setupUpdate({})
      const dto: UpdateUserDto = {
        username: 'nouveau',
        firstName: 'John',
        lastName: 'Coltrane',
        bio: 'Saxophonist',
        photoUrl: 'new.png',
      }

      await service.updateUserProfile(TOKEN, USER_ID, dto)

      expect(chain.update).toHaveBeenCalledWith({
        username: 'nouveau',
        first_name: 'John',
        last_name: 'Coltrane',
        bio: 'Saxophonist',
        photo_url: 'new.png',
      })
    })
  })

  // -----------------------------------------------------------------------
  // updateUserProfile — comportement nominal
  // -----------------------------------------------------------------------

  describe('updateUserProfile — comportement nominal', () => {
    it('utilise getClientWithAuth avec le bon token', async () => {
      mockAuthFrom.mockReturnValue(makeUpdateChain({ data: makeDbUser(), error: null }))

      await service.updateUserProfile(TOKEN, USER_ID, { bio: 'Nouvelle bio' })

      expect(mockSupabaseService.getClientWithAuth).toHaveBeenCalledWith(TOKEN)
    })

    it('filtre par uid correct', async () => {
      const chain = makeUpdateChain({ data: makeDbUser(), error: null })
      mockAuthFrom.mockReturnValue(chain)

      await service.updateUserProfile(TOKEN, USER_ID, { bio: 'Nouvelle bio' })

      expect(chain.eq).toHaveBeenCalledWith('uid', USER_ID)
    })

    it("retourne l'utilisateur mis à jour mappé en camelCase", async () => {
      mockAuthFrom.mockReturnValue(
        makeUpdateChain({
          data: makeDbUser({ bio: 'Nouvelle bio' }),
          error: null,
        }),
      )

      const res = await service.updateUserProfile(TOKEN, USER_ID, { bio: 'Nouvelle bio' })

      expect(res.bio).toBe('Nouvelle bio')
      expect(res.firstName).toBe('Miles')
    })

    it('lève une erreur si Supabase échoue', async () => {
      mockAuthFrom.mockReturnValue(
        makeUpdateChain({ data: null, error: { message: 'update error' } }),
      )

      await expect(service.updateUserProfile(TOKEN, USER_ID, { bio: 'Test' })).rejects.toThrow(
        'Error updating user profile: update error',
      )
    })
  })
})
