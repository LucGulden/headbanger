import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'

describe('AppController', () => {
  let controller: AppController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile()

    controller = module.get<AppController>(AppController)
  })

  describe('health', () => {
    it('retourne status ok', () => {
      const result = controller.health()

      expect(result.status).toBe('ok')
    })

    it('retourne un timestamp ISO valide', () => {
      const result = controller.health()

      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp)
    })
  })
})
