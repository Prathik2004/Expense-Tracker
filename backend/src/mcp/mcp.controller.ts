import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { MCPService } from './mcp.service';
import { McpAuthGuard } from './auth/mcp-auth.guard';
import { Scopes } from './auth/scopes.decorator';
import { ScopeGuard } from './security/scope.guard';
import { ToolCallDto } from './dto/tool-call.dto';
import { UserPayload } from './auth/api-key-payload';

interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

@Controller('mcp')
@UseGuards(McpAuthGuard, ScopeGuard)
export class MCPController {
  constructor(private readonly mcpService: MCPService) {}

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Post('tools/call')
  @Scopes('mcp:full_read')
  async callTool(
    @Body() toolCallDto: ToolCallDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcpService.handleToolCall(
      toolCallDto.name,
      toolCallDto.arguments,
      req.user,
    );
  }

  @Get('tools/list')
  async listTools() {
    return this.mcpService.listTools();
  }

  @Get('resources/list')
  async listResources(@Req() req: AuthenticatedRequest) {
    return this.mcpService.listResources(req.user);
  }

  @Post('resources/read')
  async readResource(
    @Body('uri') uri: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mcpService.readResource(uri, req.user);
  }

  @Get('sse')
  async handleSSE(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Keep connection alive
    const keepAliveInterval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAliveInterval);
      res.end();
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
  }
}
