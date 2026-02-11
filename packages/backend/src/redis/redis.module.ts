import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() // Rend RedisService disponible partout sans import du module
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
