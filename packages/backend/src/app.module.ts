import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlbumsModule } from './albums/albums.module';
import { ArtistsModule } from './artists/artists.module';
import { VinylsModule } from './vinyls/vinyls.module';
import { UserVinylsModule } from './user-vinyls/user-vinyls.module';
import { UsersModule } from './users/users.module';
import { FollowsModule } from './follows/follows.module';
import { PostsModule } from './posts/posts.module';
import { PostLikesModule } from './post-likes/post-likes.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Configuration globale depuis .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Services communs (SupabaseService, etc.)
    CommonModule,
    // Modules métier
    AlbumsModule,
    ArtistsModule,
    VinylsModule,
    UserVinylsModule,
    UsersModule,
    FollowsModule,
    PostsModule,
    PostLikesModule,
    CommentsModule,
    NotificationsModule,
  ],
})
export class AppModule {}