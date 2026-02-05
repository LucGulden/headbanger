import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Session } from '../common/interfaces/session.interface';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = new Redis({
        host: this.configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(this.configService.get<string>('REDIS_PORT') || '6379'),
        password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      });

      this.client.on('connect', () => {
        this.logger.log('✅ Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.logger.error('❌ Redis connection error:', error);
      });

      // Test de connexion
      await this.client.ping();
      this.logger.log('🏓 Redis ping successful');
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Stocke une session dans Redis avec TTL
   */
  async setSession(sessionId: string, session: Session): Promise<void> {
    const ttl = parseInt(this.configService.get<string>('SESSION_EXPIRES_IN') || '86400');
    const key = `session:${sessionId}`;
    
    await this.client.setex(
      key,
      ttl,
      JSON.stringify({
        ...session,
        createdAt: session.createdAt.toISOString(),
        lastActivity: session.lastActivity.toISOString(),
      })
    );
    
    this.logger.debug(`Session ${sessionId} stored with TTL ${ttl}s`);
  }

  /**
   * Récupère une session depuis Redis
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const key = `session:${sessionId}`;
    const data = await this.client.get(key);
    
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    
    // Reconstruit les objets Date
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      lastActivity: new Date(parsed.lastActivity),
    };
  }

  /**
   * Supprime une session de Redis
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.client.del(key);
    this.logger.debug(`Session ${sessionId} deleted`);
  }

  /**
   * Met à jour le lastActivity d'une session
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    
    if (session) {
      session.lastActivity = new Date();
      await this.setSession(sessionId, session);
    }
  }

  /**
   * Récupère toutes les sessions d'un utilisateur
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const keys = await this.client.keys('session:*');
    const sessions: Session[] = [];

    for (const key of keys) {
      const session = await this.getSession(key.replace('session:', ''));
      if (session && session.userId === userId) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Health check Redis
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }
}