import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tool, ToolResult } from './interfaces/mcp.interface';
import { UserPayload } from './auth/api-key-payload';
import { ToolCallDto } from './dto/tool-call.dto';

@Injectable()
export class MCPService {
  private readonly logger = new Logger(MCPService.name);
  private readonly tools: Map<string, Tool> = new Map();

  constructor() {
    this.initializeTools();
  }

  private initializeTools() {
    // Tools will be registered via the ToolsModule
    // This is a placeholder - actual tools are registered by the ToolsModule
  }

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  async handleToolCall(name: string, args: Record<string, any>, user: UserPayload): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Tool '${name}' not found`,
        }],
      };
    }

    // Check if user has required scope
    if (tool.requiredScope && !user.scopes.includes(tool.requiredScope) && !user.scopes.includes('mcp:full_read')) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Insufficient permissions. Required scope: ${tool.requiredScope}`,
        }],
      };
    }

    try {
      const startTime = Date.now();
      const result = await tool.handler(args, user);
      const duration = Date.now() - startTime;

      this.logger.log(`Tool ${name} executed in ${duration}ms for user ${user.userId}`);

      return result;
    } catch (error) {
      this.logger.error(`Tool ${name} failed:`, error);
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Tool execution failed: ${error.message}`,
        }],
      };
    }
  }

  listTools(): { tools: Tool[] } {
    return {
      tools: Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        requiredScope: tool.requiredScope,
        handler: tool.handler,
      })),
    };
  }

  async listResources(user: UserPayload): Promise<{ resources: Array<{ uri: string; name: string; description: string }> }> {
    const resources = [
      {
        uri: 'expense://portfolio/summary',
        name: 'Portfolio Summary',
        description: 'Current portfolio summary including total value, gain/loss, and allocations',
      },
      {
        uri: 'expense://portfolio/holdings',
        name: 'Portfolio Holdings',
        description: 'Current holdings by category with values',
      },
      {
        uri: 'expense://portfolio/history',
        name: 'Portfolio History',
        description: 'Historical portfolio snapshots with pagination',
      },
      {
        uri: 'expense://budgets/all',
        name: 'All Budgets',
        description: 'List of all active budgets with spending progress',
      },
      {
        uri: 'expense://transactions/all',
        name: 'All Transactions',
        description: 'Filtered transaction history with pagination',
      },
      {
        uri: 'expense://goals/all',
        name: 'All Goals',
        description: 'Active savings goals with progress',
      },
      {
        uri: 'expense://investments/all',
        name: 'All Investments',
        description: 'Connected investments and performance metrics',
      },
    ];

    return { resources };
  }

  async readResource(uri: string, user: UserPayload): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
    // Resources are handled via the same tool logic
    // For now, return a placeholder
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({ message: `Resource ${uri} not yet implemented` }),
      }],
    };
  }
}