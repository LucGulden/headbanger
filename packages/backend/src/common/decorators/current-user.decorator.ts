import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export interface AuthenticatedUser {
  id: string;
  email: string;
  token: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const user = request['user'];
    const token = request['token'];

    if (!user || !token) {
      throw new Error('User not found in request. Did you forget @UseGuards(AuthGuard)?');
    }

    return {
      id: user.id,
      email: user.email,
      token,
    };
  },
);