import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PasskeyService } from './passkey.service';

@Controller('passkey')
export class PasskeyController {
    constructor(private readonly passkeyService: PasskeyService) { }

    @UseGuards(JwtAuthGuard)
    @Get('register-options')
    async getRegisterOptions(@Request() req: any) {
        const hostname = req.headers.host?.split(':')[0];
        return this.passkeyService.getRegistrationOptions(req.user.userId, hostname);
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-registration')
    async verifyRegistration(@Request() req: any, @Body() body: any) {
        const hostname = req.headers.host?.split(':')[0];
        const origin = req.headers.origin;
        return this.passkeyService.verifyRegistration(req.user.userId, body, hostname, origin);
    }

    @Post('login-options')
    async getLoginOptions(@Body('email') email: string, @Request() req: any) {
        const hostname = req.headers.host?.split(':')[0];
        return this.passkeyService.getAuthenticationOptions(email, hostname);
    }

    @Post('verify-login')
    async verifyLogin(@Body('email') email: string, @Body('response') response: any, @Request() req: any) {
        const hostname = req.headers.host?.split(':')[0];
        const origin = req.headers.origin;
        const metadata = {
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        return this.passkeyService.verifyAuthentication(email, response, metadata, hostname, origin);
    }
    @UseGuards(JwtAuthGuard)
    @Get('check')
    async check(@Request() req: any) {
        const hasAuthenticators = await this.passkeyService.hasAuthenticators(req.user.userId);
        return { hasAuthenticators };
    }
}
