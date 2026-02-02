import { Module } from '@nestjs/common';
import { PostLikesController } from './post-likes.controller';
import { PostLikesService } from './post-likes.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PostLikesController],
  providers: [PostLikesService],
  exports: [PostLikesService],
})
export class PostLikesModule {}
