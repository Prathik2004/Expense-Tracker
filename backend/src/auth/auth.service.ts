import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from '../schemas/session.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && user.password && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user.toObject();
            return result;
        }
        return null;
    }

    async login(email: string, pass: string, metadata?: any) {
        const user = await this.validateUser(email, pass);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.generateToken(user, metadata);
    }

    async googleLogin(reqUser: any, metadata?: any) {
        if (!reqUser) {
            throw new UnauthorizedException('No user from google');
        }

        const user = await this.usersService.findOrCreateGoogleUser(reqUser);
        return this.generateToken(user, metadata);
    }

    public async generateToken(user: any, metadata?: any) {
        const sessionId = uuidv4();

        let deviceType = 'desktop';
        if (metadata?.userAgent) {
            const ua = metadata.userAgent.toLowerCase();
            if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
                deviceType = 'mobile';
            } else if (ua.includes('tablet') || ua.includes('ipad')) {
                deviceType = 'tablet';
            }
        }

        // Save session to DB
        await this.sessionModel.create({
            userId: user._id,
            sessionId,
            ip: metadata?.ip,
            userAgent: metadata?.userAgent,
            deviceType,
            lastActive: new Date(),
            isValid: true
        });

        const payload = { email: user.email, sub: user._id, sessionId };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        };
    }

    async register(registerDto: RegisterDto) {
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.create({
            ...registerDto,
            password: hashedPassword
        });

        // Auto-login after registration
        return this.login(user.email, registerDto.password);
    }
}
