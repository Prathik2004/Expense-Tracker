import { Controller, Get, Header, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller()
export class OauthDiscoveryController {
  constructor(private readonly configService: ConfigService) {}

  // Helper to normalize URLs by removing trailing slashes
  private normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  // OAuth 2.0 Authorization Server Metadata
  // RFC 8414: https://www.rfc-editor.org/rfc/rfc8414.txt
  @Get('/.well-known/oauth-authorization-server')
  @Header('Cache-Control', 'no-store')
  @Header('Content-Type', 'application/json')
  async getAuthorizationServerMetadata(@Res() res: Response) {
    // Use OAUTH_ISSUER_URL or fallback to FRONTEND_URL
    const oauthIssuerUrl = this.normalizeUrl(
      this.configService.get<string>('OAUTH_ISSUER_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000'
    );

    const metadata = {
      // Authorization Server
      issuer: oauthIssuerUrl,
      authorization_endpoint: `${oauthIssuerUrl}/oauth/authorize`,
      token_endpoint: `${oauthIssuerUrl}/oauth/token`,
      registration_endpoint: `${oauthIssuerUrl}/oauth/register`,

      // Supported response types
      response_types_supported: ['code'],

      // Supported subject identifier types
      subject_types_supported: ['public'],

      // ID Token signing algorithms
      id_token_signing_alg_values_supported: ['RS256'],

      // Token endpoint authentication methods
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],

      // Supported scopes
      scopes_supported: [
        'mcp:full_read',
        'transaction:read',
        'portfolio:read',
        'budget:read',
        'goal:read',
        'investment:read'
      ],

      // PKCE support
      code_challenge_methods_supported: ['plain', 'S256'],

      // Token endpoint auth methods
      token_endpoint_auth_signing_alg_values_supported: []
    };

    return res.status(HttpStatus.OK).json(metadata);
  }

  // OAuth 2.0 Protected Resource Metadata
  // RFC 9728: https://www.rfc-editor.org/rfc/rfc9728.txt
  @Get('/.well-known/oauth-protected-resource')
  @Header('Cache-Control', 'no-store')
  @Header('Content-Type', 'application/json')
  async getProtectedResourceMetadata(@Res() res: Response) {
    // MCP Resource Server URL - separate from OAuth Authorization Server
    const mcpServerUrl = this.normalizeUrl(
      this.configService.get<string>('MCP_SERVER_URL') ||
      'https://expense-tracker.pntr.dev/mcp'
    );

    // OAuth Authorization Server URL (issuer)
    const oauthIssuerUrl = this.normalizeUrl(
      this.configService.get<string>('OAUTH_ISSUER_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000'
    );

    const metadata = {
      // Resource Server - the MCP server
      resource: mcpServerUrl,

      // Authorization Server - the OAuth issuer
      authorization_servers: [oauthIssuerUrl],

      // Supported scopes
      scopes_supported: [
        'mcp:full_read',
        'transaction:read',
        'portfolio:read',
        'budget:read',
        'goal:read',
        'investment:read'
      ],

      // Bearer authentication methods
      bearer_auth_methods_supported: ['header'],

      // Resource documentation - use MCP server domain
      resource_documentation: `${mcpServerUrl.replace('/mcp', '')}/docs/mcp`
    };

    return res.status(HttpStatus.OK).json(metadata);
  }
}