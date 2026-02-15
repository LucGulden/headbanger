import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ArtistsService } from './artists.service'
import { SupabaseService } from '../common/database/supabase.service'
import type { ArtistAlbumsQueryResult } from './artists.types'
import type { DbArtist } from '../common/database/database.types'

// -------------------------------------------------------------------------
// Mocks — deux chaînes distinctes car deux appels Supabase dans getById
// -------------------------------------------------------------------------

const mockSingle = jest.fn()
const mockOrder = jest.fn()
const mockRange = jest.fn()

const artistsChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: mockSingle,
}

const albumArtistsChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: mockOrder,
}

const searchChain = {
  select: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: mockRange,
}

const mockFrom = jest.fn()

const mockSupabaseService = {
  getClient: jest.fn(() => ({ from: mockFrom })),
}

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeDbArtist = (overrides: Partial<DbArtist> = {}): DbArtist => ({
  id: 'a1',
  name: 'Miles Davis',
  image_url: 'miles.png',
  spotify_id: 'spotify-miles',
  ...overrides,
})

const makeAlbumArtistsResult = (
  overrides: Partial<ArtistAlbumsQueryResult> = {},
): ArtistAlbumsQueryResult => ({
  position: 1,
  album: [
    {
      id: 'alb1',
      title: 'Kind of Blue',
      cover_url: 'alb.png',
      year: 1959,
      album_artists: [
        { position: 1, artist: [{ id: 'a1', name: 'Miles Davis', image_url: 'miles.png' }] },
        { position: 2, artist: [{ id: 'a2', name: 'Bill Evans', image_url: null }] },
      ],
    },
  ],
  ...overrides,
})

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('ArtistsService', () => {
  let service: ArtistsService

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.clearAllMocks()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'artists') return artistsChain
      if (table === 'album_artists') return albumArtistsChain
      return albumArtistsChain
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [ArtistsService, { provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile()

    service = module.get<ArtistsService>(ArtistsService)
  })

  // -----------------------------------------------------------------------
  // getById — appels Supabase
  // -----------------------------------------------------------------------

  describe('getById — appels Supabase', () => {
    it('interroge la table artists avec le bon id', async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({ data: [makeAlbumArtistsResult()], error: null })

      await service.getById('a1')

      expect(mockFrom).toHaveBeenCalledWith('artists')
      expect(artistsChain.eq).toHaveBeenCalledWith('id', 'a1')
    })

    it('interroge album_artists avec le bon artist_id', async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({ data: [makeAlbumArtistsResult()], error: null })

      await service.getById('a1')

      expect(mockFrom).toHaveBeenCalledWith('album_artists')
      expect(albumArtistsChain.eq).toHaveBeenCalledWith('artist_id', 'a1')
    })
  })

  // -----------------------------------------------------------------------
  // getById — mapping artiste
  // -----------------------------------------------------------------------

  describe('getById — mapping artiste', () => {
    it("mappe tous les champs de l'artiste", async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({ data: [], error: null })

      const res = await service.getById('a1')

      expect(res.id).toBe('a1')
      expect(res.name).toBe('Miles Davis')
      expect(res.imageUrl).toBe('miles.png')
      expect(res.spotifyId).toBe('spotify-miles')
    })

    it('mappe spotifyId à null si absent', async () => {
      mockSingle.mockResolvedValue({
        data: makeDbArtist({ spotify_id: null }),
        error: null,
      })
      mockOrder.mockResolvedValue({ data: [], error: null })

      const res = await service.getById('a1')

      expect(res.spotifyId).toBeNull()
    })

    it('retourne un tableau vide si aucun album', async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({ data: [], error: null })

      const res = await service.getById('a1')

      expect(res.albums).toHaveLength(0)
    })
  })

  // -----------------------------------------------------------------------
  // getById — mapping albums
  // -----------------------------------------------------------------------

  describe('getById — mapping albums', () => {
    it("mappe tous les champs d'un album", async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({ data: [makeAlbumArtistsResult()], error: null })

      const res = await service.getById('a1')

      expect(res.albums).toHaveLength(1)
      expect(res.albums[0].id).toBe('alb1')
      expect(res.albums[0].title).toBe('Kind of Blue')
      expect(res.albums[0].coverUrl).toBe('alb.png')
      expect(res.albums[0].year).toBe(1959)
    })

    it('trie les album_artists par position', async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({ data: [makeAlbumArtistsResult()], error: null })

      const res = await service.getById('a1')

      expect(res.albums[0].artists[0]).toEqual({
        id: 'a1',
        name: 'Miles Davis',
        imageUrl: 'miles.png',
      })
      expect(res.albums[0].artists[1]).toEqual({ id: 'a2', name: 'Bill Evans', imageUrl: null })
    })

    it('filtre les album_artists avec id ou name vide', async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({
        data: [
          makeAlbumArtistsResult({
            album: [
              {
                id: 'alb1',
                title: 'Album Test',
                cover_url: null,
                year: 2000,
                album_artists: [
                  { position: 1, artist: [{ id: '', name: 'Artist invalide', image_url: null }] },
                  { position: 2, artist: [{ id: 'a2', name: '', image_url: null }] },
                  { position: 3, artist: [{ id: 'a3', name: 'Artist valide', image_url: null }] },
                ],
              },
            ],
          }),
        ],
        error: null,
      })

      const res = await service.getById('a1')

      expect(res.albums[0].artists).toHaveLength(1)
      expect(res.albums[0].artists[0].name).toBe('Artist valide')
    })

    it('retourne "Artiste inconnu" si album_artists est vide', async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({
        data: [
          makeAlbumArtistsResult({
            album: [
              {
                id: 'alb1',
                title: 'Album Test',
                cover_url: null,
                year: 2000,
                album_artists: [],
              },
            ],
          }),
        ],
        error: null,
      })

      const res = await service.getById('a1')

      expect(res.albums[0].artists).toHaveLength(1)
      expect(res.albums[0].artists[0]).toEqual({ id: '', name: 'Artiste inconnu', imageUrl: null })
    })

    it('gère cover_url null sur un album', async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({
        data: [
          makeAlbumArtistsResult({
            album: [
              {
                id: 'alb1',
                title: 'Album Test',
                cover_url: null,
                year: 2000,
                album_artists: [
                  { position: 1, artist: [{ id: 'a1', name: 'Artist', image_url: null }] },
                ],
              },
            ],
          }),
        ],
        error: null,
      })

      const res = await service.getById('a1')

      expect(res.albums[0].coverUrl).toBeNull()
    })
  })

  // -----------------------------------------------------------------------
  // getById — erreurs
  // -----------------------------------------------------------------------

  describe('getById — erreurs', () => {
    it('lève NotFoundException si Supabase retourne une erreur sur artist', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

      await expect(service.getById('xxx')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lève NotFoundException si data est null sans erreur', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null })

      await expect(service.getById('xxx')).rejects.toBeInstanceOf(NotFoundException)
    })

    it("ne lève pas d'exception si la requête albums échoue", async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({ data: null, error: { message: 'albums error' } })

      const res = await service.getById('a1')

      expect(res.albums).toHaveLength(0)
    })

    it('lève une erreur si album[0] est absent dans le join — intégrité des données', async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({
        data: [makeAlbumArtistsResult({ album: [] })],
        error: null,
      })

      await expect(service.getById('a1')).rejects.toThrow(
        'Album missing in album_artists join — data integrity issue',
      )
    })

    it('lève une erreur si artist[0] est absent dans album_artists — intégrité des données', async () => {
      mockSingle.mockResolvedValue({ data: makeDbArtist(), error: null })
      mockOrder.mockResolvedValue({
        data: [
          makeAlbumArtistsResult({
            album: [
              {
                id: 'alb1',
                title: 'Album Test',
                cover_url: null,
                year: 2000,
                album_artists: [{ position: 1, artist: [] }],
              },
            ],
          }),
        ],
        error: null,
      })

      await expect(service.getById('a1')).rejects.toThrow(
        'Artist missing in album_artists join — data integrity issue',
      )
    })
  })

  // -----------------------------------------------------------------------
  // search — validations entrée
  // -----------------------------------------------------------------------

  describe('search — validations entrée', () => {
    it('retourne [] si query est vide', async () => {
      const res = await service.search('')
      expect(res).toEqual([])
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('retourne [] si query est un espace', async () => {
      const res = await service.search('   ')
      expect(res).toEqual([])
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('retourne [] si query fait 1 caractère', async () => {
      const res = await service.search('a')
      expect(res).toEqual([])
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('lance une recherche si query fait 2 caractères', async () => {
      mockFrom.mockReturnValue(searchChain)
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.search('mi')

      expect(mockFrom).toHaveBeenCalledWith('artists')
    })
  })

  // -----------------------------------------------------------------------
  // search — appels Supabase
  // -----------------------------------------------------------------------

  describe('search — appels Supabase', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue(searchChain)
    })

    it('utilise ilike avec les bons wildcards', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.search('miles')

      expect(searchChain.ilike).toHaveBeenCalledWith('name', '%miles%')
    })

    it('applique la pagination par défaut (limit=20, offset=0)', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.search('miles')

      expect(searchChain.range).toHaveBeenCalledWith(0, 19)
    })

    it('applique la pagination personnalisée', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.search('miles', 10, 30)

      expect(searchChain.range).toHaveBeenCalledWith(30, 39)
    })

    it('trim la query avant de rechercher', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      await service.search('  miles  ')

      expect(searchChain.ilike).toHaveBeenCalledWith('name', '%miles%')
    })
  })

  // -----------------------------------------------------------------------
  // search — résultats
  // -----------------------------------------------------------------------

  describe('search — résultats', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue(searchChain)
    })

    it('mappe les résultats en ArtistLight', async () => {
      mockRange.mockResolvedValue({
        data: [
          makeDbArtist({ id: 'a1', name: 'Miles Davis', image_url: 'miles.png' }),
          makeDbArtist({ id: 'a2', name: 'Miles Away', image_url: null }),
        ],
        error: null,
      })

      const res = await service.search('miles')

      expect(res).toHaveLength(2)
      expect(res[0]).toEqual({ id: 'a1', name: 'Miles Davis', imageUrl: 'miles.png' })
      expect(res[1]).toEqual({ id: 'a2', name: 'Miles Away', imageUrl: null })
    })

    it('retourne [] si aucun résultat', async () => {
      mockRange.mockResolvedValue({ data: [], error: null })

      const res = await service.search('zzzzz')

      expect(res).toEqual([])
    })

    it('lève une erreur si Supabase retourne une erreur', async () => {
      mockRange.mockResolvedValue({ data: null, error: { message: 'DB error' } })

      await expect(service.search('miles')).rejects.toThrow('Error searching artists: DB error')
    })
  })
})
