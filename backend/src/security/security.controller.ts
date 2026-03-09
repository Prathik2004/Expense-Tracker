import { Controller, Get, Delete, Post, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SecurityService } from './security.service';

@Controller('security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
    constructor(private readonly securityService: SecurityService) { }

    @Get('sessions')
    async getSessions(@Request() req: any) {
        return this.securityService.getAllSessions(req.user.email);
    }

    @Delete('sessions/:id')
    async revokeSession(@Request() req: any, @Param('id') sessionId: string) {
        return this.securityService.revokeSession(req.user.email, sessionId);
    }

    @Post('logout-others')
    async logoutOthers(@Request() req: any) {
        // Here req.user depends on what JwtStrategy returns
        // We'll update JwtStrategy to include sessionId
        return this.securityService.revokeOtherSessions(req.user.email, req.user.userId, req.user.sessionId);
    }
}
