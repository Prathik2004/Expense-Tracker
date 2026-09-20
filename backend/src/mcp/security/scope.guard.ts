import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../auth/scopes.decorator';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required scopes from the route metadata
    const requiredScopes = this.reflector.get<string[]>(SCOPES_KEY, context.getHandler());

    // If no scopes are required, allow access
    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.scopes) {
      throw new ForbiddenException('User scopes not found');
    }

    // Check if user has at least one of the required scopes, or has the super scope
    const hasRequiredScope = requiredScopes.some(
      scope => user.scopes.includes(scope) || user.scopes.includes('mcp:full_read'),
    );

    if (!hasRequiredScope) {
      throw new ForbiddenException(
        `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`,
      );
    }

    return true;
  }
}