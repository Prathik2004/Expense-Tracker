import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
        const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

        // Only initialize if credentials are available
        if (!clientID || !clientSecret || !callbackURL) {
            console.warn('Google OAuth credentials not configured. Google login will be disabled.');
            super({
                clientID: 'placeholder',
                clientSecret: 'placeholder',
                callbackURL: 'http://localhost:3001/auth/google/callback',
            } as any);
            return;
        }

        super({
            clientID,
            clientSecret,
            callbackURL,
            scope: ['email', 'profile'],
            proxy: true,
        } as any);
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
    ): Promise<any> {
        const { name, emails, photos, id } = profile;
        const user = {
            email: emails[0].value,
            name: `${name.givenName} ${name.familyName}`,
            picture: photos[0]?.value,
            googleId: id,
        };
        return user;
    }
}
