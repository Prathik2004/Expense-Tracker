import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';
import { decrypt } from '../../utils/encryption.util';

@Injectable()
export class IndmoneyClientService {
  private readonly logger = new Logger(IndmoneyClientService.name);

  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any> {
    const tokenUrl = process.env.INDMONEY_OAUTH_TOKEN_URL;
    const clientId = process.env.INDMONEY_CLIENT_ID;
    const clientSecret = process.env.INDMONEY_CLIENT_SECRET; // optional depending on provider

    if (!tokenUrl || !clientId) {
      throw new Error('INDMONEY_OAUTH_TOKEN_URL or INDMONEY_CLIENT_ID not configured');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: process.env.INDMONEY_REDIRECT_URI || '',
      code_verifier: codeVerifier,
    });

    if (clientSecret) {
      body.append('client_secret', clientSecret);
    }

    const resp = await fetch(tokenUrl, { method: 'POST', body });
    if (!resp.ok) {
      const text = await resp.text();
      this.logger.error(`Token exchange failed: ${resp.status} ${text}`);
      throw new Error('Token exchange failed');
    }

    return resp.json();
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const tokenUrl = process.env.INDMONEY_OAUTH_TOKEN_URL;
    const clientId = process.env.INDMONEY_CLIENT_ID;
    const clientSecret = process.env.INDMONEY_CLIENT_SECRET;

    if (!tokenUrl || !clientId) {
      throw new Error('INDMONEY_OAUTH_TOKEN_URL or INDMONEY_CLIENT_ID not configured');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    });

    if (clientSecret) body.append('client_secret', clientSecret);

    const resp = await fetch(tokenUrl, { method: 'POST', body });
    if (!resp.ok) {
      const text = await resp.text();
      this.logger.error(`Refresh token exchange failed: ${resp.status} ${text}`);
      throw new Error('Refresh token exchange failed');
    }

    return resp.json();
  }

  // Placeholder: call MCP to fetch portfolio — requires MCP details and scopes
  async fetchPortfolioWithAccessToken(accessToken: string): Promise<any> {
    const mcpUrl = process.env.INDMONEY_MCP_URL;
    if (!mcpUrl) throw new Error('INDMONEY_MCP_URL not configured');

    const resp = await fetch(mcpUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!resp.ok) {
      const txt = await resp.text();
      this.logger.error(`MCP request failed: ${resp.status} ${txt}`);
      throw new Error('MCP request failed');
    }
    return resp.json();
  }
}
