/**
 * Playwright screenshot generator for Lira Protocol.
 * Captures key app screens and saves them to /public/screenshots/.
 *
 * Usage:
 *   1. Start the app: npm start (or npm run dev)
 *   2. Run: npm run screenshot
 *
 * This script is also called as a postbuild step, but screenshots are only
 * captured when a server is already running on SCREENSHOT_BASE_URL
 * (default: http://localhost:3000). Failures are non-fatal so they don't
 * block deployment when a display/browser is unavailable.
 *
 * Requires: npx playwright install chromium (one-time setup)
 */

import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'screenshots');

const SCREENS = [
  { name: 'home', path: '/' },
  { name: 'optimizer', path: '/optimizer' },
  { name: 'history', path: '/history' },
  { name: 'wallet', path: '/wallet' },
];

async function run() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chromium: any;
  try {
    // Dynamic import so missing playwright doesn't crash at module load
    const playwright = await import('playwright');
    chromium = playwright.chromium;
  } catch {
    console.warn(
      '[screenshot] Playwright not installed — skipping screenshot generation.\n' +
        '  Run: npx playwright install chromium\n' +
        '  Then: ts-node scripts/screenshot.ts'
    );
    return;
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.warn('[screenshot] Could not launch browser:', (err as Error).message);
    return;
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
  });

  for (const screen of SCREENS) {
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}${screen.path}`, {
        waitUntil: 'networkidle',
        timeout: 15_000,
      });
      // Wait a moment for animations to settle
      await page.waitForTimeout(800);
      const outPath = path.join(OUTPUT_DIR, `${screen.name}.png`);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`[screenshot] Captured ${screen.name} → ${outPath}`);
    } catch (err) {
      console.warn(
        `[screenshot] Failed to capture ${screen.name}:`,
        (err as Error).message
      );
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('[screenshot] Done.');
}

run().catch((err) => {
  console.warn('[screenshot] Unexpected error:', err.message);
  // Non-fatal: exit 0 so postbuild doesn't block the build
  process.exit(0);
});
