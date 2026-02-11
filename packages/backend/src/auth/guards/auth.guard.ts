import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { RedisService } from '../../redis/redis.service';

// Helper pour extraire les cookies
function getCookie(request: FastifyRequest, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return cookies[name];
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // 1. Lire cookie auth_token
    const token = getCookie(request, 'auth_token');

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // 2. Valider JWT backend
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (!payload.sessionId || !payload.userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // 3. Récupérer session Redis
      const session = await this.redisService.getSession(payload.sessionId);

      if (!session) {
        throw new UnauthorizedException('Session expired or invalid');
      }

      // 4. Attacher à la requête
      request['user'] = { id: session.userId };
      request['session'] = session;
      request['token'] = session.supabaseAccessToken; // Pour compatibilité avec l'ancien code

      // 5. Mettre à jour lastActivity (async, non-bloquant)
      this.redisService.updateLastActivity(session.id).catch((err) => {
        console.error('Failed to update last activity:', err);
      });

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
