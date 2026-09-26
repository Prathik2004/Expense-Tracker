# OAuth 2.0 Implementation Summary for MCP Integration

## What Was Implemented

1. **OAuth 2.0 Authorization Server** with standard endpoints:
   - `/oauth/register` - Dynamic client registration (RFC 7591)
   - `/oauth/authorize` - Authorization endpoint (Authorization Code Flow)
   - `/oauth/token` - Token endpoint for exchanging authorization codes

2. **Special MCP OAuth Initiation Endpoint**:
   - `/mcp/oauth/initiate` - Auto-registers temporary client and redirects to OAuth flow

3. **Updated Authentication System**:
   - Modified `McpAuthGuard` to try API Key authentication first, then fall back to OAuth
   - Added `OAuthGuard` for validating JWT Bearer tokens
   - Updated `AuthModule` to include OAuth controller and schemas
   - Added `expiresAt` field to `Session` schema for authorization code storage

4. **Database Schemas**:
   - `OAuthClient` schema for storing registered clients
   - Enhanced `Session` schema with `expiresAt` field for authorization codes

## Verification Results

### Local Development
- ✅ Server starts successfully on port 3001
- ✅ OAuth endpoints accessible at `http://localhost:3001/oauth/*`
- ✅ Dynamic client registration working
- ✅ Authorization code flow functional
- ✅ MCP endpoints accessible with OAuth Bearer tokens

### Production Deployment (https://expense-tracker.pntr.dev)
- ✅ OAuth register endpoint: `POST /oauth/register` returns 201
- ✅ OAuth authorize endpoint: `GET /oauth/authorize` returns 302 redirect (when authenticated)
- ✅ OAuth token endpoint: `POST /oauth/token` returns 200 with access token
- ✅ MCP health endpoint: `GET /mcp/health` works with OAuth Bearer token (200 OK)
- ✅ MCP tools list: `GET /mcp/tools/list` works with OAuth Bearer token
- ✅ Login endpoint: `POST /auth/login` still functional (200 OK)

## Next Steps for Claude MCP Integration

### Option 1: Manual Client Registration (Recommended for Production)
1. **Register OAuth Client**:
   ```bash
   curl -X POST https://expense-tracker.pntr.dev/oauth/register \
     -H "Content-Type: application/json" \
     -d '{"name": "Claude MCP", "redirectUris": ["https://claude.ai/api/mcp/auth_callback"]}'
   ```

2. **In Claude Desktop/MCP Settings**:
   - Add new MCP server with URL: `https://expense-tracker.pntr.dev/mcp`
   - Authentication method: "OAuth 2.0"
   - Client ID: Use one from `/oauth/register` response
   - Client Secret: Use corresponding secret from registration
   - Authorization URL: `https://expense-tracker.pntr.dev/oauth/authorize`
   - Token URL: `https://expense-tracker.pntr.dev/oauth/token`
   - Scope: `mcp:full_read`
   - Redirect URI: `https://claude.ai/api/mcp/auth_callback`

### Option 2: Automatic OAuth Initiation (Easier for Testing)
1. **Initiate OAuth Flow**:
   ```bash
   curl -L https://expense-tracker.pntr.dev/mcp/oauth/initiate
   ```
   This will:
   - Auto-register a temporary OAuth client
   - Redirect to the authorization endpoint
   - User logs in and authorizes
   - Redirects back to `https://claude.ai/api/mcp/auth_callback` with code
   - Claude exchanges code for token automatically

2. **Test Flow**:
   - Initiate connection from Claude
   - Should redirect to your login page
   - After login, redirect back to Claude with authorization code
   - Claude exchanges code for token at your `/oauth/token` endpoint
   - Claude uses Bearer token to access MCP endpoints

3. **Available MCP Scopes** (can be requested during auth):
   - `mcp:full_read` - Full read access to all MCP resources
   - More specific scopes can be added in the future:
     - `goals:read`
     - `investments:read`
     - `portfolio:read`
     - `budget:read`
     - `transaction:read`

## Quick Test Commands

### Full OAuth Flow Test (with jq for JSON parsing)

```bash
# 1. Register a client
CLIENT_RESPONSE=$(curl -s -X POST http://localhost:3001/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Client", "redirectUris": ["https://claude.ai/api/mcp/auth_callback"]}')

CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.client_id')
CLIENT_SECRET=$(echo "$CLIENT_RESPONSE" | jq -r '.client_secret')
echo "Client ID: $CLIENT_ID"

# 2. Build authorization URL (open in browser after login)
AUTH_URL="http://localhost:3001/oauth/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=https://claude.ai/api/mcp/auth_callback&scope=mcp:full_read&state=test123"
echo "Open in browser: $AUTH_URL"

# 3. After authorization, you'll get a code in the redirect URL
# Run this with the code from step 3:
# CODE="your_code_here"
# TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/oauth/token \
#   -H "Content-Type: application/x-www-form-urlencoded" \
#   -d "grant_type=authorization_code&code=$CODE&redirect_uri=https://claude.ai/api/mcp/auth_callback&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET")
# ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

# 4. Test MCP endpoints with token
# curl -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3001/mcp/health
# curl -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3001/mcp/tools/list
```

### Test MCP Endpoints with API Key (Alternative)
```bash
# If you have an API key, use it directly:
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3001/mcp/health
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3001/mcp/tools/list
```

## OAuth Clarification

**This is NOT Google OAuth for MCP.** The system has two separate authentication systems:

1. **Regular App Authentication** (for users logging into the expense tracker):
   - Email/password login
   - Google OAuth (for "Sign in with Google" on the frontend)
   - Used for: `GET /auth/me`, `POST /auth/login`, `GET /auth/google`, etc.

2. **MCP OAuth** (for MCP clients like Claude to access your data):
   - Your own OAuth 2.0 Authorization Server (`/oauth/*` endpoints)
   - Used for: MCP endpoints (`/mcp/health`, `/mcp/tools/list`, etc.)
   - **Does not use Google** - it's your own token system

## Troubleshooting

If you see "Couldn't register with expensify's sign-in service":
1. Verify the MCP server URL is correct (`https://expense-tracker.pntr.dev/mcp`)
2. Ensure OAuth endpoints are accessible (tested above)
3. Check that the redirect URI matches exactly what's registered
4. Make sure you're using a valid client ID/secret pair from registration

The implementation supports both authentication methods:
- **API Key**: `x-api-key` header (existing method)
- **OAuth**: `Authorization: Bearer <token>` header (new method)

Both methods provide the same access level to MCP resources.