import { Module } from '@nestjs/common';
import { UserVinylsController } from './user-vinyls.controller';
import { UserVinylsService } from './user-vinyls.service';
import { VinylsModule } from '../vinyls/vinyls.module';

@Module({
  imports: [VinylsModule], // Pour injecter VinylsService
  controllers: [UserVinylsController],
  providers: [UserVinylsService],
  exports: [UserVinylsService],
})
export class UserVinylsModule {}