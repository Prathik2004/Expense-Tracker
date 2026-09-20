export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  requiredScope?: string;
  handler: (args: Record<string, any>, user: UserPayload) => Promise<ToolResult>;
}

export interface ToolResult {
  isError?: boolean;
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
}

export interface UserPayload {
  userId: string;
  apiKeyId: string;
  scopes: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string;
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}