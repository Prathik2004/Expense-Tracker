import { Controller, Get, Post, Body, Req, Res, UseFilters, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { MCPService } from './mcp.service';
import { Scopes } from './auth/scopes.decorator';
import { ToolCallDto } from './dto/tool-call.dto';
import { UserPayload } from './auth/api-key-payload';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OAuthClient, OAuthClientDocument } from '../schemas/oauth-client.schema';
import * as crypto from 'crypto';
import { McpAuthExceptionFilter } from './filters/mcp-auth-exception.filter';
import { Public } from '../auth/public.decorator';

interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

@Controller('mcp')
@UseFilters(McpAuthExceptionFilter)
export class MCPController {
  constructor(
    private readonly mcpService: MCPService,
    private readonly configService: ConfigService,
    @InjectModel(OAuthClient.name) private oauthClientModel: Model<OAuthClientDocument>,
  ) {}

  // Helper to normalize URLs by removing trailing slashes
  private normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  @Get('health')
  @Public()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  // Special endpoint to initiate OAuth flow for MCP
  @Get('oauth/initiate')
  @Public()
  async initiateOAuthFlow(
    @Res() res: Response,
  ) {
    // Generate a temporary client for this OAuth flow
    const clientId = `mcp_claude_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = crypto.randomBytes(32).toString('hex');

    // Use OAUTH_ISSUER_URL for the OAuth server, not FRONTEND_URL (which has trailing slash)
    const oauthIssuerUrl = this.normalizeUrl(
      this.configService.get<string>('OAUTH_ISSUER_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000'
    );

    // Create temporary OAuth client (expires in 1 hour)
    await this.oauthClientModel.create({
      clientId,
      clientSecret,
      name: 'Temporary Claude MCP Client',
      redirectUris: [
        'https://claude.ai/api/mcp/auth_callback',
        `${oauthIssuerUrl}/mcp-oauth-callback`
      ],
      scopes: ['mcp:full_read'],
      isActive: true,
      // Note: In production, you'd want to set an expiration date or clean up old clients
    });

    // Build the authorization URL
    const authUrl = new URL(`${oauthIssuerUrl}/oauth/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', 'https://claude.ai/api/mcp/auth_callback');
    authUrl.searchParams.set('scope', 'mcp:full_read');
    authUrl.searchParams.set('state', crypto.randomBytes(16).toString('hex')); // Secure state
    authUrl.searchParams.set('code_challenge', 'placeholder_challenge'); // For PKCE - in production, generate properly
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Redirect to OAuth authorization endpoint
    return res.redirect(authUrl.toString());
  }

  @Post('tools/call')
  @Scopes('mcp:full_read')
  async callTool(
    @Body() toolCallDto: ToolCallDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcpService.handleToolCall(
      toolCallDto.name,
      toolCallDto.arguments,
      req.user,
    );
  }

  @Get('tools/list')
  async listTools() {
    return this.mcpService.listTools();
  }

  @Get('resources/list')
  async listResources(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      return this.mcpService.listResources(req.user);
    } catch (error: unknown) {
      // If it's an authentication error, ensure proper WWW-Authenticate header
      const err = error as { response?: { statusCode?: number }; message?: string };
      if (err.response?.statusCode === 401 || err.message?.includes('Unauthorized')) {
        const mcpServerUrl = this.normalizeUrl(
          this.configService.get<string>('MCP_SERVER_URL') ||
          'https://expense-tracker.pntr.dev/mcp'
        );

        const oauthIssuerUrl = this.normalizeUrl(
          this.configService.get<string>('OAUTH_ISSUER_URL') ||
          this.configService.get<string>('FRONTEND_URL') ||
          'http://localhost:3000'
        );

        res.setHeader(
          'WWW-Authenticate',
          `Bearer resource="${mcpServerUrl}", authorization_server="${oauthIssuerUrl}"`
        );
        return res.status(HttpStatus.UNAUTHORIZED).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: 'Unauthorized: Invalid or missing access token',
          },
        });
      }
      throw error;
    }
  }

  @Post('resources/read')
  async readResource(
    @Body('uri') uri: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    try {
      return this.mcpService.readResource(uri, req.user);
    } catch (error: unknown) {
      // If it's an authentication error, ensure proper WWW-Authenticate header
      const err = error as { response?: { statusCode?: number }; message?: string };
      if (err.response?.statusCode === 401 || err.message?.includes('Unauthorized')) {
        const mcpServerUrl = this.normalizeUrl(
          this.configService.get<string>('MCP_SERVER_URL') ||
          'https://expense-tracker.pntr.dev/mcp'
        );

        const oauthIssuerUrl = this.normalizeUrl(
          this.configService.get<string>('OAUTH_ISSUER_URL') ||
          this.configService.get<string>('FRONTEND_URL') ||
          'http://localhost:3000'
        );

        res.setHeader(
          'WWW-Authenticate',
          `Bearer resource="${mcpServerUrl}", authorization_server="${oauthIssuerUrl}"`
        );
        return res.status(HttpStatus.UNAUTHORIZED).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: 'Unauthorized: Invalid or missing access token',
          },
        });
      }
      throw error;
    }
  }

  @Get('sse')
  async handleSSE(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Keep connection alive
    const keepAliveInterval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAliveInterval);
      res.end();
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
  }
}