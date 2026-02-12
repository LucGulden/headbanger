import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/database/supabase.service';
import { RedisService } from '../redis/redis.service';
import { Session } from '../common/database/database.types';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Inscription utilisateur via Supabase Auth
   */
  async signup(email: string, username: string, password: string, ip?: string, userAgent?: string) {
    this.logger.log(`Signup attempt for: ${email} (username: ${username})`);

    // 1. Appel Supabase Auth avec username dans les metadata
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      this.logger.error(`Signup failed for ${email}:`, error.message);
      throw new UnauthorizedException(error.message);
    }

    if (!data.session) {
      throw new UnauthorizedException('No session created after signup');
    }

    if (!data.user) {
      throw new UnauthorizedException('No user created after signup');
    }

    this.logger.log(`✅ User created: ${data.user.id} (${username})`);

    // 2. Créer session Redis + JWT backend
    return this.createSessionAndToken(data.user.id, data.session, ip, userAgent);
  }

  /**
   * Connexion utilisateur via Supabase Auth
   */
  async login(email: string, password: string, ip?: string, userAgent?: string) {
    this.logger.log(`Login attempt for: ${email}`);

    // 1. Appel Supabase Auth
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.logger.error(`Login failed for ${email}:`, error.message);
      throw new UnauthorizedException(error.message);
    }

    if (!data.session) {
      throw new UnauthorizedException('No session created after login');
    }

    if (!data.user) {
      throw new UnauthorizedException('No user found after login');
    }

    this.logger.log(`✅ User logged in: ${data.user.id}`);

    // 2. Créer session Redis + JWT backend
    return this.createSessionAndToken(data.user.id, data.session, ip, userAgent);
  }

  /**
   * Déconnexion utilisateur
   */
  async logout(sessionId: string) {
    this.logger.log(`Logout session: ${sessionId}`);
    await this.redisService.deleteSession(sessionId);
  }

  /**
   * Refresh du token JWT backend
   */
  async refresh(sessionId: string) {
    this.logger.log(`Refreshing session: ${sessionId}`);

    // 1. Récupérer session Redis
    const session = await this.redisService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // 2. Refresh Supabase token
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: session.supabaseAccessToken,
      refresh_token: session.supabaseRefreshToken,
    });

    if (error) {
      this.logger.error(`Refresh failed for session ${sessionId}:`, error.message);
      throw new UnauthorizedException(error.message);
    }

    if (!data.session) {
      throw new UnauthorizedException('No session returned from refresh');
    }

    // 3. Mettre à jour session Redis
    session.supabaseAccessToken = data.session.access_token;
    session.supabaseRefreshToken = data.session.refresh_token;
    session.lastActivity = new Date();
    await this.redisService.setSession(sessionId, session);

    this.logger.log(`✅ Session refreshed: ${sessionId}`);

    // 4. Retourner nouveau JWT backend
    return this.generateJwt(sessionId, session.userId);
  }

  /**
   * Récupérer les informations utilisateur depuis une session
   */
  async getUserFromSession(sessionId: string) {
    const session = await this.redisService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // Récupérer les infos user depuis Supabase avec le token
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.getUser(session.supabaseAccessToken);

    if (error || !data.user) {
      throw new UnauthorizedException('Failed to get user');
    }

    return {
      id: data.user.id,
      email: data.user.email,
      // Ajoute d'autres champs si besoin
    };
  }

  /**
   * Créer une session Redis et générer un JWT backend
   * @private
   */
  private async createSessionAndToken(
    userId: string,
    supabaseSession: { access_token: string; refresh_token: string },
    ip?: string,
    userAgent?: string,
  ) {
    const sessionId = uuidv4();
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Session Redis
    const session: Session = {
      id: sessionId,
      userId,
      supabaseAccessToken: supabaseSession.access_token,
      supabaseRefreshToken: supabaseSession.refresh_token,
      csrfToken,
      createdAt: new Date(),
      lastActivity: new Date(),
      ip,
      userAgent,
    };

    await this.redisService.setSession(sessionId, session);

    // JWT backend (court)
    const jwt = this.generateJwt(sessionId, userId);

    this.logger.log(`✅ Session created: ${sessionId} for user: ${userId}`);

    return { jwt, csrfToken, userId };
  }

  /**
   * Générer un JWT backend
   * @private
   */
  private generateJwt(sessionId: string, userId: string): string {
    return this.jwtService.sign({ sessionId, userId });
  }

  /**
   * Valider un JWT et retourner la session
   * (utilisé par WebSocket Gateway)
   */
  async validateSession(token: string): Promise<Session | null> {
    try {
      // 1. Décoder le JWT
      const payload = this.jwtService.verify(token);
      const sessionId = payload.sessionId;

      if (!sessionId) {
        return null;
      }

      // 2. Récupérer la session depuis Redis
      const session = await this.redisService.getSession(sessionId);
      if (!session) {
        return null;
      }

      // 3. Mettre à jour lastActivity
      session.lastActivity = new Date();
      await this.redisService.setSession(sessionId, session);

      return session;
    } catch (_error) {
      this.logger.error('JWT validation failed');
      return null;
    }
  }
}
