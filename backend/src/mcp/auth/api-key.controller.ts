import { Controller, Post, Body, Delete, Param, Get, UseGuards, Req } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('mcp/api-keys')
@UseGuards(JwtAuthGuard) // Reuse existing JWT auth to manage API keys
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  async createApiKey(
    @Req() req: any,
    @Body('name') name: string,
    @Body('scopes') scopes: string[],
    @Body('rateLimit') rateLimit?: { requestsPerMinute: number; requestsPerDay: number },
  ) {
    const userId = req.user.userId;

    // Validate scopes (only allow read scopes)
    const validScopes = ['portfolio:read', 'budget:read', 'transaction:read', 'goals:read', 'investments:read', 'mcp:full_read'];
    const invalidScopes = scopes.filter(s => !validScopes.includes(s));

    if (invalidScopes.length > 0) {
      return {
        success: false,
        message: `Invalid scopes: ${invalidScopes.join(', ')}. Only read scopes are allowed.`,
      };
    }

    const result = await this.apiKeyService.createApiKey(userId, name, scopes, rateLimit);

    return {
      success: true,
      message: 'API key created successfully. Store it securely - it will not be shown again.',
      apiKey: result.apiKey,
      id: result.id,
    };
  }

  @Get()
  async listApiKeys(@Req() req: any) {
    const userId = req.user.userId;
    const apiKeys = await this.apiKeyService.listApiKeysForUser(userId);

    return {
      success: true,
      apiKeys: apiKeys.map(key => ({
        id: key._id.toString(),
        name: key.name,
        scopes: key.scopes,
        rateLimit: key.rateLimit,
        createdAt: (key as any).createdAt ? new Date((key as any).createdAt) : undefined,
        lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : undefined,
        expiresAt: key.expiresAt ? new Date(key.expiresAt) : undefined,
      })),
    };
  }

  @Delete(':id')
  async revokeApiKey(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.userId;

    // Verify the API key belongs to the user
    const apiKey = await this.apiKeyService.getApiKeyById(id);
    if (apiKey.userId.toString() !== userId) {
      return {
        success: false,
        message: 'API key not found or access denied',
      };
    }

    const revoked = await this.apiKeyService.revokeApiKey(id);

    return {
      success: revoked,
      message: revoked ? 'API key revoked successfully' : 'API key not found',
    };
  }
}
