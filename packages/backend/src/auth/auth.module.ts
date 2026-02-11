import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller'; // ← Ajouter
import { AuthGuard } from './guards/auth.guard'; // ← Ajouter
import { RefreshGuard } from './guards/refresh.guard'; // ← Ajouter
import { CsrfGuard } from './guards/csrf.guard'; // ← Ajouter
import { SupabaseService } from '../common/database/supabase.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m';

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
          global: true,
        };
      },
    }),
  ],
  controllers: [AuthController], // ← Ajouter
  providers: [
    AuthService,
    SupabaseService,
    AuthGuard, // ← Ajouter
    RefreshGuard, // ← Ajouter
    CsrfGuard, // ← Ajouter
  ],
  exports: [
    AuthService,
    JwtModule,
    AuthGuard, // ← Ajouter (pour utiliser dans d'autres modules)
    RefreshGuard, // ← Ajouter
    CsrfGuard, // ← Ajouter
  ],
})
export class AuthModule {}
