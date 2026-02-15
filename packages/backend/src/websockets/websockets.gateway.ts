import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { JoinRoomDto } from './dto/join-room.dto'
import { LeaveRoomDto } from './dto/leave-room.dto'
import { EventsService } from '../events/events.service'
import { AuthService } from '../auth/auth.service'

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class WebsocketsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(WebsocketsGateway.name)

  constructor(
    private readonly eventsService: EventsService,
    private readonly authService: AuthService,
  ) {}

  afterInit(server: Server) {
    // Injecter le Server dans EventsService pour qu'il puisse émettre des événements
    this.eventsService.setServer(server)
    this.logger.log('WebSocket Gateway initialized')
  }

  async handleConnection(client: Socket) {
    try {
      // Extraire le token JWT depuis les cookies
      const cookies = client.handshake.headers.cookie
      if (!cookies) {
        this.logger.warn(`Client ${client.id} rejected: No cookies`)
        client.disconnect()
        return
      }

      const authToken = this.extractTokenFromCookie(cookies, 'auth_token')
      if (!authToken) {
        this.logger.warn(`Client ${client.id} rejected: No auth_token`)
        client.disconnect()
        return
      }

      // Valider le JWT
      const session = await this.authService.validateSession(authToken)
      if (!session) {
        this.logger.warn(`Client ${client.id} rejected: Invalid session`)
        client.disconnect()
        return
      }

      // Stocker userId dans le socket pour usage ultérieur
      client.data.userId = session.userId

      // Auto-join la room user:${userId} pour les notifications
      const userRoom = `user:${session.userId}`
      client.join(userRoom)

      this.logger.log(`Client ${client.id} connected (user: ${session.userId}, room: ${userRoom})`)
    } catch (error) {
      this.logger.error(`Error during client ${client.id} connection:`, error.message)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId
    this.logger.log(`Client ${client.id} disconnected${userId ? ` (user: ${userId})` : ''}`)
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() dto: JoinRoomDto, @ConnectedSocket() client: Socket) {
    client.join(dto.roomId)
    this.logger.log(`Client ${client.id} joined room: ${dto.roomId} (user: ${client.data.userId})`)
    return { success: true, room: dto.roomId }
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@MessageBody() dto: LeaveRoomDto, @ConnectedSocket() client: Socket) {
    client.leave(dto.roomId)
    this.logger.log(`Client ${client.id} left room: ${dto.roomId} (user: ${client.data.userId})`)
    return { success: true, room: dto.roomId }
  }

  /**
   * Utilitaire pour extraire un cookie depuis le header Cookie
   */
  private extractTokenFromCookie(cookieHeader: string, cookieName: string): string | null {
    const cookies = cookieHeader.split(';').map((c) => c.trim())
    const cookie = cookies.find((c) => c.startsWith(`${cookieName}=`))
    return cookie ? cookie.split('=')[1] : null
  }
}
