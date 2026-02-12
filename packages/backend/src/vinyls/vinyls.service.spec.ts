import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { VinylsService } from './vinyls.service'
import { SupabaseService } from '../common/database/supabase.service'
import type { VinylByIdQueryResult } from './vinyls.types'

// Mock du client Supabase (chaînage .from().select().eq().single())
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
}

const mockSupabaseService = {
  getClient: jest.fn(() => mockSupabaseClient),
}

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
  // 1️⃣ CAS NOMINAL
  // -----------------------------------------------------------------------
  it('retourne un vinyl transformé (cas nominal)', async () => {
    const fakeDbResult: VinylByIdQueryResult = {
      id: 'v1',
      title: 'Vinyl Test',
      cover_url: 'cover.png',
      year: 1999,
      label: 'Lbl',
      catalog_number: 'CAT-001',
      country: 'FR',
      format: 'LP',
      album_id: 'alb1',
      vinyl_artists: [
        { position: 2, artist: [{ id: 'a2', name: 'Artist 2', image_url: null }] },
        { position: 1, artist: [{ id: 'a1', name: 'Artist 1', image_url: 'a1.png' }] },
      ],
      albums: {
        id: 'alb1',
        title: 'Album 1',
        cover_url: 'alb.png',
        year: 2000,
        album_artists: [
          { position: 2, artist: [{ id: 'aa2', name: 'Album Artist 2', image_url: null }] },
          { position: 1, artist: [{ id: 'aa1', name: 'Album Artist 1', image_url: null }] },
        ],
      },
    }

    mockSupabaseClient.single.mockResolvedValue({ data: fakeDbResult, error: null })

    const res = await service.getById('v1')

    expect(res.title).toBe('Vinyl Test')
    expect(res.artists.map((a) => a.name)).toEqual(['Artist 1', 'Artist 2']) // tri OK
    expect(res.album.artists.map((a) => a.name)).toEqual(['Album Artist 1', 'Album Artist 2'])
  })

  // -----------------------------------------------------------------------
  // 2️⃣ VINYL_ARTISTS VIDE → fallback "Artiste inconnu"
  // -----------------------------------------------------------------------
  it('retourne un fallback artistes si vinyl_artists est vide', async () => {
    const noVinylArtists: VinylByIdQueryResult = {
      id: 'v2',
      title: 'Sans artistes',
      cover_url: null,
      year: 2020,
      label: 'Label2',
      catalog_number: 'Catalogue2',
      country: 'UK',
      format: '33RPM',
      album_id: 'alb2',
      vinyl_artists: [], // <-- important
      albums: {
        id: 'alb2',
        title: 'Album OK',
        cover_url: null,
        year: 2020,
        album_artists: [
          { position: 1, artist: [{ id: 'aa1', name: 'Album Artist 1', image_url: null }] },
        ],
      },
    }

    mockSupabaseClient.single.mockResolvedValue({ data: noVinylArtists, error: null })

    const res = await service.getById('v2')

    expect(res.artists).toHaveLength(1)
    expect(res.artists[0].name).toBe('Artiste inconnu')
  })

  // -----------------------------------------------------------------------
  // 3️⃣ ALBUM_ARTISTS VIDE → fallback artiste pour l’album
  // -----------------------------------------------------------------------
  it('retourne un fallback artiste album si album_artists est vide', async () => {
    const noAlbumArtists: VinylByIdQueryResult = {
      id: 'v3',
      title: 'Album sans artistes',
      cover_url: null,
      year: 2021,
      label: 'label3',
      catalog_number: 'Catalogue3',
      country: 'FRANCE',
      format: 'LP',
      album_id: 'alb3',
      vinyl_artists: [{ position: 1, artist: [{ id: 'a1', name: 'Artist 1', image_url: null }] }],
      albums: {
        id: 'alb3',
        title: 'Album 3',
        cover_url: null,
        year: 2021,
        album_artists: [], // <-- vide
      },
    }

    mockSupabaseClient.single.mockResolvedValue({ data: noAlbumArtists, error: null })

    const res = await service.getById('v3')

    expect(res.album.artists).toHaveLength(1)
    expect(res.album.artists[0].name).toBe('Artiste inconnu')
  })

  // -----------------------------------------------------------------------
  // 4️⃣ Introuvable → NotFoundException
  // -----------------------------------------------------------------------
  it('lève NotFoundException si aucun vinyl trouvé', async () => {
    mockSupabaseClient.single.mockResolvedValue({ data: null, error: true })
    await expect(service.getById('xxx')).rejects.toBeInstanceOf(NotFoundException)
  })
})
