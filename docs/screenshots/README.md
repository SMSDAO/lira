# UI Screenshots

This directory contains SVG screenshots of the **Lira Protocol** UI, showcasing the **Aura FX Neo Digital UI** — a high-contrast dark theme with neon cyan, violet, and amber glow effects.

## Files

| File | View | Dimensions |
|------|------|-----------|
| `landing-page.svg` | Landing page — hero, features section | 1440 × 900 |
| `user-dashboard.svg` | User Dashboard — profile, wallets, social timeline | 1440 × 900 |
| `admin-dashboard.svg` | Admin Dashboard — billing, fees, contracts, user table | 1440 × 900 |
| `developer-portal.svg` | Developer Portal — API reference, sandbox, request logs | 1440 × 900 |
| `token-launch-flow.svg` | Token Launch — form, launch summary, recent launches | 1440 × 900 |
| `wallet-connect-modal.svg` | Wallet Connection Modal — RainbowKit wallet picker | 1440 × 900 |
| `mobile-responsive.svg` | Mobile Responsive View — 390 px wide | 390 × 844 |
| `agent-executor.svg` | AI Agents — agent cards, Quantum Oracle chart, logs | 1440 × 900 |

## Replacing With Live Screenshots

To replace the SVG mock-ups with real screenshots:

1. Start the development server:
   ```bash
   cp .env.example .env.local   # add your NEXT_PUBLIC_WALLET_CONNECT_ID
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) and connect your wallet.
3. Navigate to each route and capture a full-page screenshot (1440 × 900 px recommended).
4. Save as `.png` or `.svg` using the same base file names listed above.
5. Commit and push — the `README.md` gallery updates automatically.

## Theme Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `neo-blue` | `#00d4ff` | User dashboard accent, primary CTA |
| `neo-purple` | `#a855f7` | Admin dashboard accent |
| `neo-amber` | `#f59e0b` | Developer portal accent |
| `neo-green` | `#10b981` | Success states, system health |
| `neo-darker` | `#0a0a0f` | Page background |
| `neo-dark` | `#0a0e1a` | Card / sidebar background |

---

*Components: [`src/components/`](../../src/components/) · Pages: [`src/pages/`](../../src/pages/)*
