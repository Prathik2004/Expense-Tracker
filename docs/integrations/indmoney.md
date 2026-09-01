# INDmoney Integration

Overview
--------
This document describes the INDmoney integration. The implementation is adapter-based and configurable via environment variables.

Requirements
------------
- Set the following environment variables in production (do NOT commit secrets):

```
INDMONEY_CLIENT_ID=
INDMONEY_CLIENT_SECRET=
INDMONEY_REDIRECT_URI=
INDMONEY_MCP_URL=https://mcp.indmoney.com/mcp
INDMONEY_OAUTH_AUTHORIZE_URL=
INDMONEY_OAUTH_TOKEN_URL=
INDMONEY_SCOPES=read:portfolio
ENCRYPTION_KEY=  # 32-byte secret for token encryption (or use JWT_SECRET)
```

What is implemented
--------------------
- INDmoney NestJS module scaffolding: controllers, services, client, normalizer, sync.
- `IndmoneyConnection` schema to store encrypted tokens and status.
- `Investment` schema for normalized holdings with a unique compound index to avoid duplicates.
- PKCE + state management (in-memory) and example authorization URL generation.
- Manual sync endpoint that fetches from MCP and upserts normalized investments.
- Basic encryption util for token-at-rest encryption.

Limitations / Next steps
------------------------
- The code expects official INDmoney OAuth and MCP endpoints configured via env variables. If those are not set, token exchange and MCP calls will not run; the implementation will surface that limitation rather than use unofficial APIs.
- State/PKCE store is currently in-memory — for production persist to DB or cache.
- Token revocation flow is not implemented because INDmoney revocation endpoint is not documented here.
- Add unit tests for auth, normalization, and deduplication (placeholders included in codebase).

Files added
-----------
- `backend/src/integrations/indmoney/*` — module, controllers, services, types
- `backend/src/schemas/indmoney-connection.schema.ts`
- `backend/src/schemas/investment.schema.ts`

Security
--------
- Tokens are encrypted at rest using `ENCRYPTION_KEY` or `JWT_SECRET`.
- Tokens and credentials are never returned to the frontend by the endpoints.
