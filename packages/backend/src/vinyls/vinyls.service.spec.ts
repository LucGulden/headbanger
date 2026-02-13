import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { VinylsService } from './vinyls.service'
import { SupabaseService } from '../common/database/supabase.service'
import type { VinylByIdQueryResult } from './vinyls.types'

const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
}

const mockSupabaseService = {
  getClient: jest.fn(() => mockSupabaseClient),
}

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeVinylDbResult = (
  overrides: Partial<VinylByIdQueryResult> = {},
): VinylByIdQueryResult => ({
  id: 'v1',
  title: 'Kind of Blue',
  cover_url: 'cover.png',
  year: 1959,
  label: 'Columbia',
  catalog_number: 'CS 8163',
  country: 'US',
  format: 'LP',
  album_id: 'alb1',
  vinyl_artists: [
    { position: 2, artist: [{ id: 'a2', name: 'Bill Evans', image_url: null }] },
    { position: 1, artist: [{ id: 'a1', name: 'Miles Davis', image_url: 'miles.png' }] },
  ],
  albums: {
    id: 'alb1',
    title: 'Kind of Blue',
    cover_url: 'alb.png',
    year: 1959,
    album_artists: [
      { position: 2, artist: [{ id: 'aa2', name: 'Bill Evans', image_url: null }] },
      { position: 1, artist: [{ id: 'aa1', name: 'Miles Davis', image_url: 'miles.png' }] },
    ],
  },
  ...overrides,
})

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('VinylsService', () => {
  let service: VinylsService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [VinylsService, { provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile()

    service = module.get<VinylsService>(VinylsService)
  })

  // -----------------------------------------------------------------------
  // Appels Supabase
  // -----------------------------------------------------------------------

  describe('appels Supabase', () => {
    it('interroge la bonne table avec le bon id', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: makeVinylDbResult(), error: null })

      await service.getById('v1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('vinyls')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'v1')
      expect(mockSupabaseClient.single).toHaveBeenCalledTimes(1)
    })
  })

  // -----------------------------------------------------------------------
  // Cas nominal — mapping complet
  // -----------------------------------------------------------------------

  describe('cas nominal', () => {
    it('mappe tous les champs du vinyl', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: makeVinylDbResult(), error: null })

      const res = await service.getById('v1')

      expect(res.id).toBe('v1')
      expect(res.title).toBe('Kind of Blue')
      expect(res.coverUrl).toBe('cover.png')
      expect(res.year).toBe(1959)
      expect(res.label).toBe('Columbia')
      expect(res.catalogNumber).toBe('CS 8163')
      expect(res.country).toBe('US')
      expect(res.format).toBe('LP')
    })

    it('trie les vinyl_artists par position', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: makeVinylDbResult(), error: null })

      const res = await service.getById('v1')

      expect(res.artists).toHaveLength(2)
      expect(res.artists[0]).toEqual({ id: 'a1', name: 'Miles Davis', imageUrl: 'miles.png' })
      expect(res.artists[1]).toEqual({ id: 'a2', name: 'Bill Evans', imageUrl: null })
    })

    it("mappe tous les champs de l'album", async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: makeVinylDbResult(), error: null })

      const res = await service.getById('v1')

      expect(res.album.id).toBe('alb1')
      expect(res.album.title).toBe('Kind of Blue')
      expect(res.album.coverUrl).toBe('alb.png')
      expect(res.album.year).toBe(1959)
    })

    it('trie les album_artists par position', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: makeVinylDbResult(), error: null })

      const res = await service.getById('v1')

      expect(res.album.artists).toHaveLength(2)
      expect(res.album.artists[0]).toEqual({
        id: 'aa1',
        name: 'Miles Davis',
        imageUrl: 'miles.png',
      })
      expect(res.album.artists[1]).toEqual({ id: 'aa2', name: 'Bill Evans', imageUrl: null })
    })
  })

  // -----------------------------------------------------------------------
  // Fallbacks artistes
  // -----------------------------------------------------------------------

  describe('fallback artistes', () => {
    it('retourne "Artiste inconnu" si vinyl_artists est vide', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: makeVinylDbResult({ vinyl_artists: [] }),
        error: null,
      })

      const res = await service.getById('v1')

      expect(res.artists).toHaveLength(1)
      expect(res.artists[0]).toEqual({ id: '', name: 'Artiste inconnu', imageUrl: null })
    })

    it('filtre les vinyl_artists dont id ou name est vide', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: makeVinylDbResult({
          vinyl_artists: [
            { position: 1, artist: [{ id: '', name: 'Artist valide', image_url: null }] },
            { position: 2, artist: [{ id: 'a2', name: '', image_url: null }] },
            { position: 3, artist: [{ id: 'a3', name: 'Artist 3', image_url: null }] },
          ],
        }),
        error: null,
      })

      const res = await service.getById('v1')

      expect(res.artists).toHaveLength(1)
      expect(res.artists[0].name).toBe('Artist 3')
    })

    it('retourne "Artiste inconnu" si album_artists est vide', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: makeVinylDbResult({
          albums: {
            id: 'alb1',
            title: 'Album Test',
            cover_url: null,
            year: 2000,
            album_artists: [],
          },
        }),
        error: null,
      })

      const res = await service.getById('v1')

      expect(res.album.artists).toHaveLength(1)
      expect(res.album.artists[0]).toEqual({ id: '', name: 'Artiste inconnu', imageUrl: null })
    })

    it('filtre les album_artists dont id ou name est vide', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: makeVinylDbResult({
          albums: {
            id: 'alb1',
            title: 'Album Test',
            cover_url: null,
            year: 2000,
            album_artists: [
              { position: 1, artist: [{ id: 'aa1', name: '', image_url: null }] },
              { position: 2, artist: [{ id: 'aa2', name: 'Artist valide', image_url: null }] },
            ],
          },
        }),
        error: null,
      })

      const res = await service.getById('v1')

      expect(res.album.artists).toHaveLength(1)
      expect(res.album.artists[0].name).toBe('Artist valide')
    })
  })

  // -----------------------------------------------------------------------
  // Valeurs nulles / manquantes
  // -----------------------------------------------------------------------

  describe('valeurs nulles', () => {
    it('gère cover_url null sur le vinyl', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: makeVinylDbResult({ cover_url: null }),
        error: null,
      })

      const res = await service.getById('v1')

      expect(res.coverUrl).toBeNull()
    })

    it('lève une erreur si albums est null — intégrité des données', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: makeVinylDbResult({ albums: null }),
        error: null,
      })

      await expect(service.getById('v1')).rejects.toThrow('Album not found for vinyl v1')
    })

    it('lève une erreur si artist[0] est absent dans vinyl_artists — intégrité des données', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: makeVinylDbResult({
          vinyl_artists: [{ position: 1, artist: [] }],
        }),
        error: null,
      })

      await expect(service.getById('v1')).rejects.toThrow(
        'Artist missing in vinyl_artists join — data integrity issue',
      )
    })

    it('lève une erreur si artist[0] est absent dans album_artists — intégrité des données', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: makeVinylDbResult({
          albums: {
            id: 'alb1',
            title: 'Kind of Blue',
            cover_url: null,
            year: 1959,
            album_artists: [{ position: 1, artist: [] }],
          },
        }),
        error: null,
      })

      await expect(service.getById('v1')).rejects.toThrow(
        'Artist missing in album_artists join — data integrity issue',
      )
    })
  })

  // -----------------------------------------------------------------------
  // Erreurs Supabase → NotFoundException
  // -----------------------------------------------------------------------

  describe('erreurs', () => {
    it('lève NotFoundException si Supabase retourne une erreur', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: { message: 'not found' } })

      await expect(service.getById('xxx')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lève NotFoundException si data est null sans erreur', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null })

      await expect(service.getById('xxx')).rejects.toBeInstanceOf(NotFoundException)
    })

    it("inclut l'id dans le message d'erreur", async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: true })

      await expect(service.getById('xyz')).rejects.toThrow('xyz')
    })
  })
})
