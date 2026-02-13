import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { AlbumsService } from './albums.service'
import { SupabaseService } from '../common/database/supabase.service'
import type { AlbumQueryResult, VinylQueryResult } from './albums.types'

// -------------------------------------------------------------------------
// Mocks — albums chain couvre findById (single) et searchAlbums (range)
// -------------------------------------------------------------------------

const mockSingle = jest.fn()
const mockVinylsEq = jest.fn()
const mockRange = jest.fn()

const albumsChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: mockSingle,
  range: mockRange,
}

const vinylsChain = {
  select: jest.fn().mockReturnThis(),
  eq: mockVinylsEq,
}

const mockFrom = jest.fn()

const mockSupabaseService = {
  getClient: jest.fn(() => ({ from: mockFrom })),
}

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeAlbumQueryResult = (overrides: Partial<AlbumQueryResult> = {}): AlbumQueryResult => ({
  id: 'alb1',
  title: 'Kind of Blue',
  cover_url: 'alb.png',
  year: 1959,
  album_artists: [
    { position: 2, artist: [{ id: 'a2', name: 'Bill Evans', image_url: null }] },
    { position: 1, artist: [{ id: 'a1', name: 'Miles Davis', image_url: 'miles.png' }] },
  ],
  ...overrides,
})

