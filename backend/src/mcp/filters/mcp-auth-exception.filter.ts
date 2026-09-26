import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch(HttpException)
export class McpAuthExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  // Helper to normalize URLs by removing trailing slashes
  private normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Only handle 401 Unauthorized for MCP endpoints
    if (status === HttpStatus.UNAUTHORIZED && request.path.startsWith('/mcp')) {
      // Get MCP resource URL and OAuth issuer URL from config
      const mcpServerUrl = this.normalizeUrl(
        this.configService.get<string>('MCP_SERVER_URL') ||
        'https://expense-tracker.pntr.dev/mcp'
      );

      const oauthIssuerUrl = this.normalizeUrl(
        this.configService.get<string>('OAUTH_ISSUER_URL') ||
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000'
      );

      // Set the WWW-Authenticate header as per RFC 9728 and MCP spec
      response.setHeader(
        'WWW-Authenticate',
        `Bearer resource="${mcpServerUrl}", authorization_server="${oauthIssuerUrl}"`
      );

      // Return proper JSON-RPC error format for MCP
      return response.status(HttpStatus.UNAUTHORIZED).json({
        jsonrpc: '2.0',
        id: request.body?.id ?? null,
        error: {
          code: -32603,
          message: 'Unauthorized: Invalid or missing access token',
        },
      });
    }

    // For other status codes or non-MCP paths, use default handling
    const exceptionResponse = exception.getResponse();
    return response.status(status).json(exceptionResponse);
  }
}