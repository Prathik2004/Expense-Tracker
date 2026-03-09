import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from '../schemas/session.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
        });
    }

    async validate(payload: any) {
        const session = await this.sessionModel.findOne({
            sessionId: payload.sessionId,
            isValid: true
        });

        if (!session) {
            throw new UnauthorizedException('Session has been revoked');
        }

        // Update last active time (optional, but good for security audit)
        session.lastActive = new Date();
        await session.save();

        return { userId: payload.sub, email: payload.email, sessionId: payload.sessionId };
    }
}
