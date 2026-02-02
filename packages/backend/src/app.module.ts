import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlbumsModule } from './albums/albums.module';

@Module({
  imports: [
    // Configuration globale depuis .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Modules métier
    AlbumsModule,
  ],
})
export class AppModule {}