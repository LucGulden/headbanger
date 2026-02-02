import { Module } from '@nestjs/common';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { SupabaseService } from '../common/database/supabase.service';

@Module({
  controllers: [AlbumsController],
  providers: [AlbumsService, SupabaseService],
  exports: [AlbumsService], // Exporte si d'autres modules en ont besoin
})
export class AlbumsModule {}