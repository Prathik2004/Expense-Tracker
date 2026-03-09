import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { Authenticator, AuthenticatorSchema } from '../schemas/authenticator.schema';
import { PasskeyService } from './passkey.service';
import { PasskeyController } from './passkey.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Authenticator.name, schema: AuthenticatorSchema },
        ]),
        AuthModule,
    ],
    providers: [PasskeyService],
    controllers: [PasskeyController],
})
export class PasskeyModule { }
