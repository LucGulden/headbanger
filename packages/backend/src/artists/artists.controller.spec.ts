import { Test, TestingModule } from '@nestjs/testing'
import { ArtistsController } from './artists.controller'
import { ArtistsService } from './artists.service'

const mockArtistsService = {
  getById: jest.fn(),
  search: jest.fn(),
}

describe('ArtistsController', () => {
  let controller: ArtistsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtistsController],
      providers: [{ provide: ArtistsService, useValue: mockArtistsService }],
    }).compile()

    controller = module.get<ArtistsController>(ArtistsController)
  })

  describe('getById', () => {
    it('délègue à getById avec le bon id', async () => {
      mockArtistsService.getById.mockResolvedValue({ id: 'a1' })

      await controller.getById('a1')

      expect(mockArtistsService.getById).toHaveBeenCalledWith('a1')
    })

    it('retourne le résultat du service', async () => {
      const artist = { id: 'a1', name: 'Miles Davis' }
      mockArtistsService.getById.mockResolvedValue(artist)

      const result = await controller.getById('a1')

      expect(result).toEqual(artist)
    })
  })

  describe('search', () => {
    it('délègue à search avec les paramètres convertis', async () => {
      mockArtistsService.search.mockResolvedValue([])

      await controller.search('miles', 5, 10)

      expect(mockArtistsService.search).toHaveBeenCalledWith('miles', 5, 10)
    })

    it('applique les valeurs par défaut si limit et offset sont absents', async () => {
      mockArtistsService.search.mockResolvedValue([])

      await controller.search('miles')

      expect(mockArtistsService.search).toHaveBeenCalledWith('miles', 20, 0)
    })

    it('retourne le résultat du service', async () => {
      const artists = [{ id: 'a1', name: 'Miles Davis' }]
      mockArtistsService.search.mockResolvedValue(artists)

      const result = await controller.search('miles')

      expect(result).toEqual(artists)
    })
  })
})
