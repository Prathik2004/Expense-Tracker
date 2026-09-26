import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDto: LoginDto, @Request() req: any, @Res() res: Response) {
        const metadata = {
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        };

        // Check if this login request is part of an OAuth flow
        const redirectTo = req.body.redirectTo;
        if (redirectTo && typeof redirectTo === 'string' && redirectTo.includes('/oauth/')) {
            // This is an OAuth flow login - after login, redirect back to complete OAuth
            const { access_token } = await this.authService.login(loginDto.email, loginDto.password, metadata);

            // Set HTTP-only cookie for security
            res.cookie('token', access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });

            // Redirect back to the OAuth endpoint to continue the flow
            return res.redirect(redirectTo);
        }

        // Normal login behavior - return token in response body
        const { access_token, user } = await this.authService.login(loginDto.email, loginDto.password, metadata);
        return {
            access_token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        };
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Request() req: any) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Request() req: any, @Res() res: Response) {
        const metadata = {
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        const { access_token } = await this.authService.googleLogin(req.user, metadata);
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth-callback?token=${access_token}`);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: any) {
        return req.user;
    }
}
