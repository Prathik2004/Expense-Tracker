import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PasskeyService } from './passkey.service';

@Controller('passkey')
export class PasskeyController {
    constructor(private readonly passkeyService: PasskeyService) { }

    @UseGuards(JwtAuthGuard)
    @Get('register-options')
    async getRegisterOptions(@Request() req: any) {
        return this.passkeyService.getRegistrationOptions(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-registration')
    async verifyRegistration(@Request() req: any, @Body() body: any) {
        return this.passkeyService.verifyRegistration(req.user.userId, body);
    }

    @Post('login-options')
    async getLoginOptions(@Body('email') email: string) {
        return this.passkeyService.getAuthenticationOptions(email);
    }

    @Post('verify-login')
    async verifyLogin(@Body('email') email: string, @Body('response') response: any, @Request() req: any) {
        const metadata = {
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        return this.passkeyService.verifyAuthentication(email, response, metadata);
    }
}
