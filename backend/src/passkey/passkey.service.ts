import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
        @InjectModel(Authenticator.name) private authenticatorModel: Model<AuthenticatorDocument>,
        private authService: AuthService,
        private configService: ConfigService,
    ) { }

    private readonly rpName = 'Expensify';

    private get rpID() {
        return this.configService.get('RP_ID') || 'localhost';
    }

    private get origin() {
        return this.configService.get('ORIGIN') || 'http://localhost:3000';
    }

    async getRegistrationOptions(userId: string) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new UnauthorizedException('User not found');

        const userAuthenticators = await this.authenticatorModel.find({ userId: user._id.toString() }).exec();

        const options = await generateRegistrationOptions({
            rpName: this.rpName,
            rpID: this.rpID,
            userID: Buffer.from(user._id.toString()),
            userName: user.email,
            attestationType: 'none',
            /**
             * Authenticators registered by the user so far.
             */
            excludeCredentials: userAuthenticators.map(auth => ({
                id: auth.credentialID, // Already base64url or should be handled by browser
                type: 'public-key',
                transports: auth.transports as any[],
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform', // Fingerprint, FaceID, etc.
            },
        });

        // Store the challenge for verification
        user.currentChallenge = options.challenge;
        await user.save();

        return options;
    }

    async verifyRegistration(userId: string, body: any) {
        const user = await this.userModel.findById(userId).exec();
        if (!user || !user.currentChallenge) throw new UnauthorizedException('Registration session expired');

        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
        });

        if (verification.verified && verification.registrationInfo) {
            const { credential } = verification.registrationInfo;

            // Save the new authenticator
            await this.authenticatorModel.create({
                userId,
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

    async getAuthenticationOptions(email: string) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user) throw new UnauthorizedException('User not found');

        const userAuthenticators = await this.authenticatorModel.find({ userId: user._id.toString() }).exec();

        const options = await generateAuthenticationOptions({
            rpID: this.rpID,
            allowCredentials: userAuthenticators.map(auth => ({
                id: auth.credentialID,
                type: 'public-key',
                transports: auth.transports as any[],
            })),
            userVerification: 'preferred',
        });

        // Store the challenge for verification
        user.currentChallenge = options.challenge;
        await user.save();

        return options;
    }

    async verifyAuthentication(email: string, body: any, metadata: any) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user || !user.currentChallenge) throw new UnauthorizedException('Authentication session expired');

        const authenticator = await this.authenticatorModel.findOne({
            credentialID: body.id
        }).exec();

        if (!authenticator) throw new UnauthorizedException('Authenticator not found');

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
            authenticator: {
                credentialID: authenticator.credentialID,
                credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64url'),
                counter: authenticator.counter,
                transports: authenticator.transports as any[],
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
}
