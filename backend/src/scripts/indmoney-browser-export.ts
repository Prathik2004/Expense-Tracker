#!/usr/bin/env ts-node
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { join } from 'path';

const startUrl = process.env.INDMONEY_WEB_URL || 'https://www.indmoney.com/';
const profileDir = process.env.INDMONEY_BROWSER_PROFILE || join(process.cwd(), '.indmoney-browser-profile');
const outputDir = process.env.INDMONEY_EXPORT_DIR || join(process.cwd(), 'tmp', 'indmoney');

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    viewport: { width: 1440, height: 1000 },
  });

  const page = browser.pages()[0] || await browser.newPage();
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });

  const keywords = ['portfolio', 'holdings', 'investments', 'stocks', 'mutual funds', 'current value', 'invested value'];
  const navigationTarget = page.locator('a,button,[role="button"]').filter({ hasText: /portfolio|holdings|investments|stocks/i }).first();
  if (await navigationTarget.isVisible().catch(() => false)) {
    await navigationTarget.click().catch(() => undefined);
  }
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
  await page.waitForFunction((terms) => {
    const text = document.body?.innerText?.toLowerCase() || '';
    return terms.some(term => text.includes(term));
  }, keywords, { timeout: 30000 }).catch(() => undefined);

  const prompt = createInterface({ input, output });
  console.log('INDmoney is open in Chromium.');
  console.log('Log in and complete OTP/2FA manually, then navigate to the portfolio holdings page.');
  await prompt.question('When the holdings are visible, press Enter here to export them: ');

  await page.evaluate(async () => {
    for (let index = 0; index < 8; index += 1) {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);

  const exportData = await page.evaluate(() => {
    const clean = (value: string | null | undefined) => (value || '').replace(/\\s+/g, ' ').trim();
    const tables = Array.from(document.querySelectorAll('table')).map((table) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((cell) => clean(cell.textContent));
      const rows = Array.from(table.querySelectorAll('tbody tr')).map((row) =>
        Array.from(row.querySelectorAll('th, td')).map((cell) => clean(cell.textContent)),
      );
      return { headers, rows };
    }).filter((table) => table.rows.length > 0);

    const rows = Array.from(document.querySelectorAll('[role="row"], tr, [data-testid*="holding"], [data-testid*="portfolio"], [class*="holding"], [class*="portfolio"]'))
      .map((element) => clean(element.textContent))
      .filter(Boolean)
      .slice(0, 500);

    const visibleText = clean(document.body?.innerText).slice(0, 100000);
    const holdings = [] as Array<{ externalId: string; name: string; assetType: string; currentValue: number; investedAmount: number; currency: string }>;
    const assetsSection = visibleText.split('MY ASSETS')[1]?.split('Fixed Income')[0] || '';
    const assetPattern = /(INDstocks|US Stocks|Mutual Funds|NPS|EPF|Bonds|PPF|ESOPs\/RSUs)\s+\u20b9([\d,.]+)([KLM])?/g;
    let match: RegExpExecArray | null;
    while ((match = assetPattern.exec(assetsSection)) !== null) {
      const multiplier = match[3] === 'L' ? 100000 : match[3] === 'M' ? 1000000 : match[3] === 'K' ? 1000 : 1;
      const value = Number(match[2].replace(/,/g, '')) * multiplier;
      if (Number.isFinite(value)) {
        holdings.push({ externalId: `indmoney-${match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name: match[1], assetType: match[1], currentValue: value, investedAmount: value, currency: 'INR' });
      }
    }
    const networthSection = visibleText.split('My Networth')[1] || '';
    const networthPattern = /(Silver|Gold|Liquid)\s+\u20b9([\d,.]+)([KLM])?/g;
    while ((match = networthPattern.exec(networthSection)) !== null) {
      const multiplier = match[3] === 'L' ? 100000 : match[3] === 'M' ? 1000000 : match[3] === 'K' ? 1000 : 1;
      const value = Number(match[2].replace(/,/g, '')) * multiplier;
      if (Number.isFinite(value)) {
        holdings.push({ externalId: `indmoney-${match[1].toLowerCase()}`, name: match[1] === 'Liquid' ? 'Liquid Fund' : match[1], assetType: match[1] === 'Liquid' ? 'Liquid Fund' : match[1], currentValue: value, investedAmount: value, currency: 'INR' });
      }
    }
    const indstocks = holdings.find((holding) => holding.externalId === 'indmoney-indstocks');
    const preciousMetalsValue = holdings
      .filter((holding) => holding.externalId === 'indmoney-gold' || holding.externalId === 'indmoney-silver')
      .reduce((sum, holding) => sum + (Number(holding.currentValue) || 0), 0);
    if (indstocks && preciousMetalsValue > 0) {
      indstocks.currentValue = Math.max(0, indstocks.currentValue - preciousMetalsValue);
      indstocks.investedAmount = Math.max(0, indstocks.investedAmount - preciousMetalsValue);
    }

    return {
      url: window.location.href,
      title: document.title,
      capturedAt: new Date().toISOString(),
      tables,
      rows,
      visibleText,
      holdings,
    };
  });

  const outputPath = join(outputDir, `holdings-${Date.now()}.json`);
  await writeFile(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
  await page.screenshot({ path: join(outputDir, `holdings-${Date.now()}.png`), fullPage: true });
  await prompt.close();
  await browser.close();

  console.log(`Export saved locally to: ${outputPath}`);
  console.log('No username, password, OTP, or browser cookies were sent to the expense tracker.');
}

main().catch((error) => {
  console.error('INDmoney browser export failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
