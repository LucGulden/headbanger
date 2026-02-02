import { Module } from '@nestjs/common';
import { PostLikesController } from './post-likes.controller';
import { PostLikesService } from './post-likes.service';

@Module({
  controllers: [PostLikesController],
  providers: [PostLikesService],
  exports: [PostLikesService],
})
export class PostLikesModule {}
