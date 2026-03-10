import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PasskeyService } from './passkey.service';

@Controller('passkey')
export class PasskeyController {
    constructor(private readonly passkeyService: PasskeyService) { }

    private getRpId(req: any) {
        if (req.headers.origin) {
            try {
                return new URL(req.headers.origin).hostname;
            } catch { /* ignore */ }
        }
        return req.headers.host?.split(':')[0] || 'localhost';
    }

    @UseGuards(JwtAuthGuard)
    @Get('register-options')
    async getRegisterOptions(@Request() req: any) {
        const rpId = this.getRpId(req);
        return this.passkeyService.getRegistrationOptions(req.user.userId, rpId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-registration')
    async verifyRegistration(@Request() req: any, @Body() body: any) {
        const rpId = this.getRpId(req);
        const origin = req.headers.origin;
        return this.passkeyService.verifyRegistration(req.user.userId, body, rpId, origin);
    }

    @Post('login-options')
    async getLoginOptions(@Body('email') email: string, @Request() req: any) {
        const rpId = this.getRpId(req);
        return this.passkeyService.getAuthenticationOptions(email, rpId);
    }

    @Post('verify-login')
    async verifyLogin(@Body('email') email: string, @Body('response') response: any, @Request() req: any) {
        const rpId = this.getRpId(req);
        const origin = req.headers.origin;
        const metadata = {
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        return this.passkeyService.verifyAuthentication(email, response, metadata, rpId, origin);
    }
    @UseGuards(JwtAuthGuard)
    @Get('check')
    async check(@Request() req: any) {
        const hasAuthenticators = await this.passkeyService.hasAuthenticators(req.user.userId);
        return { hasAuthenticators };
    }
}
