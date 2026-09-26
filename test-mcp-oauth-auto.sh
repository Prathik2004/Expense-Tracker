#!/bin/bash
# MCP OAuth Auto-Initiation Testing Script
# Tests the new /mcp/oauth/initiate endpoint

BASE_URL="http://localhost:3001"
# BASE_URL="https://expense-tracker.pntr.dev"  # For production

echo "=========================================="
echo "MCP OAuth Auto-Initiation Testing Script"
echo "=========================================="
echo ""
echo "This script tests the new /mcp/oauth/initiate endpoint"
echo "which automatically registers a temporary client and starts the OAuth flow."
echo ""

# Step 1: Test the MCP OAuth initiation endpoint
echo "Step 1: Test MCP OAuth Initiation Endpoint"
echo "------------------------------------------"
echo "Making request to: $BASE_URL/mcp/oauth/initiate"
echo ""
echo "Response (should be a redirect):"
curl -s -i -X GET "$BASE_URL/mcp/oauth/initiate" | head -20
echo ""

# Step 2: Explain what happens next
echo "Step 2: What happens next (manual steps required)"
echo "--------------------------------------------------"
echo "1. The above request should return a 302 redirect to the OAuth authorize endpoint"
echo "2. You would need to follow that redirect in a browser"
echo "3. Login to the expense tracker when prompted"
echo "4. Authorize the application"
echo "5. You'll be redirected to https://claude.ai/api/mcp/auth_callback?code=...&state=..."
echo "6. Claude would then exchange the code for a token"
echo ""
echo "NOTE: For full automation, Claude would need to handle this flow automatically."
echo "This endpoint makes it easier for Claude to initiate the OAuth flow."
echo ""

# Step 3: Test manual OAuth registration flow (alternative)
echo "Step 3: Manual OAuth Registration Flow (Alternative)"
echo "----------------------------------------------------"
echo "Register a client manually:"
MANUAL_REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/oauth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual Test Client",
    "redirectUris": ["https://claude.ai/api/mcp/auth_callback"]
  }')

echo "$MANUAL_REGISTER_RESPONSE" | jq '.'
echo ""

MANUAL_CLIENT_ID=$(echo "$MANUAL_REGISTER_RESPONSE" | jq -r '.client_id')
MANUAL_CLIENT_SECRET=$(echo "$MANUAL_REGISTER_RESPONSE" | jq -r '.client_secret')

if [ "$MANUAL_CLIENT_ID" != "null" ] && [ -n "$MANUAL_CLIENT_ID" ]; then
  echo "✅ Manual client registration successful"
  echo "   Client ID: $MANUAL_CLIENT_ID"
  echo "   Client Secret: $MANUAL_CLIENT_SECRET"
  echo ""

  echo "Authorization URL for manual flow:"
  AUTH_URL="$BASE_URL/oauth/authorize?response_type=code&client_id=$MANUAL_CLIENT_ID&redirect_uri=https://claude.ai/api/mcp/auth_callback&scope=mcp:full_read&state=manual123"
  echo "$AUTH_URL"
  echo ""

  echo "After authorization, you'll get redirected to:"
  echo "https://claude.ai/api/mcp/auth_callback?code=...&state=manual123"
  echo ""
  echo "Then you can test the token exchange with:"
  echo ""
  echo "  ./test-mcp-oauth.sh token <CODE_FROM_REDIRECT>"
  echo ""
else
  echo "❌ Manual client registration failed"
fi

# Step 4: Test MCP endpoints with API key (if available)
echo "Step 4: Test MCP Endpoints with API Key (Alternative)"
echo "------------------------------------------------------"
echo "If you have an API key from the frontend or elsewhere, you can test directly:"
echo ""
echo "  curl -H \"x-api-key: YOUR_API_KEY\" $BASE_URL/mcp/health"
echo "  curl -H \"x-api-key: YOUR_API_KEY\" $BASE_URL/mcp/tools/list"
echo "  curl -H \"x-api-key: YOUR_API_KEY\" $BASE_URL/mcp/resources/list"
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo "The new /mcp/oauth/initiate endpoint provides an easier way for"
echo "Claude to initiate the OAuth flow by:"
echo "1. Automatically registering a temporary OAuth client"
echo "2. Redirecting to the OAuth authorization endpoint"
echo "3. After user login/authorization, redirecting back to Claude"
echo ""
echo "For production use, the manual registration flow is still recommended"
echo "as it gives you more control over the client credentials."
echo "=========================================="