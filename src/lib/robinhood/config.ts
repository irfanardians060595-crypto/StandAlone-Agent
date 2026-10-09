export const ROBINHOOD_CHAIN = {
  name: "Robinhood Chain Mainnet",
  chainId: 4663,
  chainIdHex: "0x1237",
  currencySymbol: "ETH",
  rpcUrl: "https://robinhood-mainnet.g.alchemy.com/v2",
  explorerUrl: "https://robinhoodchain.blockscout.com",
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
