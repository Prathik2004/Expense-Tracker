#!/usr/bin/env ts-node
import 'source-map-support/register';
import { IndmoneyDiscoveryService } from '../integrations/indmoney/indmoney-discovery.service';

async function main() {
  const svc = new IndmoneyDiscoveryService();
  const url = process.argv[2] || process.env.INDMONEY_MCP_URL || 'https://mcp.indmoney.com/mcp';
  await svc.discover(url);
}

main().catch(err => {
  console.error('Discovery failed:', err);
  process.exit(1);
});
