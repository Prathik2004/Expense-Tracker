#!/bin/bash
# MCP OAuth Testing Script
# Run this from the project root to test the OAuth flow

BASE_URL="http://localhost:3001"
# BASE_URL="https://expense-tracker.pntr.dev"  # For production

echo "=========================================="
echo "MCP OAuth Testing Script"
echo "=========================================="
echo ""

# Step 1: Register an OAuth Client
echo "Step 1: Register OAuth Client"
echo "------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/oauth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Claude MCP Test Client",
    "redirectUris": ["https://claude.ai/api/mcp/auth_callback"]
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

CLIENT_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.client_id')
CLIENT_SECRET=$(echo "$REGISTER_RESPONSE" | jq -r '.client_secret')

if [ "$CLIENT_ID" = "null" ] || [ -z "$CLIENT_ID" ]; then
  echo "❌ Failed to register client"
  exit 1
fi

echo "✅ Client registered successfully"
echo "   Client ID: $CLIENT_ID"
echo "   Client Secret: $CLIENT_SECRET"
echo ""

# Step 2: Start Authorization Flow (would need user login)
echo "Step 2: Authorization URL (for browser)"
echo "----------------------------------------"
AUTH_URL="$BASE_URL/oauth/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=https://claude.ai/api/mcp/auth_callback&scope=mcp:full_read&state=test123&code_challenge=testchallenge&code_challenge_method=S256"
echo "Open this URL in your browser after logging in:"
echo "$AUTH_URL"
echo ""

# Step 3: After authorization, you'd get a code back
# This would be done automatically by Claude in the real flow
# For testing, you'd need to:
# 1. Open the above URL in browser
# 2. Login to the expense tracker
# 3. Copy the 'code' parameter from the redirect URL
# 4. Run step 4 with that code

echo "Step 3: After authorization, you'll be redirected to:"
echo "https://claude.ai/api/mcp/auth_callback?code=AUTH_CODE_HERE&state=test123"
echo ""
echo "Copy the 'code' parameter value and run:"
echo ""
echo "  ./test-mcp-oauth.sh token <CODE>"
echo ""

# Step 4: Exchange code for token (if code provided)
if [ "$1" = "token" ] && [ -n "$2" ]; then
  CODE="$2"
  echo "Step 4: Exchange Authorization Code for Token"
  echo "----------------------------------------------"

  TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/oauth/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=authorization_code&code=$CODE&redirect_uri=https://claude.ai/api/mcp/auth_callback&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&code_verifier=testverifier")

  echo "$TOKEN_RESPONSE" | jq '.'
  echo ""

  ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

  if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
    echo "✅ Token obtained successfully"
    echo "   Access Token: $ACCESS_TOKEN"
    echo ""

    # Step 5: Test MCP endpoints with token
    echo "Step 5: Test MCP Endpoints with OAuth Token"
    echo "--------------------------------------------"

    echo "Testing /mcp/health..."
    curl -s -X GET "$BASE_URL/mcp/health" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    echo "Testing /mcp/tools/list..."
    curl -s -X GET "$BASE_URL/mcp/tools/list" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""

    echo "Testing /mcp/resources/list..."
    curl -s -X GET "$BASE_URL/mcp/resources/list" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
    echo ""
  else
    echo "❌ Failed to obtain token"
  fi
fi

echo "=========================================="
echo "Usage: ./test-mcp-oauth.sh [token <CODE>]"
echo "=========================================="