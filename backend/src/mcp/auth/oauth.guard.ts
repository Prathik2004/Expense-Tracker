import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class OAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Validate the JWT token
      const payload = await this.authService.validateToken(token);

      // Attach user payload to request (similar to ApiKeyGuard)
      request.user = {
        userId: payload.sub,
        // For OAuth, we don't have an API key ID, so we'll use a placeholder or derive from session
        apiKeyId: 'oauth_' + payload.sessionId || payload.sub,
        scopes: ['mcp:full_read'], // Default scope for OAuth users - adjust as needed
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerDay: 10000,
        },
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}