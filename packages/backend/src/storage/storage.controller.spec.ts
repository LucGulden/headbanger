import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { StorageController } from './storage.controller'
import { StorageService } from './storage.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'
import type { FastifyRequest } from 'fastify'

// -------------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------------

const mockStorageService = {
  uploadAvatar: jest.fn(),
  deleteAvatar: jest.fn(),
}

const mockUser: AuthenticatedUser = { id: 'u1' } as AuthenticatedUser
const mockToken = 'mock-token'

// Fastify multipart file mock
const makeFileMock = (overrides: object = {}) => ({
  mimetype: 'image/png',
  toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(100)),
  ...overrides,
})

const makeRequest = (fileMock: object | null): Partial<FastifyRequest> & { file: jest.Mock } => ({
  file: jest.fn().mockResolvedValue(fileMock),
})

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('StorageController', () => {
  let controller: StorageController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [{ provide: StorageService, useValue: mockStorageService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<StorageController>(StorageController)
  })

  // -----------------------------------------------------------------------
  // uploadAvatar
  // -----------------------------------------------------------------------

  describe('uploadAvatar', () => {
    it("lève BadRequestException si aucun fichier n'est fourni", async () => {
      const req = makeRequest(null)

      await expect(
        controller.uploadAvatar(mockToken, mockUser, req as unknown as FastifyRequest),
      ).rejects.toThrow('Aucun fichier fourni')
    })

    it('délègue à uploadAvatar avec token, userId, buffer et mimetype', async () => {
      const buffer = Buffer.alloc(200)
      const file = makeFileMock({
        mimetype: 'image/jpeg',
        toBuffer: jest.fn().mockResolvedValue(buffer),
      })
      const req = makeRequest(file)
      mockStorageService.uploadAvatar.mockResolvedValue('https://cdn.example.com/u1.webp')

      await controller.uploadAvatar(mockToken, mockUser, req as unknown as FastifyRequest)

      expect(mockStorageService.uploadAvatar).toHaveBeenCalledWith(
        mockToken,
        'u1',
        buffer,
        'image/jpeg',
      )
    })

    it("retourne { url } avec l'URL du service", async () => {
      const req = makeRequest(makeFileMock())
      mockStorageService.uploadAvatar.mockResolvedValue('https://cdn.example.com/u1.webp')

      const result = await controller.uploadAvatar(
        mockToken,
        mockUser,
        req as unknown as FastifyRequest,
      )

      expect(result).toEqual({ url: 'https://cdn.example.com/u1.webp' })
    })

    it('lève BadRequestException si le service lève une exception', async () => {
      const req = makeRequest(makeFileMock())
      mockStorageService.uploadAvatar.mockRejectedValue(
        new BadRequestException('Type non supporté'),
      )

      await expect(
        controller.uploadAvatar(mockToken, mockUser, req as unknown as FastifyRequest),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // -----------------------------------------------------------------------
  // deleteAvatar
  // -----------------------------------------------------------------------

  describe('deleteAvatar', () => {
    it('délègue à deleteAvatar avec token et userId', async () => {
      mockStorageService.deleteAvatar.mockResolvedValue(undefined)

      await controller.deleteAvatar(mockToken, mockUser)

      expect(mockStorageService.deleteAvatar).toHaveBeenCalledWith(mockToken, 'u1')
    })

    it('retourne { success: true }', async () => {
      mockStorageService.deleteAvatar.mockResolvedValue(undefined)

      const result = await controller.deleteAvatar(mockToken, mockUser)

      expect(result).toEqual({ success: true })
    })
  })
})
