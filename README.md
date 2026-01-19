LIRA Protocol — Solana‑Enabled, Zora‑Inspired Minting Layer

Lightweight • Immutable • Resilient • Autonomous

🚀 PR‑Build Trigger: #lira-protocol #pr1 #build-ready

---

Overview

LIRA is a chain‑agnostic minting and auction protocol designed for high‑volume creators, collectors, and applications.
It provides a Zora‑style experience with Solana‑optimized performance, optional compressed NFTs, and a modular security layer to protect against frontrunners, sappers, and malicious liquidity traps.

This repository contains:

• LIRA Core Protocol (Solana + EVM adapters)
• Admin Dashboard (collection creation, mint configuration, analytics)
• User Dashboard (minting, bidding, claiming)
• SDK for app integrations
• Security Middleware (anti‑frontrun, anti‑honeypot, anti‑sapper logic)


---

✨ Key Features

🔗 Multi‑Chain Protocol Layer

• Unified interface for Solana Mainnet, Solana Testnet, and EVM chains
• Adapter‑based architecture:• LiraSolanaAdapter
• LiraEvmAdapter

• Shared types: LiraCollection, LiraMint, LiraAuction, LiraBid


⚡ Solana‑Optimized Minting

• SPL NFT + optional Bubblegum compressed NFTs
• PDA‑based collection + mint accounts
• Ultra‑low‑latency minting for high‑volume drops
• Optional open edition and time‑windowed mints


🛡️ Advanced Security Layer

LIRA includes a modular security framework to protect creators and users:

1. Anti‑Frontrunning Guard

• Transaction randomization
• Delayed‑reveal mint windows
• Off‑chain signature gating
• Optional commit‑reveal minting


2. Anti‑Sapper Protection

• Rate‑limit per wallet
• Dynamic mint throttling
• Automated suspicious‑pattern detection
• Optional proof‑of‑wallet‑age or stake‑based access


3. Honeypot‑Resistance

• Transparent mint rules
• Immutable metadata commitments
• Publicly verifiable mint receipts
• No hidden transfer hooks or forced approvals


4. Admin‑Side Safety

• Role‑based access control
• Multi‑sig optional
• Safe‑mode for contract upgrades
• Audit‑friendly logs + event streams


🧩 Zora‑Inspired Logic

• Creator share enforcement
• Primary sale + optional secondary royalty routing
• Edition‑style mints
• Mint windows, supply caps, per‑wallet limits


🧱 Optional Bubblegum Integration

• Enable via config:enableCompressedMints: true

• Ideal for social mints, high‑volume collectibles, and low‑cost distribution.


✨ Blink‑Ready API (Optional)

LIRA exposes clean endpoints that can later be wrapped into Solana Blinks:

• POST /api/lira/mint
• POST /api/lira/bid
• POST /api/lira/claim


Blinks are not required for v1 but fully supported by design.

---

📁 Repository Structure

/protocol
  /solana
  /evm
  /types
  /security
/apps
  /admin-dashboard
  /user-dashboard
/sdk
  /js
  /react


---

🛠️ Installation

pnpm install
pnpm dev


---

⚙️ Configuration

Environment Variables

SOLANA_MAINNET_RPC=
SOLANA_TESTNET_RPC=
LIRA_SOLANA_PROGRAM_ID=
NEXT_PUBLIC_CHAIN_DEFAULT=solana


---

🧪 Testing

pnpm test
pnpm test:solana
pnpm test:evm


---

🧭 Roadmap (PR1 → Launch)

PR1 (This PR)

• Solana adapter
• Protocol interface unification
• Admin dashboard chain selector
• User dashboard Solana mint flow
• Security middleware (v1)
• Documentation (this README)


PR2

• Bubblegum compressed mints
• Blink action wrappers
• Auction module (Solana)
• Analytics dashboard


PR3

• Multi‑sig admin
• Creator payout automation
• Full audit + hardening


---

🧑‍💻 Developer Benefits

• One protocol, all chains
• Drop‑in SDK for any frontend
• Battle‑tested security against frontrunners + sappers
• Zora‑style UX with Solana‑level performance
• Admin dashboard for creators
• User dashboard for collectors
• Blink‑ready API for future integrations


---

📜 License

MIT — open for builders, creators, and ecosystem partners.

---

🏁 Final Notes

This README is structured to be PR‑ready, auditor‑friendly, and developer‑oriented.
It includes build triggers, security explanations, and clear architecture so PR reviewers understand the full scope of LIRA’s Solana integration. also generate:

• /docs/architecture.md
• /docs/security.md
• /docs/solana-adapter.md
• /docs/admin-dashboard.md
• /docs/api.md
