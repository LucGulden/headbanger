import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { VinylsController } from './vinyls.controller'
import { VinylsService } from './vinyls.service'
import type { Vinyl } from '@headbanger/shared'

describe('VinylsController', () => {
  let controller: VinylsController
  let service: VinylsService

  const mockVinylsService = {
    getById: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VinylsController],
      providers: [
        {
          provide: VinylsService,
          useValue: mockVinylsService,
        },
      ],
    }).compile()

    controller = module.get<VinylsController>(VinylsController)
    service = module.get<VinylsService>(VinylsService)
  })

  it('devrait retourner un vinyl via le service', async () => {
    const fakeVinyl: Vinyl = {
      id: '123',
      title: 'Test Vinyl',
      artists: [],
      coverUrl: null,
      year: 2000,
      label: 'label1',
      catalogNumber: 'catalog1',
      country: 'France',
      format: '45RPM',
      album: {
        id: 'alb1',
        title: 'Album 1',
        artists: [],
        coverUrl: null,
        year: 2000,
      },
    }

    mockVinylsService.getById.mockResolvedValue(fakeVinyl)

    const res = await controller.getById('123')

    expect(service.getById).toHaveBeenCalledWith('123')
    expect(res).toEqual(fakeVinyl)
  })

  it('devrait propager la NotFoundException du service', async () => {
    mockVinylsService.getById.mockRejectedValue(new NotFoundException())

    await expect(controller.getById('inexistant')).rejects.toBeInstanceOf(NotFoundException)
  })
})
