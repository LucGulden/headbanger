import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, BadRequestException, ValidationError } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from './app.module';
import multipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;

  // Plugin cookies Fastify
  await app.register(fastifyCookie, {
    secret: configService.get<string>('JWT_SECRET'),
  });

  // CORS pour le frontend
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // Support multipart/form-data pour uploads
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
      files: 1, // 1 fichier à la fois
    },
  });

  // Validation globale avec messages génériques
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      exceptionFactory: (errors: ValidationError[]) => {
        // ✅ Logger SEULEMENT les contraintes, pas les valeurs
        const sanitizedErrors = errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
          // ❌ Ne PAS logger err.value ni err.target (contient le password)
        }));

        console.error('Validation errors:', sanitizedErrors);
        return new BadRequestException('Invalid request data');
      },
    }),
  );

  await app.listen(port, '0.0.0.0');
}

bootstrap();
