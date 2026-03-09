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
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Request() req: any) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Request() req: any, @Res() res: Response) {
        console.log('Google callback hit, user:', req.user);
        try {
            const { access_token } = await this.authService.googleLogin(req.user);
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
            console.log('Redirecting to:', `${frontendUrl}/auth-callback?token=${access_token}`);
            return res.redirect(`${frontendUrl}/auth-callback?token=${access_token}`);
        } catch (error) {
            console.error('Error in googleAuthRedirect:', error);
            const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: any) {
        return req.user;
    }
}
