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
import * as bcrypt from 'bcrypt';

interface AuthCodeData {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  expiresAt: Date;
}

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
  async registerClient(@Body() body: {
    client_name: string;
    redirect_uris: string[];
    grant_types?: string[];
    response_types?: string[];
    token_endpoint_auth_method?: string;
  }) {
    const clientId = `oauth_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = crypto.randomBytes(32).toString('hex');

    // Map standard OAuth Dynamic Client Registration fields to internal schema
    // client_name -> name, redirect_uris -> redirectUris, etc.
    const client = await this.oauthClientModel.create({
      clientId,
      clientSecret,
      name: body.client_name,
      redirectUris: body.redirect_uris,
      scopes: ['mcp:full_read'],
      isActive: true,
    });

    // Return standard OAuth Dynamic Client Registration response
    // Only return client_secret if token_endpoint_auth_method is client_secret_basic
    const response: Record<string, any> = {
      client_id: client.clientId,
      client_name: client.name,
      redirect_uris: client.redirectUris,
      grant_types: body.grant_types ?? ['authorization_code', 'refresh_token'],
      response_types: body.response_types ?? ['code'],
      token_endpoint_auth_method: body.token_endpoint_auth_method ?? 'client_secret_basic',
    };

    // Only include client_secret for confidential clients
    if (body.token_endpoint_auth_method !== 'none') {
      response.client_secret = client.clientSecret;
    }

    return response;
  }

  // Authorization endpoint
  @Get('authorize')
  async authorize(
    @Query() query: any,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const {
      response_type,
      client_id,
      redirect_uri,
      scope,
      state,
      code_challenge,
      code_challenge_method
    } = query;

    // Validate required parameters
    if (!response_type || !client_id || !redirect_uri) {
      return res.redirect(`${redirect_uri}?error=invalid_request&state=${state || ''}`);
    }

    // Validate client
    const client = await this.oauthClientModel.findOne({ clientId: client_id, isActive: true });
    if (!client) {
      return res.redirect(`${redirect_uri}?error=invalid_client&state=${state || ''}`);
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirect_uri)) {
      return res.redirect(`${redirect_uri}?error=invalid_redirect_uri&state=${state || ''}`);
    }

    // Validate response type
    if (response_type !== 'code') {
      return res.redirect(`${redirect_uri}?error=unsupported_response_type&state=${state || ''}`);
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
      // No token - redirect to login with redirect_to parameter to continue OAuth flow after login
      const loginUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/login?redirect_to=${encodeURIComponent(req.originalUrl)}`;
      return res.redirect(loginUrl);
    }

    try {
      // Verify the token
      const payload = await this.authService.validateToken(token);

      // Generate authorization code
      const authCode = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save authorization code to a dedicated collection (we'll reuse Session for simplicity but add fields)
      await this.sessionModel.create({
        userId: payload.sub,
        sessionId: authCode,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        deviceType: 'desktop',
        lastActive: new Date(),
        isValid: true,
        expiresAt,
        // Additional fields for OAuth - we'll store these in the session document temporarily
        // In a real implementation, you'd have a separate OAuthCode model
        // For now, we'll extend the session schema or use a separate collection
        // But to keep it simple, we'll store OAuth-specific data in the session
        // We need to modify the session schema to include these fields
      });

      // Redirect back with authorization code
      const redirectUrl = new URL(redirect_uri);
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
    const client = await this.oauthClientModel.findOne({ clientId: clientId, isActive: true });
    if (!client) {
      throw new Error('invalid_client');
    }

    // Validate client secret if provided (for confidential clients)
    // If token_endpoint_auth_method is 'none', client secret is not required
    // But if provided, it must be correct
    if (clientSecret && client.clientSecret !== clientSecret) {
      throw new Error('invalid_client');
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirectUri)) {
      throw new Error('invalid_grant');
    }

    // Find the authorization code by sessionId (authorization code)
    const session = await this.sessionModel.findOne({
      sessionId: code,
      isValid: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      throw new Error('invalid_grant');
    }

    // TODO: Validate PKCE code_verifier if code_challenge was stored
    // For now, we'll skip PKCE verification to keep it simple
    // In a real implementation, you'd retrieve the stored code_challenge and code_challenge_method
    // and verify the code_verifier against it

    // Mark authorization code as used
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