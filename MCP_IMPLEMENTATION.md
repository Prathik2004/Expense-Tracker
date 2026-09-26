# MCP (Model Context Protocol) Server Implementation

## Overview

This document provides comprehensive details on the MCP server implementation for the Expense Tracker backend, enabling integration with Claude's Custom Connector via OAuth 2.0 and the Model Context Protocol.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MCP Server Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Client    │───▶│   MCP       │───▶│   Backend   │             │
│  │  (Claude)   │    │  Gateway    │    │   Services  │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                          │                                           │
│              ┌──────────┴──────────┐                                │
│              ▼                     ▼                                │
│      ┌─────────────┐         ┌─────────────┐                        │
│      │   OAuth 2.0 │         │   MCP       │                        │
│      │   Auth      │         │   Protocol  │                        │
│      │   Server    │         │   Handler   │                        │
│      └─────────────┘         └─────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. MCP Module (`src/mcp/mcp.module.ts`)

Central module coordinating all MCP functionality:

```typescript
@Module({
  imports: [
    ConfigModule.forFeature(mcpConfig),
    MongooseModule.forFeature([
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    ApiKeyModule,
    AuthModule,          // Provides OAuthClientModel
    SecurityModule,
    forwardRef(() => ToolsModule),
  ],
  controllers: [MCPController, OauthDiscoveryController],
  providers: [
    MCPService,
    HttpTransport,
    SSETransport,
    McpAuthExceptionFilter,
  ],
  exports: [MCPService, HttpTransport, SSETransport],
})
export class MCPModule {}
```

### 2. MCP Controller (`src/mcp/mcp.controller.ts`)

Main controller handling MCP protocol endpoints:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/mcp/health` | GET | Public | Health check |
| `/mcp/oauth/initiate` | GET | Public | Initiate OAuth flow for Claude |
| `/mcp/tools/call` | POST | `mcp:full_read` | Execute MCP tool |
| `/mcp/tools/list` | GET | `mcp:full_read` | List available tools |
| `/mcp/resources/list` | GET | Authenticated | List MCP resources |
| `/mcp/resources/read` | POST | Authenticated | Read MCP resource |
| `/mcp/sse` | GET | Authenticated | Server-Sent Events stream |

### 3. OAuth Discovery Controller (`src/mcp/oauth-discovery.controller.ts`)

Implements RFC 8414 and RFC 9728 discovery endpoints:

#### `GET /.well-known/oauth-authorization-server`

Returns OAuth 2.0 Authorization Server Metadata:

```json
{
  "issuer": "https://expense-tracker-ramo.vercel.app",
  "authorization_endpoint": "https://expense-tracker-ramo.vercel.app/oauth/authorize",
  "token_endpoint": "https://expense-tracker-ramo.vercel.app/oauth/token",
  "registration_endpoint": "https://expense-tracker-ramo.vercel.app/oauth/register",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "scopes_supported": [
    "mcp:full_read",
    "transaction:read",
    "portfolio:read",
    "budget:read",
    "goal:read",
    "investment:read"
  ],
  "code_challenge_methods_supported": ["plain", "S256"],
  "token_endpoint_auth_signing_alg_values_supported": []
}
```

#### `GET /.well-known/oauth-protected-resource`

Returns OAuth 2.0 Protected Resource Metadata (RFC 9728):

```json
{
  "resource": "https://expense-tracker.pntr.dev/mcp",
  "authorization_servers": ["https://expense-tracker-ramo.vercel.app"],
  "scopes_supported": [
    "mcp:full_read",
    "transaction:read",
    "portfolio:read",
    "budget:read",
    "goal:read",
    "investment:read"
  ],
  "bearer_auth_methods_supported": ["header"],
  "resource_documentation": "https://expense-tracker.pntr.dev/docs/mcp"
}
```

### 4. Authentication System

#### Dual Authentication Support

The MCP server supports two authentication methods:

1. **API Key** (Header: `X-API-Key`)
2. **OAuth 2.0 Bearer Token** (Header: `Authorization: Bearer <token>`)

#### McpAuthGuard (`src/mcp/auth/mcp-auth.guard.ts`)

Implements fallback authentication strategy:

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  // 1. Try API Key authentication first
  try {
    const isApiKeyValid = await this.apiKeyGuard.canActivate(context);
    if (isApiKeyValid) return true;
  } catch (apiKeyError) {
    // API key validation failed, try OAuth
  }

  // 2. Try OAuth authentication
  try {
    return await this.oauthGuard.canActivate(context);
  } catch (oauthError) {
    throw new UnauthorizedException('Invalid authentication credentials');
  }
}
```

### 5. Exception Filter (`src/mcp/filters/mcp-auth-exception.filter.ts`)

Handles 401 Unauthorized responses with proper WWW-Authenticate header per RFC 9728:

