import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { RedisService } from '../../redis/redis.service';

// Helper pour extraire les cookies
function getCookie(request: FastifyRequest, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[name];
}

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Lire le token même s'il est expiré
    const token = getCookie(request, 'auth_token');
    
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      // On décode sans vérifier l'expiration pour le refresh
      const payload = this.jwtService.decode(token) as any;

      if (!payload || !payload.sessionId) {
        throw new UnauthorizedException('Invalid token');
      }

      // Vérifier que la session existe toujours dans Redis
      const session = await this.redisService.getSession(payload.sessionId);
      
      if (!session) {
        throw new UnauthorizedException('Session expired');
      }

      // Attacher la session à la requête
      request['session'] = session;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}