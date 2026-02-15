import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { StorageService } from './storage.service'
import { SupabaseService } from '../common/database/supabase.service'

// -------------------------------------------------------------------------
// Mock Supabase storage chain
// -------------------------------------------------------------------------

const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockRemove = jest.fn()

const mockFrom = jest.fn(() => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  remove: mockRemove,
}))

const mockStorageClient = {
  storage: { from: mockFrom },
}

const mockSupabaseService = {
  getClientWithAuth: jest.fn(() => mockStorageClient),
}

// -------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------

const makeBuffer = (size = 100) => Buffer.alloc(size)
const BIG_BUFFER = Buffer.alloc(6 * 1024 * 1024) // 6MB — dépasse la limite

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('StorageService', () => {
  let service: StorageService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService, { provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile()

    service = module.get<StorageService>(StorageService)
  })

  // -----------------------------------------------------------------------
  // uploadAvatar
  // -----------------------------------------------------------------------

  describe('uploadAvatar', () => {
    it('lève BadRequestException si le type MIME est non supporté', async () => {
      await expect(
        service.uploadAvatar('token', 'u1', makeBuffer(), 'application/pdf'),
      ).rejects.toThrow(BadRequestException)
    })

    it('lève BadRequestException si le fichier dépasse 5MB', async () => {
      await expect(service.uploadAvatar('token', 'u1', BIG_BUFFER, 'image/jpeg')).rejects.toThrow(
        '5MB',
      )
    })

    it('lève BadRequestException si Supabase upload échoue', async () => {
      mockUpload.mockResolvedValue({ error: { message: 'Storage error' } })

      await expect(service.uploadAvatar('token', 'u1', makeBuffer(), 'image/jpeg')).rejects.toThrow(
        "Erreur lors de l'upload: Storage error",
      )
    })

    it("retourne l'URL publique si l'upload réussit", async () => {
      mockUpload.mockResolvedValue({ error: null })
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/u1.webp' } })

      const result = await service.uploadAvatar('token', 'u1', makeBuffer(), 'image/png')

      expect(result).toBe('https://cdn.example.com/u1.webp')
    })

    it('utilise le token pour getClientWithAuth', async () => {
      mockUpload.mockResolvedValue({ error: null })
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/u1.webp' } })

      await service.uploadAvatar('my-token', 'u1', makeBuffer(), 'image/webp')

      expect(mockSupabaseService.getClientWithAuth).toHaveBeenCalledWith('my-token')
    })

    it('nomme le fichier {userId}.webp', async () => {
      mockUpload.mockResolvedValue({ error: null })
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/u1.webp' } })

      await service.uploadAvatar('token', 'u1', makeBuffer(), 'image/jpeg')

      expect(mockUpload).toHaveBeenCalledWith(
        'u1.webp',
        expect.any(Buffer),
        expect.objectContaining({ upsert: true }),
      )
    })

    it('accepte tous les types MIME autorisés', async () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

      for (const mimetype of allowedTypes) {
        mockUpload.mockResolvedValue({ error: null })
        mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/u1.webp' } })

        await expect(
          service.uploadAvatar('token', 'u1', makeBuffer(), mimetype),
        ).resolves.toBeDefined()
      }
    })
  })

  // -----------------------------------------------------------------------
  // deleteAvatar
  // -----------------------------------------------------------------------

  describe('deleteAvatar', () => {
    it('lève BadRequestException si Supabase remove échoue', async () => {
      mockRemove.mockResolvedValue({ error: { message: 'File not found' } })

      await expect(service.deleteAvatar('token', 'u1')).rejects.toThrow(
        'Erreur lors de la suppression: File not found',
      )
    })

    it("supprime le fichier {userId}.webp sans erreur si l'opération réussit", async () => {
      mockRemove.mockResolvedValue({ error: null })

      await expect(service.deleteAvatar('token', 'u1')).resolves.toBeUndefined()

      expect(mockRemove).toHaveBeenCalledWith(['u1.webp'])
    })

    it('utilise le token pour getClientWithAuth', async () => {
      mockRemove.mockResolvedValue({ error: null })

      await service.deleteAvatar('my-token', 'u1')

      expect(mockSupabaseService.getClientWithAuth).toHaveBeenCalledWith('my-token')
    })
  })
})
