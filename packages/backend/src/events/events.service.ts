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
    console.log(`📡 [EventsService] Emitting to room "${room}" → event: "${event}"`, data);
    this.server.to(room).emit(event, data);
    console.log(`✅ [EventsService] Event emitted`);
  }

  /**
   * Émet un événement vers un utilisateur spécifique (room: user:${userId})
   */
  emitToUser(userId: string, event: string, data: any) {
    this.emitToRoom(`user:${userId}`, event, data);
  }

  /**
   * Émet un événement vers un post spécifique (room: post:${postId})
   */
  emitToPost(postId: string, event: string, data: any) {
    console.log(`📡 [EventsService] emitToPost called for post:${postId}`);
    this.emitToRoom(`post:${postId}`, event, data);
  }
}