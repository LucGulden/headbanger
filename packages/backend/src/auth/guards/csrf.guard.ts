import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Récupérer la session (doit être appelé après AuthGuard)
    const session = request['session'];

    if (!session) {
      throw new ForbiddenException('No session found for CSRF validation');
    }

    // CSRF token depuis le header
    const csrfFromHeader = request.headers['x-csrf-token'];

    // CSRF token depuis la session
    const csrfFromSession = session.csrfToken;

    if (!csrfFromHeader || csrfFromHeader !== csrfFromSession) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
