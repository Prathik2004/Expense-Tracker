import { Injectable, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { MCPService } from '../mcp.service';
import { MCPRequest, MCPResponse } from '../interfaces/mcp.interface';
import { UserPayload } from '../auth/api-key-payload';

interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

@Injectable()
export class HttpTransport {
  private readonly logger = new Logger(HttpTransport.name);

  constructor(private readonly mcpService: MCPService) {}

  async handleMCPRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const startTime = Date.now();
      const requestBody = req.body as MCPRequest;

      // Validate JSON-RPC request
      if (!requestBody || requestBody.jsonrpc !== '2.0' || typeof requestBody.id === 'undefined') {
        res.status(400).json({
          jsonrpc: '2.0',
          id: requestBody?.id || null,
          error: {
            code: -32600, // Invalid Request
            message: 'Invalid JSON-RPC request',
          },
        });
        return;
      }

      let result: any;
      let error: { code: number; message: string; data?: any } | undefined;

      try {
        switch (requestBody.method) {
          case 'initialize':
            result = await this.handleInitialize(requestBody.params || {});
            break;
          case 'tools/list':
            result = this.mcpService.listTools();
            break;
          case 'tools/call':
            if (!requestBody.params) {
              throw new Error('Missing params');
            }
            const { name, arguments: args } = requestBody.params as { name: string; arguments: Record<string, any> };
            result = await this.mcpService.handleToolCall(name, args, req.user);
            break;
          case 'resources/list':
            result = await this.mcpService.listResources(req.user);
            break;
          case 'resources/read':
            if (!requestBody.params) {
              throw new Error('Missing params');
            }
            const { uri } = requestBody.params as { uri: string };
            result = await this.mcpService.readResource(uri, req.user);
            break;
          default:
            error = {
              code: -32601, // Method not found
              message: `Method '${requestBody.method}' not found`,
            };
        }

        if (!error) {
          res.json({
            jsonrpc: '2.0',
            id: requestBody.id,
            result,
          });
        } else {
          res.status(400).json({
            jsonrpc: '2.0',
            id: requestBody.id,
            error,
          });
        }

        const duration = Date.now() - startTime;
        this.logger.log(`MCP request ${requestBody.method} processed in ${duration}ms`);
      } catch (err) {
        this.logger.error(`MCP request error:`, err);
        res.status(500).json({
          jsonrpc: '2.0',
          id: requestBody.id,
          error: {
            code: -32603, // Internal error
            message: 'Internal server error',
          },
        });
      }
    } catch (err) {
      this.logger.error('MCP transport error:', err);
      res.status(500).json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal server error',
        },
      });
    }
  }

  private async handleInitialize(params: Record<string, any>): Promise<any> {
    // Return MCP initialize response according to spec
    return {
      protocolVersion: '2025-06-18', // Match the version from test request
      capabilities: {
        tools: {
          listChanged: false
        },
        resources: {
          subscribe: false,
          listChanged: false
        },
        logging: {}
      },
      serverInfo: {
        name: 'Expense Tracker MCP Server',
        version: '1.0.0'
      }
    };
  }
}