const makeVinylQueryResult = (overrides: Partial<VinylQueryResult> = {}): VinylQueryResult => ({
  id: 'v1',
  title: 'Kind of Blue (US Press)',
  cover_url: 'vinyl.png',
  year: 1959,
  country: 'US',
  catalog_number: 'CS 8163',
  vinyl_artists: [
    { position: 1, artist: [{ id: 'a1', name: 'Miles Davis', image_url: 'miles.png' }] },
  ],
  ...overrides,
})

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('AlbumsService', () => {
  let service: AlbumsService

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.clearAllMocks()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'albums') return albumsChain
      if (table === 'vinyls') return vinylsChain
      return albumsChain
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [AlbumsService, { provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile()

    service = module.get<AlbumsService>(AlbumsService)
  })

  // -----------------------------------------------------------------------
  // findById — appels Supabase
  // -----------------------------------------------------------------------

  describe('findById — appels Supabase', () => {
    it('interroge la table albums avec le bon id', async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({ data: [], error: null })

      await service.findById('alb1')

      expect(mockFrom).toHaveBeenCalledWith('albums')
      expect(albumsChain.eq).toHaveBeenCalledWith('id', 'alb1')
      expect(mockSingle).toHaveBeenCalledTimes(1)
    })

    it('interroge la table vinyls avec le bon album_id', async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({ data: [], error: null })

      await service.findById('alb1')

      expect(mockFrom).toHaveBeenCalledWith('vinyls')
      expect(vinylsChain.eq).toHaveBeenCalledWith('album_id', 'alb1')
    })
  })

  // -----------------------------------------------------------------------
  // findById — mapping album
  // -----------------------------------------------------------------------

  describe('findById — mapping album', () => {
    it("mappe tous les champs de l'album", async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({ data: [], error: null })

      const res = await service.findById('alb1')

      expect(res.id).toBe('alb1')
      expect(res.title).toBe('Kind of Blue')
      expect(res.coverUrl).toBe('alb.png')
      expect(res.year).toBe(1959)
    })

    it('gère cover_url null', async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult({ cover_url: null }), error: null })
      mockVinylsEq.mockResolvedValue({ data: [], error: null })

      const res = await service.findById('alb1')

      expect(res.coverUrl).toBe('')
    })

    it('trie les album_artists par position', async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({ data: [], error: null })

      const res = await service.findById('alb1')

      expect(res.artists[0]).toEqual({ id: 'a1', name: 'Miles Davis', imageUrl: 'miles.png' })
      expect(res.artists[1]).toEqual({ id: 'a2', name: 'Bill Evans', imageUrl: null })
    })

    it('filtre les album_artists avec id ou name vide', async () => {
      mockSingle.mockResolvedValue({
        data: makeAlbumQueryResult({
          album_artists: [
            { position: 1, artist: [{ id: '', name: 'Invalid', image_url: null }] },
            { position: 2, artist: [{ id: 'a2', name: '', image_url: null }] },
            { position: 3, artist: [{ id: 'a3', name: 'Valide', image_url: null }] },
          ],
        }),
        error: null,
      })
      mockVinylsEq.mockResolvedValue({ data: [], error: null })

      const res = await service.findById('alb1')

      expect(res.artists).toHaveLength(1)
      expect(res.artists[0].name).toBe('Valide')
    })

    it('retourne "Artiste inconnu" si album_artists est vide', async () => {
      mockSingle.mockResolvedValue({
        data: makeAlbumQueryResult({ album_artists: [] }),
        error: null,
      })
      mockVinylsEq.mockResolvedValue({ data: [], error: null })

      const res = await service.findById('alb1')

      expect(res.artists).toHaveLength(1)
      expect(res.artists[0]).toEqual({ id: '', name: 'Artiste inconnu', imageUrl: null })
    })

    it('retourne un tableau vide si aucun vinyl', async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({ data: [], error: null })

      const res = await service.findById('alb1')

      expect(res.vinyls).toHaveLength(0)
    })
  })

  // -----------------------------------------------------------------------
  // findById — mapping vinyls
  // -----------------------------------------------------------------------

  describe('findById — mapping vinyls', () => {
    it("mappe tous les champs d'un vinyl", async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({ data: [makeVinylQueryResult()], error: null })

      const res = await service.findById('alb1')

      expect(res.vinyls).toHaveLength(1)
      expect(res.vinyls[0].id).toBe('v1')
      expect(res.vinyls[0].title).toBe('Kind of Blue (US Press)')
      expect(res.vinyls[0].coverUrl).toBe('vinyl.png')
      expect(res.vinyls[0].year).toBe(1959)
      expect(res.vinyls[0].country).toBe('US')
      expect(res.vinyls[0].catalogNumber).toBe('CS 8163')
    })

    it('trie les vinyl_artists par position', async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({
        data: [
          makeVinylQueryResult({
            vinyl_artists: [
              { position: 2, artist: [{ id: 'a2', name: 'Bill Evans', image_url: null }] },
              { position: 1, artist: [{ id: 'a1', name: 'Miles Davis', image_url: 'miles.png' }] },
            ],
          }),
        ],
        error: null,
      })

      const res = await service.findById('alb1')

      expect(res.vinyls[0].artists[0].name).toBe('Miles Davis')
      expect(res.vinyls[0].artists[1].name).toBe('Bill Evans')
    })

    it("utilise les artistes de l'album en fallback si vinyl_artists est vide", async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({
        data: [makeVinylQueryResult({ vinyl_artists: [] })],
        error: null,
      })

      const res = await service.findById('alb1')

      expect(res.vinyls[0].artists[0].name).toBe('Miles Davis')
      expect(res.vinyls[0].artists[1].name).toBe('Bill Evans')
    })

    it('filtre les vinyl_artists avec id ou name vide', async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({
        data: [
          makeVinylQueryResult({
            vinyl_artists: [
              { position: 1, artist: [{ id: '', name: 'Invalid', image_url: null }] },
              { position: 2, artist: [{ id: 'a2', name: 'Valide', image_url: null }] },
            ],
          }),
        ],
        error: null,
      })

      const res = await service.findById('alb1')

      expect(res.vinyls[0].artists).toHaveLength(1)
      expect(res.vinyls[0].artists[0].name).toBe('Valide')
    })
  })

  // -----------------------------------------------------------------------
  // findById — erreurs
  // -----------------------------------------------------------------------

  describe('findById — erreurs', () => {
    it('lève NotFoundException si Supabase retourne une erreur sur album', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

      await expect(service.findById('xxx')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lève NotFoundException si data est null sans erreur', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null })

      await expect(service.findById('xxx')).rejects.toBeInstanceOf(NotFoundException)
    })

    it("ne lève pas d'exception si la requête vinyls échoue", async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({ data: null, error: { message: 'vinyls error' } })

      const res = await service.findById('alb1')

      expect(res.vinyls).toHaveLength(0)
    })

    it('lève une erreur si artist[0] est absent dans album_artists — intégrité des données', async () => {
      mockSingle.mockResolvedValue({
        data: makeAlbumQueryResult({
          album_artists: [{ position: 1, artist: [] }],
        }),
        error: null,
      })
      mockVinylsEq.mockResolvedValue({ data: [], error: null })

      await expect(service.findById('alb1')).rejects.toThrow(
        'Artist missing in album_artists join — data integrity issue',
      )
    })

    it('lève une erreur si artist[0] est absent dans vinyl_artists — intégrité des données', async () => {
      mockSingle.mockResolvedValue({ data: makeAlbumQueryResult(), error: null })
      mockVinylsEq.mockResolvedValue({
        data: [makeVinylQueryResult({ vinyl_artists: [{ position: 1, artist: [] }] })],
        error: null,
      })

      await expect(service.findById('alb1')).rejects.toThrow(
        'Artist missing in vinyl_artists join — data integrity issue',
      )
    })
  })

  // -----------------------------------------------------------------------
  // searchAlbums — validations entrée
  // -----------------------------------------------------------------------

  describe('searchAlbums — validations entrée', () => {
    it('retourne [] si query est vide', async () => {
      const res = await service.searchAlbums('')
      expect(res).toEqual([])
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('retourne [] si query est un espace', async () => {
      const res = await service.searchAlbums('   ')
      expect(res).toEqual([])
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('retourne [] si query fait 1 caractère', async () => {
      const res = await service.searchAlbums('a')
      expect(res).toEqual([])
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('lance une recherche si query fait 2 caractères', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.searchAlbums('ki')

      expect(mockFrom).toHaveBeenCalledWith('albums')
    })
  })

  // -----------------------------------------------------------------------
  // searchAlbums — appels Supabase
  // -----------------------------------------------------------------------

  describe('searchAlbums — appels Supabase', () => {
    it('utilise ilike avec les bons wildcards', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.searchAlbums('kind of blue')

      expect(albumsChain.ilike).toHaveBeenCalledWith('title', '%kind of blue%')
    })

    it('trim la query avant de rechercher', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.searchAlbums('  kind of blue  ')

      expect(albumsChain.ilike).toHaveBeenCalledWith('title', '%kind of blue%')
    })

    it('applique la pagination par défaut (limit=20, offset=0)', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.searchAlbums('kind')

      expect(albumsChain.range).toHaveBeenCalledWith(0, 19)
    })

    it('applique la pagination personnalisée', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.searchAlbums('kind', 5, 10)

      expect(albumsChain.range).toHaveBeenCalledWith(10, 14)
    })
  })

  // -----------------------------------------------------------------------
  // searchAlbums — résultats
  // -----------------------------------------------------------------------

  describe('searchAlbums — résultats', () => {
    it('retourne [] si aucun résultat', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      const res = await service.searchAlbums('zzzzz')

      expect(res).toEqual([])
    })

    it('retourne [] si data est null', async () => {
      mockRange.mockResolvedValue({ data: null, error: null })

      const res = await service.searchAlbums('kind')

      expect(res).toEqual([])
    })

    it('mappe les résultats en AlbumLight', async () => {
      mockRange.mockResolvedValue({
        data: [makeAlbumQueryResult()],
        error: null,
      })

      const res = await service.searchAlbums('kind')

      expect(res).toHaveLength(1)
      expect(res[0].id).toBe('alb1')
      expect(res[0].title).toBe('Kind of Blue')
      expect(res[0].coverUrl).toBe('alb.png')
      expect(res[0].year).toBe(1959)
      expect(res[0].artists[0].name).toBe('Miles Davis')
    })

    it('retourne "Artiste inconnu" dans les résultats si album_artists est vide', async () => {
      mockRange.mockResolvedValue({
        data: [makeAlbumQueryResult({ album_artists: [] })],
        error: null,
      })

      const res = await service.searchAlbums('kind')

      expect(res[0].artists[0]).toEqual({ id: '', name: 'Artiste inconnu', imageUrl: null })
    })

    it('lève une erreur si Supabase retourne une erreur', async () => {
      mockRange.mockResolvedValue({ data: null, error: { message: 'DB error' } })

      await expect(service.searchAlbums('kind')).rejects.toThrow('Error searching albums: DB error')
    })
  })
})