```typescript
@Catch(HttpException)
export class McpAuthExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    if (status === HttpStatus.UNAUTHORIZED && request.path.startsWith('/mcp')) {
      const mcpServerUrl = this.normalizeUrl(
        this.configService.get<string>('MCP_SERVER_URL') || 'https://expense-tracker.pntr.dev/mcp'
      );
      const oauthIssuerUrl = this.normalizeUrl(
        this.configService.get<string>('OAUTH_ISSUER_URL') || 'http://localhost:3000'
      );

      response.setHeader(
        'WWW-Authenticate',
        `Bearer resource="${mcpServerUrl}", authorization_server="${oauthIssuerUrl}"`
      );

      return response.status(HttpStatus.UNAUTHORIZED).json({
        jsonrpc: '2.0',
        id: request.body?.id ?? null,
        error: {
          code: -32603,
          message: 'Unauthorized: Invalid or missing access token',
        },
      });
    }
    // ... default handling
  }
}
```

---

## Configuration

### Environment Variables (`.env`)

```env
# OAuth Configuration
OAUTH_ISSUER_URL=https://expense-tracker-ramo.vercel.app
MCP_SERVER_URL=https://expense-tracker.pntr.dev/mcp
FRONTEND_URL=https://expense-tracker-ramo.vercel.app/

# Server
PORT=3001
MCP_PORT=3001
MCP_HOST=0.0.0.0
```

### URL Normalization

All URL configuration uses a `normalizeUrl()` helper to prevent double slashes:

```typescript
private normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}
```

---

## OAuth 2.0 Flow for Claude Custom Connector

### Flow Diagram

```
┌─────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Claude │────▶│  MCP Server      │────▶│  OAuth Server    │
│         │     │  /mcp/oauth/     │     │  /oauth/authorize│
│         │     │  initiate        │     │                  │
└─────────┘     └──────────────────┘     └────────┬─────────┘
                                                   │
                              ┌────────────────────┘
                              ▼
                     ┌──────────────────┐
                     │  User Consent    │
                     │  (Claude UI)     │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Callback to     │
                     │  claude.ai/api/  │
                     │  mcp/auth_       │
                     │  callback        │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Token Exchange  │
                     │  /oauth/token    │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Access Token    │
                     │  Granted         │
                     └──────────────────┘
```

### Initiating OAuth Flow

**Endpoint:** `GET /mcp/oauth/initiate` (Public)

**Response:** 302 Redirect to authorization endpoint with PKCE parameters:

```
Location: https://expense-tracker-ramo.vercel.app/oauth/authorize?
  response_type=code&
  client_id=mcp_claude_<random>&
  redirect_uri=https%3A%2F%2Fclaude.ai%2Fapi%2Fmcp%2Fauth_callback&
  scope=mcp%3Afull_read&
  state=<random>&
  code_challenge=placeholder_challenge&
  code_challenge_method=S256
```

### Token Exchange

Claude exchanges the authorization code for tokens at:
```
POST https://expense-tracker-ramo.vercel.app/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=<auth_code>&
redirect_uri=https://claude.ai/api/mcp/auth_callback&
client_id=<client_id>&
client_secret=<client_secret>
```

---

## MCP Protocol Implementation

### JSON-RPC 2.0 Transport

The MCP server uses JSON-RPC 2.0 over HTTP and SSE transports.

#### HTTP Transport (`src/mcp/transports/http.transport.ts`)

Handles request/response pattern for tool calls and resource operations.

#### SSE Transport (`src/mcp/transports/sse.transport.ts`)

Provides real-time streaming for MCP notifications.

### Available Tools

| Tool | Description | Required Scope |
|------|-------------|----------------|
| `list_transactions` | List expense transactions | `transaction:read` |
| `create_transaction` | Create new transaction | `transaction:write` |
| `list_portfolio` | List portfolio holdings | `portfolio:read` |
| `list_budgets` | List budgets | `budget:read` |
| `list_goals` | List financial goals | `goal:read` |
| `list_investments` | List investments | `investment:read` |

### Resources

MCP Resources provide read-only access to data:

- `transactions://all` - All transactions
- `portfolio://holdings` - Portfolio holdings
- `budgets://all` - All budgets
- `goals://all` - All goals
- `investments://all` - All investments

---

## Security

### Scopes

| Scope | Description |
|-------|-------------|
| `mcp:full_read` | Full read access to all MCP resources |
| `transaction:read` | Read transactions |
| `portfolio:read` | Read portfolio data |
| `budget:read` | Read budget data |
| `goal:read` | Read goal data |
| `investment:read` | Read investment data |

### Rate Limiting

- 60 requests per minute
- 10,000 requests per day
- Configurable via `RATE_LIMIT_REQUESTS_PER_MINUTE` and `RATE_LIMIT_REQUESTS_PER_DAY`

### Audit Logging

All MCP requests are logged with:
- User ID
- Tool/Resource accessed
- Timestamp
- Request/Response metadata

