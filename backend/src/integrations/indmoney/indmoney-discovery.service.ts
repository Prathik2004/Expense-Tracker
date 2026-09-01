import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IndmoneyDiscoveryService {
  private readonly logger = new Logger(IndmoneyDiscoveryService.name);

  private safePrint(title: string, obj: any) {
    // Print only high-level non-sensitive fields
    console.log(`\n=== ${title} ===`);
    if (!obj) {
      console.log('No metadata discovered');
      return;
    }
    const allowedKeys = ['issuer', 'authorization_endpoint', 'token_endpoint', 'scopes_supported', 'code_challenge_methods_supported', 'client_id_metadata_document_supported', 'registration_endpoint', 'authorization_server'];
    for (const key of Object.keys(obj)) {
      if (allowedKeys.includes(key)) {
        console.log(`${key}: ${JSON.stringify(obj[key])}`);
      }
    }
  }

  async discover(mcpUrl?: string) {
    const base = (mcpUrl || process.env.INDMONEY_MCP_URL || 'https://mcp.indmoney.com/mcp').replace(/\/$/, '');
    console.log(`Starting MCP discovery for ${base}`);

    try {
      const protectedResourceUrl = `${base}/.well-known/oauth-protected-resource`;
      const resp1 = await fetch(protectedResourceUrl, { method: 'GET' });
      if (resp1.ok) {
        const json = await resp1.json();
        this.safePrint('Protected Resource Metadata', json);
      } else {
        this.logger.warn(`No protected-resource metadata found (${resp1.status}) at ${protectedResourceUrl}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch protected-resource metadata: ${(err as any).message}`);
    }

    try {
      const authServerUrl = `${base}/.well-known/oauth-authorization-server`;
      const resp2 = await fetch(authServerUrl, { method: 'GET' });
      if (resp2.ok) {
        const json = await resp2.json();
        this.safePrint('Authorization Server Metadata', json);
      } else {
        this.logger.warn(`No authorization-server metadata found (${resp2.status}) at ${authServerUrl}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch authorization-server metadata: ${(err as any).message}`);
    }

    // Attempt root discovery if well-known endpoints absent
    try {
      const resp3 = await fetch(base, { method: 'GET' });
      if (resp3.ok) {
        const text = await resp3.text();
        // Try to find JSON blocks or links to well-known
        console.log('\n=== Root resource fetched (truncated) ===');
        console.log(text.substring(0, 800));
      } else {
        this.logger.warn(`Failed to fetch base MCP endpoint: ${resp3.status}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch MCP base: ${(err as any).message}`);
    }
  }
}
