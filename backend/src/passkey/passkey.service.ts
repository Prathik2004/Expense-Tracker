import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Authenticator, AuthenticatorDocument } from '../schemas/authenticator.schema';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasskeyService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Authenticator.name) private authenticatorModel: any,
        private authService: AuthService,
        private configService: ConfigService,
    ) { }

    private readonly rpName = 'Expensify';

    private get rpID() {
        const rpId = this.configService.get('RP_ID');
        if (rpId) return rpId;

        // Fallback: extract from FRONTEND_URL if possible
        const frontendUrl = this.configService.get('FRONTEND_URL');
        if (frontendUrl) {
            try {
                return new URL(frontendUrl).hostname;
            } catch { /* ignore */ }
        }
        return 'localhost';
    }

    private get origin() {
        const origin = this.configService.get('ORIGIN') || this.configService.get('FRONTEND_URL');
        if (origin) {
            // Remove trailing slash if it exists
            return origin.replace(/\/$/, '');
        }
        return 'http://localhost:3000';
    }

    async getRegistrationOptions(userId: string, currentRpId?: string) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new UnauthorizedException('User not found');

        const activeRpId = currentRpId || this.rpID;
        const userAuthenticators = await this.authenticatorModel.find({ userId: new Types.ObjectId(user._id.toString()) }).exec();

        const options = await generateRegistrationOptions({
            rpName: this.rpName,
            rpID: activeRpId,
            userID: Buffer.from(user._id.toString()),
            userName: user.email,
            attestationType: 'none',
            excludeCredentials: userAuthenticators.map((auth: any) => ({
                id: auth.credentialID,
                type: 'public-key',
                transports: auth.transports,
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform',
            },
        });

        user.currentChallenge = options.challenge;
        await user.save();

        return options;
    }

    async verifyRegistration(userId: string, body: any, currentRpId?: string, currentOrigin?: string) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.currentChallenge) throw new UnauthorizedException('Registration session expired');

        const activeRpId = currentRpId || this.rpID;
        const activeOrigin = currentOrigin || this.origin;

        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: activeOrigin,
            expectedRPID: activeRpId,
        });

        if (verification.verified && verification.registrationInfo) {
            const { credential } = verification.registrationInfo;

            // Save the new authenticator
            await this.authenticatorModel.create({
                userId: new Types.ObjectId(userId),
                credentialID: Buffer.from(credential.id).toString('base64url'),
                credentialPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
                counter: credential.counter,
                transports: body.response.transports,
            });

            user.currentChallenge = undefined;
            await user.save();

            return { success: true };
        }

        throw new UnauthorizedException('Verification failed');
    }

    async getAuthenticationOptions(email: string, currentRpId?: string) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user) throw new UnauthorizedException('User not found');

        const activeRpId = currentRpId || this.rpID;
        const userAuthenticators = await this.authenticatorModel.find({ userId: new Types.ObjectId(user._id.toString()) }).exec();

        const options = await generateAuthenticationOptions({
            rpID: activeRpId,
            allowCredentials: userAuthenticators.map((auth: any) => ({
                id: auth.credentialID,
                type: 'public-key',
                transports: auth.transports,
            })),
            userVerification: 'preferred',
        });

        user.currentChallenge = options.challenge;
        await user.save();

        return options;
    }

    async verifyAuthentication(email: string, body: any, metadata: any, currentRpId?: string, currentOrigin?: string) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user || !user.currentChallenge) throw new UnauthorizedException('Authentication session expired');

        const activeRpId = currentRpId || this.rpID;
        const activeOrigin = currentOrigin || this.origin;

        const authenticator = await this.authenticatorModel.findOne({
            credentialID: body.id
        }).exec();

        if (!authenticator) throw new UnauthorizedException('Authenticator not found');

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: activeOrigin,
            expectedRPID: activeRpId,
            authenticator: {
                credentialID: authenticator.credentialID,
                credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64url'),
                counter: authenticator.counter,
                transports: authenticator.transports,
            },
        } as any);

        if (verification.verified && verification.authenticationInfo) {
            // Update counter
            authenticator.counter = verification.authenticationInfo.newCounter;
            await authenticator.save();

            user.currentChallenge = undefined;
            await user.save();

            // Issue JWT!
            return this.authService.generateToken(user, metadata);
        }

        throw new UnauthorizedException('Verification failed');
    }
    async hasAuthenticators(userId: string) {
        const count = await this.authenticatorModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec();
        return count > 0;
    }
}