---

## Deployment

### Production URLs

| Component | URL |
|-----------|-----|
| MCP Server | `https://expense-tracker.pntr.dev/mcp` |
| OAuth Issuer | `https://expense-tracker-ramo.vercel.app` |
| OAuth Authorize | `https://expense-tracker-ramo.vercel.app/oauth/authorize` |
| OAuth Token | `https://expense-tracker-ramo.vercel.app/oauth/token` |
| OAuth Register | `https://expense-tracker-ramo.vercel.app/oauth/register` |

### Discovery Endpoints

| Endpoint | URL |
|----------|-----|
| Auth Server Metadata | `https://expense-tracker.pntr.dev/.well-known/oauth-authorization-server` |
| Protected Resource Metadata | `https://expense-tracker.pntr.dev/.well-known/oauth-protected-resource` |

### Health Check

```
GET https://expense-tracker.pntr.dev/mcp/health
```

---

## Integration with Claude Custom Connector

### Configuration in Claude

1. **MCP Server URL**: `https://expense-tracker.pntr.dev/mcp`
2. **OAuth Discovery**: Automatic via `/.well-known/oauth-authorization-server`
3. **Scopes Requested**: `mcp:full_read` (minimum)
4. **Redirect URI**: `https://claude.ai/api/mcp/auth_callback`

### Testing the Integration

```bash
# Test health endpoint (public)
curl -i https://expense-tracker.pntr.dev/mcp/health

# Test OAuth discovery endpoints
curl -i https://expense-tracker.pntr.dev/.well-known/oauth-authorization-server
curl -i https://expense-tracker.pntr.dev/.well-known/oauth-protected-resource

# Test 401 response with WWW-Authenticate header
curl -i https://expense-tracker.pntr.dev/mcp/health

# Initiate OAuth flow
curl -i https://expense-tracker.pntr.dev/mcp/oauth/initiate
```

---

## Troubleshooting

### Common Issues

#### 1. Double Slashes in URLs
**Problem:** URLs like `https://example.com//oauth/authorize`
**Solution:** Ensure `normalizeUrl()` is used and `FRONTEND_URL` doesn't have trailing slash, or use separate `OAUTH_ISSUER_URL`.

#### 2. Missing WWW-Authenticate Header
**Problem:** 401 responses don't include proper Bearer token header
**Solution:** Ensure `McpAuthExceptionFilter` is registered globally or on controller.

#### 3. OAuthClientModel Dependency Injection Error
**Problem:** `Nest can't resolve dependencies of the MCPController (?, ?, OAuthClientModel)`
**Solution:** Export `MongooseModule` from `AuthModule`:
```typescript
exports: [AuthService, OAuthGuard, MongooseModule]
```

#### 4. Discovery Endpoints Return 404
**Problem:** `/.well-known/oauth-authorization-server` returns 404
**Solution:** Ensure `OauthDiscoveryController` is registered in `MCPModule` controllers and server is restarted.

---

## Files Modified/Created

| File | Description |
|------|-------------|
| `src/mcp/mcp.module.ts` | Module registration |
| `src/mcp/mcp.controller.ts` | Main MCP endpoints |
| `src/mcp/oauth-discovery.controller.ts` | OAuth discovery endpoints |
| `src/mcp/filters/mcp-auth-exception.filter.ts` | 401 exception handling |
| `src/mcp/auth/mcp-auth.guard.ts` | Dual auth guard |
| `src/auth/public.decorator.ts` | Public endpoint decorator |
| `src/auth/auth.module.ts` | Exports MongooseModule |
| `.env` | OAuth configuration variables |

---

## Verification Checklist

- [x] `GET /.well-known/oauth-authorization-server` returns 200 with correct metadata
- [x] `GET /.well-known/oauth-protected-resource` returns 200 with correct metadata
- [x] No double slashes in any URLs (issuer, endpoints, resource)
- [x] `WWW-Authenticate` header present on 401 responses with `resource` and `authorization_server`
- [x] `GET /mcp/health` returns 200 (public)
- [x] `GET /mcp/oauth/initiate` returns 302 redirect to OAuth authorize
- [x] OAuth flow works with PKCE (S256)
- [x] API Key and OAuth Bearer token authentication both work
- [x] Server builds without TypeScript errors
- [x] Server starts successfully

---

## References

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [RFC 8414 - OAuth 2.0 Authorization Server Metadata](https://www.rfc-editor.org/rfc/rfc8414.txt)
- [RFC 9728 - OAuth 2.0 Protected Resource Metadata](https://www.rfc-editor.org/rfc/rfc9728.txt)
- [RFC 7636 - PKCE](https://www.rfc-editor.org/rfc/rfc7636.txt)
- [Claude Custom Connector Documentation](https://docs.anthropic.com/claude/docs/mcp-custom-connector)