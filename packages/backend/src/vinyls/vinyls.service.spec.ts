import { Test, TestingModule } from '@nestjs/testing'
import { VinylsService } from './vinyls.service'
import { SupabaseService } from '../common/database/supabase.service'
import { NotFoundException } from '@nestjs/common'

// Mock du supabase client
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
      providers: [
        VinylsService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile()
    service = module.get<VinylsService>(VinylsService)
  })

  // --- CAS 1 : Donnée trouvée ---
  it('devrait retourner un vinyl transformé', async () => {
    const fakeDbResult = {
      id: '123',
      title: 'Test Vinyl',
      cover_url: 'cover.png',
      year: 1999,
      label: 'Test Label',
      catalog_number: 'ABC123',
      country: 'FR',
      format: 'LP',
      vinyl_artists: [
        {
          position: 2,
          artist: [
            {
              id: 'a2',
              name: 'Artist 2',
              image_url: null,
            },
          ],
        },
        {
          position: 1,
          artist: [
            {
              id: 'a1',
              name: 'Artist 1',
              image_url: 'img1.png',
            },
          ],
        },
      ],
      albums: {
        id: 'alb1',
        title: 'Best Album',
        cover_url: 'album.png',
        year: 2000,
        album_artists: [
          {
            position: 1,
            artist: [
              {
                id: 'aa1',
                name: 'Album Artist 1',
                image_url: null,
              },
            ],
          },
        ],
      },
    }

    mockSupabaseClient.single.mockResolvedValue({
      data: fakeDbResult,
      error: null,
    })

    const vinyl = await service.getById('123')
    expect(vinyl.id).toBe('123')
    expect(vinyl.artists[0].name).toBe('Artist 1')

    // tri des artistes
    expect(vinyl.album.title).toBe('Best Album')
    expect(mockSupabaseService.getClient).toHaveBeenCalled()
  })

  // --- CAS 2 : NotFoundException ---
  it('devrait lancer NotFoundException si aucun vinyl trouvé', async () => {
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: true,
    })
    await expect(service.getById('BAD_ID')).rejects.toBeInstanceOf(NotFoundException)
  })

  // --- CAS 3 : fallback artiste / album ---
  it('devrait retourner artiste et album inconnus si aucune donnée', async () => {
    const resultSansArtistes = {
      id: '123',
      title: 'Vinyl Test',
      cover_url: null,
      year: null,
      label: null,
      catalog_number: null,
      country: null,
      format: null,
      vinyl_artists: [],
      albums: null,
    }

    mockSupabaseClient.single.mockResolvedValue({
      data: resultSansArtistes,
      error: null,
    })
    const vinyl = await service.getById('123')
    expect(vinyl.artists[0].name).toBe('Artiste inconnu')
    expect(vinyl.album.title).toBe('Album inconnu')
  })
})
