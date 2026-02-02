import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;

  // CORS pour le frontend
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Validation globale avec messages génériques
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        // Log les erreurs détaillées côté serveur
        console.error('Validation errors:', errors);
        // Retourne un message générique au client
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