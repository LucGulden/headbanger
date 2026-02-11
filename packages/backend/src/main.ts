import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;

  // Plugin cookies Fastify
  await app.register(fastifyCookie as any, {
    secret: configService.get<string>('JWT_SECRET'),
  });

  // CORS pour le frontend
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // Validation globale avec messages génériques
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        // ✅ Logger SEULEMENT les contraintes, pas les valeurs
        const sanitizedErrors = errors.map(err => ({
          property: err.property,
          constraints: err.constraints,
          // ❌ Ne PAS logger err.value ni err.target (contient le password)
        }));
        
        console.error('Validation errors:', sanitizedErrors);
        
        return {
          statusCode: 400,
          message: 'Invalid request data',
        };
      },
    }),
  );

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap();