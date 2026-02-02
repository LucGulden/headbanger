import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './database/supabase.service';

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class CommonModule {}
