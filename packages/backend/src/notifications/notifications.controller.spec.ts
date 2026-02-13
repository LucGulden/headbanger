import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { AuthGuard } from '../auth/guards/auth.guard'
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator'

const mockNotificationsService = {
  getNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
  markAllAsRead: jest.fn(),
}

const mockUser: AuthenticatedUser = { id: 'u1' } as AuthenticatedUser
const mockToken = 'mock-token'

describe('NotificationsController', () => {
  let controller: NotificationsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockNotificationsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<NotificationsController>(NotificationsController)
  })

  describe('getNotifications', () => {
    it('délègue à getNotifications avec token, userId et limit parsée', async () => {
      mockNotificationsService.getNotifications.mockResolvedValue([])

      await controller.getNotifications(mockToken, mockUser, 10, '2024-01-01T00:00:00Z')

      expect(mockNotificationsService.getNotifications).toHaveBeenCalledWith(
        mockToken,
        'u1',
        10,
        '2024-01-01T00:00:00Z',
      )
    })

    it('applique la limite par défaut (20) si absente', async () => {
      mockNotificationsService.getNotifications.mockResolvedValue([])

      await controller.getNotifications(mockToken, mockUser)

      expect(mockNotificationsService.getNotifications).toHaveBeenCalledWith(
        mockToken,
        'u1',
        20,
        undefined,
      )
    })

    it('retourne le résultat du service', async () => {
      const notifs = [{ id: 'n1', type: 'post_like' }]
      mockNotificationsService.getNotifications.mockResolvedValue(notifs)

      const result = await controller.getNotifications(mockToken, mockUser)

      expect(result).toEqual(notifs)
    })
  })

  describe('getUnreadCount', () => {
    it('délègue à getUnreadCount avec token et userId', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue(4)

      await controller.getUnreadCount(mockToken, mockUser)

      expect(mockNotificationsService.getUnreadCount).toHaveBeenCalledWith(mockToken, 'u1')
    })

    it('retourne { count } avec la valeur du service', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue(4)

      const result = await controller.getUnreadCount(mockToken, mockUser)

      expect(result).toEqual({ count: 4 })
    })
  })

  describe('markAllAsRead', () => {
    it('délègue à markAllAsRead avec token et userId', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(undefined)

      await controller.markAllAsRead(mockToken, mockUser)

      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith(mockToken, 'u1')
    })

    it('retourne { success: true }', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(undefined)

      const result = await controller.markAllAsRead(mockToken, mockUser)

      expect(result).toEqual({ success: true })
    })
  })
})
