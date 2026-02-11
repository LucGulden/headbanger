import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class EventsService {
  private server: Server;

  /**
   * Méthode appelée par le WebsocketsGateway pour injecter l'instance Server
   */
  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Émet un événement vers une room spécifique
   */
  emitToRoom(room: string, event: string, data: any) {
    if (!this.server) {
      console.warn('[EventsService] Server not initialized yet');
      return;
    }
    this.server.to(room).emit(event, data);
  }

  /**
   * Émet un événement vers un utilisateur spécifique (room: user:${userId})
   */
  emitToUser(userId: string, event: string, data: any) {
    this.emitToRoom(`user:${userId}`, event, data);
  }
}
