import { Test, TestingModule } from '@nestjs/testing'
import { AlbumsController } from './albums.controller'
import { AlbumsService } from './albums.service'

const mockAlbumsService = {
  searchAlbums: jest.fn(),
  findById: jest.fn(),
}

describe('AlbumsController', () => {
  let controller: AlbumsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlbumsController],
      providers: [{ provide: AlbumsService, useValue: mockAlbumsService }],
    }).compile()

    controller = module.get<AlbumsController>(AlbumsController)
  })

  describe('search', () => {
    it('délègue à searchAlbums avec les paramètres parsés', async () => {
      mockAlbumsService.searchAlbums.mockResolvedValue([])

      await controller.search('abbey', '5', '10')

      expect(mockAlbumsService.searchAlbums).toHaveBeenCalledWith('abbey', 5, 10)
    })

    it('applique les valeurs par défaut si limit et offset sont absents', async () => {
      mockAlbumsService.searchAlbums.mockResolvedValue([])

      await controller.search('abbey')

      expect(mockAlbumsService.searchAlbums).toHaveBeenCalledWith('abbey', 20, 0)
    })

    it('retourne le résultat du service', async () => {
      const albums = [{ id: 'alb1', title: 'Abbey Road' }]
      mockAlbumsService.searchAlbums.mockResolvedValue(albums)

      const result = await controller.search('abbey')

      expect(result).toEqual(albums)
    })
  })

  describe('getById', () => {
    it('délègue à findById avec le bon id', async () => {
      mockAlbumsService.findById.mockResolvedValue({ id: 'alb1' })

      await controller.getById('alb1')

      expect(mockAlbumsService.findById).toHaveBeenCalledWith('alb1')
    })

    it('retourne le résultat du service', async () => {
      const album = { id: 'alb1', title: 'Abbey Road' }
      mockAlbumsService.findById.mockResolvedValue(album)

      const result = await controller.getById('alb1')

      expect(result).toEqual(album)
    })
  })
})
