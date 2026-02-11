import { Global, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { SupabaseService } from '../common/database/supabase.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m';

        return {
          secret,
          signOptions: {
            expiresIn,
          },
          global: true,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, AuthGuard, RefreshGuard, CsrfGuard],
  exports: [AuthService, JwtModule, AuthGuard, RefreshGuard, CsrfGuard],
})
export class AuthModule {}
