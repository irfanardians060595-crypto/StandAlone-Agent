export const ROBINHOOD_CHAIN = {
  name: "Robinhood Chain Mainnet",
  chainId: 4663,
  chainIdHex: "0x1237",
  currencySymbol: "ETH",
  rpcUrl: "https://robinhood-mainnet.g.alchemy.com/v2",
  explorerUrl: "https://robinhoodchain.blockscout.com",
  proApiBaseUrl: "https://api.blockscout.com/4663/api/v2",
} as const;

/** Server-only: never import this helper into a Client Component. */
export function getRobinhoodRpcUrl(): string {
  const apiKey =
    process.env.ALCHEMY_ROBINHOOD_API_KEY || process.env.ALCHEMY_API_KEY;

  if (!apiKey?.trim()) {
    throw new Error(
      "Robinhood Chain RPC is not configured. Add ALCHEMY_ROBINHOOD_API_KEY to .env.local and restart the dev server.",
    );
  }

  return `${ROBINHOOD_CHAIN.rpcUrl}/${apiKey.trim()}`;
}

/** Build a server-side Blockscout API URL. Prefer the authenticated PRO gateway when configured. */
export function getBlockscoutApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const key = process.env.BLOCKSCOUT_PRO_API_KEY?.trim();
  if (key) return `${ROBINHOOD_CHAIN.proApiBaseUrl}${cleanPath}`;
  return `${ROBINHOOD_CHAIN.explorerUrl}/api/v2${cleanPath}`;
}

export function getBlockscoutHeaders(): HeadersInit {
  const key = process.env.BLOCKSCOUT_PRO_API_KEY?.trim();
  return key ? { accept: "application/json", authorization: `Bearer ${key}` } : { accept: "application/json" };
}
