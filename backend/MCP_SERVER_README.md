# MCP Server Documentation

## Overview

The Expense Tracker MCP (Model Context Protocol) Server is an industry-grade, read-only API that exposes your financial data through the Model Context Protocol. This allows AI assistants like Claude to access your portfolio, budgets, transactions, goals, and investments securely.

**Key Features:**
- 🔐 **Enterprise-Grade Security**: API keys, rate limiting, audit logging, scope-based permissions
- 📊 **15 Read-Only Tools**: Access to portfolio, budgets, transactions, goals, and investments
- 🚀 **HTTP/SSE Transport**: Server-Sent Events for real-time data streaming
- 📈 **Performance Optimized**: Sliding window rate limiting, database indexing
- 🔍 **Comprehensive Audit Logging**: Every API call logged with sanitization
- 🌐 **CORS Enabled**: Safe cross-origin access

## Quick Start

### 1. Generate an API Key

Visit the settings page at `/settings/mcp` and:
1. Click "Create New Key"
2. Enter a name (e.g., "Claude Desktop")
3. Select scopes (permissions)
4. Copy the key immediately (you won't see it again!)

### 2. Configure Your MCP Client

In Claude Code or other MCP clients:

```json
{
  "mcpServers": {
    "expense-tracker": {
      "command": "npx",
      "args": ["@anthropic/mcp-client"],
      "env": {
        "MCP_URL": "http://localhost:3000/mcp",
        "MCP_API_KEY": "sk_xxxx_xxxx"
      }
    }
  }
}
```

### 3. Start Using

Claude can now access your financial data:
```
"What's my portfolio performance?"
"Show me my budget vs actual spending"
"What are my investment returns?"
```

## API Reference

### Base URL
```
http://localhost:3000/mcp
```

### Authentication
All requests must include:
```
X-API-Key: your_api_key_here
```

### Tools

#### Portfolio Tools

**`get_portfolio_summary`**
- Get total portfolio value, gain/loss, and allocations
- Scope: `portfolio:read`
- Parameters: None
- Returns: `{ totalValue, totalInvested, gainLoss, gainLossPercentage, allocations }`

**`get_holdings`**
- Get current holdings by category
- Scope: `portfolio:read`
- Parameters: None
- Returns: `{ holdings[], totalValue }`

**`get_investments`**
- Get connected investments (INDmoney)
- Scope: `investments:read`
- Parameters: None
- Returns: `{ investments[], summary }`

**`get_portfolio_history`**
- Get historical portfolio snapshots
- Scope: `portfolio:read`
- Parameters:
  - `offset` (number, default: 0)
  - `limit` (number, 1-100, default: 20)
- Returns: `{ snapshots[], pagination }`

#### Budget Tools

**`get_budgets`**
- Get active budgets with spending progress
- Scope: `budget:read`
- Parameters: None
- Returns: `{ budgets[], totalBudgeted, totalSpent }`

**`get_budget_spending`**
- Get spending vs budget for a period
- Scope: `budget:read`
- Parameters:
  - `category` (string, optional)
  - `startDate` (ISO date, optional)
  - `endDate` (ISO date, optional)
- Returns: `{ budgets, actualSpending, budgetVsActual[] }`

#### Transaction Tools

**`get_transactions`**
- Get filtered transaction history
- Scope: `transaction:read`
- Parameters:
  - `fromDate` (ISO date, optional)
  - `toDate` (ISO date, optional)
  - `category` (string, optional)
  - `type` (enum: income/expense/transfer, optional)
  - `minAmount` (number, optional)
  - `maxAmount` (number, optional)
  - `offset` (number, default: 0)
  - `limit` (number, 1-100, default: 20)
- Returns: `{ transactions[], pagination }`

**`get_transaction_stats`**
- Get income/expense breakdown by period
- Scope: `transaction:read`
- Parameters:
  - `fromDate` (ISO date, optional)
  - `toDate` (ISO date, optional)
- Returns: `{ overview[], categoryBreakdown[], period }`

#### Goals Tools

**`get_goals`**
- Get active savings goals with progress
- Scope: `goals:read`
- Parameters: None
- Returns: `{ goals[], summary }`

**`get_goal_contributions`**
- Get contribution history for goals
- Scope: `goals:read`
- Parameters:
  - `goalId` (string, optional)
  - `offset` (number, default: 0)
  - `limit` (number, 1-100, default: 20)
- Returns: `{ contributions[], totalContributed, pagination }`

#### Investment Tools

**`get_investment_performance`**
- Get investment performance metrics
- Scope: `investments:read`
- Parameters: None
- Returns: `{ overall, investments[] }`

**`get_asset_allocation`**
- Get asset allocation by type
- Scope: `investments:read`
- Parameters: None
- Returns: `{ allocation[], totalValue, assetTypes }`

## Authentication & Security

### API Key Scopes

- `mcp:full_read` - Full read access to all data
- `portfolio:read` - Portfolio data only
- `budget:read` - Budget data only
- `transaction:read` - Transaction data only
- `goals:read` - Goals data only
- `investments:read` - Investment data only

### Rate Limiting

Default limits (customizable per key):
- 60 requests per minute
- 10,000 requests per day

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1234567890
```

When limit exceeded:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
```

### Audit Logging

All API calls are logged with:
- Timestamp
- API key ID
- Tool name
- Parameters (sanitized)
- Response status
- Duration
- IP address
- User agent
- Any errors

Logs are automatically deleted after 90 days.

## Configuration

### Environment Variables

```bash
# Server
MCP_PORT=3001
MCP_HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/expense-tracker

# API Keys
API_KEY_EXPIRY_DAYS=365
API_KEY_MAX_AGE_DAYS=90

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_REQUESTS_PER_HOUR=1000
RATE_LIMIT_REQUESTS_PER_DAY=10000

# Logging
LOG_LEVEL=info
AUDIT_LOG_RETENTION_DAYS=90

# Security
ENABLE_HTTPS=true
CORS_ORIGINS=http://localhost:3000,https://app.example.com
```

## Deployment

### Using Docker

```bash
# Build
docker build -t expense-tracker-mcp -f Dockerfile.mcp .

# Run
docker run -p 3001:3001 \
  -e MONGODB_URI=mongodb://mongo:27017/expense-tracker \
  -e MCP_PORT=3001 \
  expense-tracker-mcp
```

### Docker Compose

```yaml
services:
  mcp-server:
    build:
      context: ./backend
      dockerfile: Dockerfile.mcp
    ports:
      - "3001:3001"
    environment:
      MONGODB_URI: mongodb://mongo:27017/expense-tracker
      MCP_PORT: 3001
      LOG_LEVEL: info
    depends_on:
      - mongo
    restart: always
```

## Examples

### Get Portfolio Summary

```bash
curl -X POST http://localhost:3001/mcp/tools/call \
  -H "X-API-Key: sk_xxxx_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_portfolio_summary",
    "arguments": {}
  }'
```

Response:
```json
{
  "totalValue": 500000,
  "totalInvested": 400000,
  "gainLoss": 100000,
  "gainLossPercentage": 25,
  "allocations": {
    "Indian Stocks": 150000,
    "Mutual Funds": 200000,
    "Gold": 100000,
    "US Stocks": 50000
  }
}
```

### Get Transactions for August

```bash
curl -X POST http://localhost:3001/mcp/tools/call \
  -H "X-API-Key: sk_xxxx_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_transactions",
    "arguments": {
      "fromDate": "2026-08-01",
      "toDate": "2026-08-31",
      "limit": 50
    }
  }'
```

### List Available Tools

```bash
curl http://localhost:3001/mcp/tools/list \
  -H "X-API-Key: sk_xxxx_xxxx"
```

## Troubleshooting

### "Invalid API key"
- Ensure the key is correct and not expired
- Check that it hasn't been revoked
- Verify the `X-API-Key` header is set

### "Rate limit exceeded"
- Wait for the `Retry-After` seconds
- Consider batching requests
- Use a different API key with higher limits

### "Insufficient permissions"
- Verify the API key has the required scope
- Use `mcp:full_read` for full access
- Check the scope requirements for the tool

### "Tool not found"
- Verify the tool name is spelled correctly
- Check available tools with `/mcp/tools/list`
- Ensure your API key version supports the tool

## Performance Tips

1. **Pagination**: Always use pagination for large result sets
2. **Filtering**: Use date ranges and category filters to reduce data
3. **Caching**: Implement client-side caching for frequently accessed data
4. **Batch Requests**: Combine related requests in a single tool call when possible

## Security Best Practices

1. **API Key Management**
   - Store keys in secure secret managers
   - Rotate keys regularly
   - Use narrow scopes when possible
   - Revoke unused keys

2. **Transport**
   - Always use HTTPS in production
   - Enable CORS only for trusted origins
   - Don't share API keys in logs or version control

3. **Monitoring**
   - Check audit logs regularly
   - Set up alerts for unusual activity
   - Monitor rate limit usage

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review audit logs for API key issues
3. Verify scopes and permissions
4. Check MongoDB connection and indexes

## API Status

Health check endpoint:
```bash
curl http://localhost:3001/mcp/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-09-20T14:15:18.545Z",
  "version": "1.0.0"
}
```
