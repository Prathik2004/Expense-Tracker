import { Injectable, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { MCPService } from '../mcp.service';
import { MCPRequest, MCPResponse } from '../interfaces/mcp.interface';
import { UserPayload } from '../auth/api-key-payload';

interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

@Injectable()
export class SSETransport {
  private readonly logger = new Logger(SSETransport.name);

  constructor(private readonly mcpService: MCPService) {}

  async handleSSE(req: AuthenticatedRequest, res: Response) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    const initMessage = {
      type: 'connected',
      timestamp: new Date().toISOString(),
      server: 'expense-tracker-mcp',
      version: '1.0.0',
    };
    res.write(`data: ${JSON.stringify(initMessage)}\n\n`);

    // Keep connection alive with periodic ping
    const pingInterval = setInterval(() => {
      const ping = {
        type: 'ping',
        timestamp: new Date().toISOString(),
      };
      res.write(`data: ${JSON.stringify(ping)}\n\n`);
    }, 30000);

    // Handle client messages (if any)
    let buffer = '';
    req.on('data', (chunk) => {
      buffer += chunk.toString();

      // Process complete lines
      const lines = buffer.split('\n');
      const lastLine = lines.pop(); // Keep incomplete line in buffer
      buffer = lastLine ?? '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line.substring(5)); // Remove 'data: ' prefix
            this.handleSSEMessage(data, req, res);
          } catch (err) {
            this.logger.warn(`Invalid SSE message:`, err);
          }
        }
      }
    });

    req.on('close', () => {
      clearInterval(pingInterval);
      res.end();
      this.logger.log('SSE connection closed');
    });
  }

  private async handleSSEMessage(data: any, req: AuthenticatedRequest, res: Response) {
    if (!data || !data.method) {
      return;
    }

    const startTime = Date.now();
    let result: any;
    let error: { code: number; message: string; data?: any } | undefined;

    try {
      switch (data.method) {
        case 'tools/list':
          result = this.mcpService.listTools();
          break;
        case 'tools/call':
          if (!data.params) {
            throw new Error('Missing params');
          }
          const { name, arguments: args } = data.params as { name: string; arguments: Record<string, any> };
          result = await this.mcpService.handleToolCall(name, args, req['user']);
          break;
        case 'resources/list':
          result = await this.mcpService.listResources(req['user']);
          break;
        case 'resources/read':
          if (!data.params) {
            throw new Error('Missing params');
          }
          const { uri } = data.params as { uri: string };
          result = await this.mcpService.readResource(uri, req['user']);
          break;
        default:
          error = {
            code: -32601, // Method not found
            message: `Method '${data.method}' not found`,
          };
      }

      if (!error) {
        const response = {
          jsonrpc: '2.0',
          id: data.id || null,
          result,
        };
        res.write(`data: ${JSON.stringify(response)}\n\n`);
      } else {
        const response = {
          jsonrpc: '2.0',
          id: data.id || null,
          error,
        };
        res.write(`data: ${JSON.stringify(response)}\n\n`);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`SSE message ${data.method} processed in ${duration}ms`);
    } catch (err) {
      this.logger.error(`SSE message error:`, err);
      const errorResponse = {
        jsonrpc: '2.0',
        id: data.id || null,
        error: {
          code: -32603, // Internal error
          message: 'Internal server error',
        },
      };
      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
    }
  }
}