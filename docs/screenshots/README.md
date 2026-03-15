# UI Screenshots

This directory contains screenshots of the **Lira Protocol** dashboards, showcasing the **Aura FX Neo Digital UI** — a high-contrast dark theme with neon glow effects and modern neo-digital typography.

## Expected Files

Upload your screenshots here with the following file names and recommended dimensions:

| File | Dashboard | Recommended Size |
|------|-----------|-----------------|
| `user-dashboard.png` | User Dashboard — Social Timeline & Smart Wallet (`/dashboard`) | 1440 × 900 px |
| `admin-dashboard.png` | Admin Dashboard — Billing, Fees & Contract Control (`/admin`) | 1440 × 900 px |
| `developer-dashboard.png` | Developer Dashboard — Token Launcher & Agent Executor (`/dev`) | 1440 × 900 px |

## How to Capture Screenshots

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) and connect your wallet.
3. Navigate to each dashboard route and capture a full-page screenshot.
4. Save the PNG files to this directory using the file names listed above.
5. Commit and push — the `README.md` gallery will automatically display the new images.

## Theme Notes

The **Aura FX Neo Digital UI** uses:
- **Background**: Deep charcoal / near-black (`#0a0a0f`)
- **Accent glows**: Neon cyan (`#00f5ff`), violet (`#a855f7`), and amber (`#f59e0b`)
- **Typography**: Geist Mono / Space Grotesk with high-contrast white headings
- **Animations**: Framer Motion fade-in and scale transitions

These design cues are consistent across all three dashboards and should be visible in your screenshots.

---

*See [`src/components/admin/`](../../src/components/admin/) for Admin dashboard components and [`src/pages/`](../../src/pages/) for all dashboard routes.*
