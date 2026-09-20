import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    // Validate the API key
    const apiKeyDoc = await this.apiKeyService.validateApiKey(apiKey);

    if (!apiKeyDoc) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if the API key has expired
    if (apiKeyDoc.expiresAt && apiKeyDoc.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Check if the API key is revoked
    if (apiKeyDoc.isRevoked) {
      throw new UnauthorizedException('API key has been revoked');
    }

    // Check IP whitelist if configured
    if (apiKeyDoc.ipWhitelist && apiKeyDoc.ipWhitelist.length > 0) {
      const clientIp = request.ip || request.connection.remoteAddress;
      if (!apiKeyDoc.ipWhitelist.includes(clientIp)) {
        throw new UnauthorizedException('IP address not whitelisted');
      }
    }

    // Attach user payload to request
    request.user = {
      userId: apiKeyDoc.userId.toString(),
      apiKeyId: apiKeyDoc._id.toString(),
      scopes: apiKeyDoc.scopes,
      rateLimit: apiKeyDoc.rateLimit,
    };

    return true;
  }
}
