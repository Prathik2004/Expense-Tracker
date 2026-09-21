import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { OAuthGuard } from '../../auth/oauth.guard';

@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly oauthGuard: OAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try API Key authentication first
    try {
      const isApiKeyValid = await this.apiKeyGuard.canActivate(context);
      if (isApiKeyValid) {
        return true;
      }
    } catch (apiKeyError) {
      // API key validation failed (missing or invalid), try OAuth
    }

    // If API Key fails, try OAuth authentication
    try {
      const isOAuthValid = await this.oauthGuard.canActivate(context);
      return isOAuthValid;
    } catch (oauthError) {
      // If both fail, throw unauthorized
      throw new UnauthorizedException('Invalid authentication credentials');
    }
  }
}