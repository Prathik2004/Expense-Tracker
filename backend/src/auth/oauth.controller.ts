import { Controller, Get, Post, Body, Query, Res, HttpStatus, UseGuards, Request } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OAuthClient, OAuthClientDocument } from '../schemas/oauth-client.schema';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { Session, SessionDocument } from '../schemas/session.schema';

@Controller('oauth')
export class OAuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private jwtService: JwtService,
    @InjectModel(OAuthClient.name) private oauthClientModel: Model<OAuthClientDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  // Dynamic client registration for development/testing
  @Post('register')
  async registerClient(@Body() body: { name: string; redirectUris: string[] }) {
    const clientId = `oauth_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = crypto.randomBytes(32).toString('hex');

    const client = await this.oauthClientModel.create({
      clientId,
      clientSecret,
      name: body.name,
      redirectUris: body.redirectUris,
      scopes: ['mcp:full_read'],
      isActive: true,
    });

    return {
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uris: client.redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic',
    };
  }

  // Authorization endpoint
  @Get('authorize')
  async authorize(
    @Query('response_type') responseType: string,
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('scope') scope: string,
    @Query('state') state: string,
    @Query('code_challenge') codeChallenge: string,
    @Query('code_challenge_method') codeChallengeMethod: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    // Validate client
    const client = await this.oauthClientModel.findOne({ clientId, isActive: true });
    if (!client) {
      return res.redirect(`${redirectUri}?error=invalid_client&state=${state || ''}`);
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirectUri)) {
      return res.redirect(`${redirectUri}?error=invalid_redirect_uri&state=${state || ''}`);
    }

    // Validate response type
    if (responseType !== 'code') {
      return res.redirect(`${redirectUri}?error=unsupported_response_type&state=${state || ''}`);
    }

    // For MCP integration, we'll use the JWT token as the basis for auth
    // In a real implementation, this would show a login/consent screen
    // For now, we'll check if user is already authenticated via JWT cookie/header
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Also check for token in cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // No token - redirect to login
      const loginUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/login?redirect_to=${encodeURIComponent(req.originalUrl)}`;
      return res.redirect(loginUrl);
    }

    try {
      // Verify the token
      const payload = await this.authService.validateToken(token);

      // Generate authorization code
      const authCode = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save authorization code to session (simplified)
      await this.sessionModel.create({
        userId: payload.sub,
        sessionId: authCode,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        deviceType: 'desktop',
        lastActive: new Date(),
        isValid: true,
        expiresAt,
      });

      // Redirect back with authorization code
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set('code', authCode);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      // Invalid token
      const loginUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/login?redirect_to=${encodeURIComponent(req.originalUrl)}`;
      return res.redirect(loginUrl);
    }
  }

  // Token endpoint
  @Post('token')
  async token(
    @Body('grant_type') grantType: string,
    @Body('code') code: string,
    @Body('redirect_uri') redirectUri: string,
    @Body('client_id') clientId: string,
    @Body('client_secret') clientSecret: string,
    @Body('code_verifier') codeVerifier: string,
  ) {
    // Validate grant type
    if (grantType !== 'authorization_code') {
      throw new Error('unsupported_grant_type');
    }

    // Validate client
    const client = await this.oauthClientModel.findOne({
      clientId,
      clientSecret,
      isActive: true
    });
    if (!client) {
      throw new Error('invalid_client');
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirectUri)) {
      throw new Error('invalid_grant');
    }

    // Find the session by sessionId (authorization code)
    const session = await this.sessionModel.findOne({
      sessionId: code,
      isValid: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      throw new Error('invalid_grant');
    }

    // Mark session as used
    session.isValid = false;
    await session.save();

    // Generate access token (JWT)
    const payload = {
      email: '', // Would normally lookup from userId
      sub: session.userId,
      sessionId: session.sessionId
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h'
    });

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: 'mcp:full_read'
    };
  }
}