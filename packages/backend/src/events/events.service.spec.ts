import { Test, TestingModule } from '@nestjs/testing'
import { EventsService } from './events.service'
import type { Server } from 'socket.io'

// -------------------------------------------------------------------------
// Mock Server Socket.IO
// -------------------------------------------------------------------------

const mockEmit = jest.fn()
const mockTo = jest.fn(() => ({ emit: mockEmit }))
const mockServer = { to: mockTo } as unknown as Server

// -------------------------------------------------------------------------
// Suite
// -------------------------------------------------------------------------

describe('EventsService', () => {
  let service: EventsService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
    }).compile()

    service = module.get<EventsService>(EventsService)
  })

  // -----------------------------------------------------------------------
  // setServer
  // -----------------------------------------------------------------------

  describe('setServer', () => {
    it('stocke le server (emitToRoom fonctionne après setServer)', () => {
      service.setServer(mockServer)
      service.emitToRoom('room:1', 'test-event', { data: 1 })

      expect(mockTo).toHaveBeenCalledWith('room:1')
      expect(mockEmit).toHaveBeenCalledWith('test-event', { data: 1 })
    })
  })

  // -----------------------------------------------------------------------
  // emitToRoom
  // -----------------------------------------------------------------------

  describe('emitToRoom', () => {
    it("n'émet pas et log un warning si server non initialisé", () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

      service.emitToRoom('room:1', 'event', {})

      expect(mockTo).not.toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Server not initialized'))

      warnSpy.mockRestore()
    })

    it('appelle server.to(room).emit(event, data)', () => {
      service.setServer(mockServer)

      service.emitToRoom('room:p1', 'post_liked', { postId: 'p1' })

      expect(mockTo).toHaveBeenCalledWith('room:p1')
      expect(mockEmit).toHaveBeenCalledWith('post_liked', { postId: 'p1' })
    })
  })

  // -----------------------------------------------------------------------
  // emitToUser
  // -----------------------------------------------------------------------

  describe('emitToUser', () => {
    it('délègue à emitToRoom avec la room user:{userId}', () => {
      service.setServer(mockServer)

      service.emitToUser('u1', 'notification', { type: 'follow' })

      expect(mockTo).toHaveBeenCalledWith('user:u1')
      expect(mockEmit).toHaveBeenCalledWith('notification', { type: 'follow' })
    })
  })
})
