import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OAuthController } from './oauth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from '../schemas/session.schema';
import { OAuthClient, OAuthClientSchema } from '../schemas/oauth-client.schema';
import { OAuthGuard } from './oauth.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret',
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d' } as any,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: OAuthClient.name, schema: OAuthClientSchema },
    ]),
  ],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, OAuthGuard],
  exports: [AuthService, OAuthGuard],
})
export class AuthModule { }
