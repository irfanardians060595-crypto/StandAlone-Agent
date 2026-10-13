# StandAlone Agent — Revision Notes

This package is based on the latest user-provided `StandAlone-Agent-backup2.zip`. The original Chat AI routes, provider configuration, streaming, attachment/history code, landing page structure, and visual identity were kept in place.

## Included changes

- Replaced the landing-page `Robinhood Chain` text link with a light `Explore Robinhood` CTA next to `Open workspace`. `Your own workspace` remains as informational status text.
- Combined token listing/scanning into the existing Token, Wallet & Transaction Explorer panel; removed the duplicate standalone Token Scanner panel.
- Added a transaction decoder/debugger panel for transaction searches: method, selector, calldata byte count, raw calldata, basic interpretations for common ERC-20 selectors (`transfer`, `approve`, `transferFrom`, `balanceOf`, `allowance`), and an AI-workspace explanation prompt. Unknown selectors are explicitly marked as not decoded.
- Kept the evidence-based contract triage and read-only RPC Developer Toolkit. Risk score is heuristic and must not be interpreted as an audit or safety guarantee. AI explanation is routed through the existing Chat workspace.
- Improved Blockscout configuration errors. The indexed explorer API requires a valid server-side `BLOCKSCOUT_PRO_API_KEY`; the source code cannot bypass a provider-side HTTP 403 or supply a missing/invalid key.
- Kept Robinhood Chain operations read-only; no wallet signing or transaction submission is added.

## Required environment

- `ALCHEMY_ROBINHOOD_API_KEY`: Robinhood Chain Mainnet Alchemy API key for live Chain Pulse/RPC.
- `BLOCKSCOUT_PRO_API_KEY`: Blockscout PRO key for indexed explorer, scanner, and risk data.
- `OPENAI_API_KEY` and/or the AI provider key already used by your setup for AI chat.

Use `.env.example` as a template only. Do not replace your existing `.env.local`; keep real keys in server-side environment settings and never share them.

## Verification status

- TypeScript/TSX syntax transpilation passed for the changed TS/TSX files.
- `git diff --check` passed.
- Full Next.js build and live provider tests were **not completed** because dependency installation timed out in this environment and no live API credentials were tested.
- The package has not been deployed.

Wallet relationship graph and persistent multi-wallet alerting remain deferred until indexed data quality and access are verified, as agreed.
