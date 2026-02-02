import { Module } from '@nestjs/common';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [UsersModule, NotificationsModule],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
