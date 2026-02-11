import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class SocketClient {
  private socket: Socket | null = null
  private userId: string | null = null

  /**
   * Initialise la connexion Socket.IO
   * Appelé automatiquement lors du login
   */
  connect(userId: string) {
    if (this.socket?.connected && this.userId === userId) {
      console.log('✅ Socket déjà connecté (skip)')
      return
    }

    // Déconnecter l'ancien socket si userId a changé
    if (this.socket && this.userId !== userId) {
      console.log('🔄 UserId changed, disconnecting old socket')
      this.socket.disconnect()
      this.socket = null
    }

    this.userId = userId

    console.log('🔌 Connecting Socket.IO...')
    
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connecté:', this.socket?.id)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO déconnecté:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion Socket.IO:', error.message)
    })
  }

  /**
   * Déconnecte le socket
   * Appelé automatiquement lors du logout
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.userId = null
      console.log('✅ Socket.IO déconnecté')
    }
  }

  /**
   * Rejoint une room (ex: post:123)
   */
  joinRoom(room: string) {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket non connecté, impossible de join:', room)
      return
    }

    this.socket.emit('joinRoom', { room })
    console.log('📥 Joined room:', room)
  }

  /**
   * Quitte une room
   */
  leaveRoom(room: string) {
    if (!this.socket?.connected) {
      return
    }

    this.socket.emit('leaveRoom', { room })
    console.log('📤 Left room:', room)
  }

  /**
   * Écoute un événement
   */
  on<T = any>(event: string, callback: (data: T) => void) {
    if (!this.socket) {
      console.warn('⚠️ Socket non initialisé, impossible d\'écouter:', event)
      return
    }

    this.socket.on(event, callback)
  }

  /**
   * Retire un listener
   */
  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) return

    if (callback) {
      this.socket.off(event, callback)
    } else {
      this.socket.off(event)
    }
  }

  /**
   * Vérifie si le socket est connecté
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Récupère l'ID du socket (pour debug)
   */
  getSocketId(): string | undefined {
    return this.socket?.id
  }
}

// Instance unique (singleton)
export const socketClient = new SocketClient()