import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AlbumsModule } from './albums/albums.module'
import { ArtistsModule } from './artists/artists.module'
import { VinylsModule } from './vinyls/vinyls.module'
import { UserVinylsModule } from './user-vinyls/user-vinyls.module'
import { UsersModule } from './users/users.module'
import { FollowsModule } from './follows/follows.module'
import { PostsModule } from './posts/posts.module'
import { PostLikesModule } from './post-likes/post-likes.module'
import { CommentsModule } from './comments/comments.module'
import { NotificationsModule } from './notifications/notifications.module'
import { CommonModule } from './common/common.module'
import { RedisModule } from './redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { EventsModule } from './events/events.module'
import { WebsocketsModule } from './websockets/websockets.module'
import { StorageModule } from './storage/storage.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    // Configuration globale depuis .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
    AuthModule,
    EventsModule,
    WebsocketsModule,
    StorageModule,
    // Services communs (SupabaseService, etc.)
    CommonModule,
    // Modules métier
    AlbumsModule,
    ArtistsModule,
    CommentsModule,
    FollowsModule,
    NotificationsModule,
    PostsModule,
    PostLikesModule,
    UsersModule,
    UserVinylsModule,
    VinylsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
