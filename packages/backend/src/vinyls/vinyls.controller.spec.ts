import { Test, TestingModule } from '@nestjs/testing'
import { VinylsController } from './vinyls.controller'
import { VinylsService } from './vinyls.service'

const mockVinylsService = {
  getById: jest.fn(),
}

describe('VinylsController', () => {
  let controller: VinylsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VinylsController],
      providers: [{ provide: VinylsService, useValue: mockVinylsService }],
    }).compile()

    controller = module.get<VinylsController>(VinylsController)
  })

  describe('getById', () => {
    it('délègue à getById avec le bon id', async () => {
      mockVinylsService.getById.mockResolvedValue({ id: 'v1' })

      await controller.getById('v1')

      expect(mockVinylsService.getById).toHaveBeenCalledWith('v1')
    })

    it('retourne le résultat du service', async () => {
      const vinyl = { id: 'v1', title: 'Kind of Blue' }
      mockVinylsService.getById.mockResolvedValue(vinyl)

      const result = await controller.getById('v1')

      expect(result).toEqual(vinyl)
    })
  })
})
