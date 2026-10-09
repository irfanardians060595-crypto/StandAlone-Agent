# StandAlone Agent — Robinhood Chain integration

This document describes the read-only Robinhood Chain layer added on top of the original Agent Starter. The existing chat API, model routing, streaming, chat persistence, and original tools remain in place.

## Features

- **Chain Pulse** — reads mainnet chain ID, latest block, transaction count in the latest block, gas price, and RPC latency from Alchemy.
- **Token & Transaction Explorer** — fetches indexed public token, address, and transaction data from the Robinhood Chain Blockscout API.
- **AI Research Agent tools** — registers `getRobinhoodChainPulse` and `exploreRobinhoodChain` with the existing Agent Starter tool registry. These tools are read-only.

## Environment configuration

Add both keys to `.env.local` and restart the dev server:

```env
ALCHEMY_ROBINHOOD_API_KEY=your_alchemy_robinhood_mainnet_key
BLOCKSCOUT_PRO_API_KEY=proapi_your_free_blockscout_key
```

Create an Alchemy app with Robinhood Chain Mainnet enabled and copy the endpoint from its Endpoints tab. Expected RPC pattern: `https://robinhood-mainnet.g.alchemy.com/v2/{API_KEY}`. The app also accepts `ALCHEMY_API_KEY` as a fallback.

Create a free Blockscout API key at https://dev.blockscout.com. Current Blockscout PRO API access requires a key even on the free tier. The server calls `https://api.blockscout.com/4663/api/v2/...` and sends the key in an Authorization header. Neither key is exposed to browser code; never prefix either variable with `NEXT_PUBLIC_`. API routes apply a best-effort per-process request limit; production should also use deployment-level rate limiting because serverless instances do not share process memory.

## Network verification

- Network: Robinhood Chain Mainnet
- Chain ID: `4663` (`0x1237`)
- Native currency: ETH
- Alchemy RPC endpoint pattern: `https://robinhood-mainnet.g.alchemy.com/v2/{API_KEY}`
- Explorer UI: `https://robinhoodchain.blockscout.com/`
- Blockscout PRO API: `https://api.blockscout.com/4663/api/v2` (requires a free API key)

The Chain Pulse reports a wrong-network warning if the RPC response chain ID differs from `4663`.

## App routes

- `/` — existing StandAlone Agent landing page, with a live Chain Pulse preview and link to the onchain tools.
- `/chain` — Chain Pulse and Token & Transaction Explorer workspace.
- `/api/robinhood/pulse` — server-side read-only JSON-RPC status endpoint.
- `/api/robinhood/explorer?kind=token|address|transaction&q=...` — validated Blockscout lookup endpoint.

## Safety and limitations

- No wallet connection, private-key access, transaction signing, or transaction submission is implemented.
- Explorer input is validated and remote URLs are fixed to Blockscout; user input never becomes an arbitrary fetch URL.
- API keys remain server-side and are not returned in responses.
- Chain Pulse values are fetched from Alchemy. Explorer results are indexed data from Blockscout and may lag behind the chain.
- Token price, market cap, liquidity, trading volume, and security audit scores are intentionally excluded until a dedicated, trusted market-data provider is selected.
- The public explorer may rate-limit traffic. For larger usage, review Blockscout API key options and add app-level rate limiting/caching at the deployment edge.

## Official references

- Robinhood Chain network connection details: https://docs.robinhood.com/chain/connecting/
- Alchemy Robinhood Chain API overview: https://www.alchemy.com/docs/robinhood-chain/robinhood-chain-api-overview
- Alchemy Robinhood Chain API quickstart: https://www.alchemy.com/docs/reference/robinhood-chain-api-quickstart
- Blockscout API docs: https://docs.blockscout.com/api-reference/addresses
