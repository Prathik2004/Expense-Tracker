import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { OAuthGuard } from './oauth.guard';

@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly oauthGuard: OAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try API Key authentication first
    const isApiKeyValid = await this.apiKeyGuard.canActivate(context);
    if (isApiKeyValid) {
      return true;
    }

    // If API Key fails, try OAuth authentication
    try {
      const isOAuthValid = await this.oauthGuard.canActivate(context);
      return isOAuthValid;
    } catch (error) {
      // If both fail, throw unauthorized
      throw new UnauthorizedException('Invalid authentication credentials');
    }
  }
}