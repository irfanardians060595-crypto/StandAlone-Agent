import { getBlockscoutApiUrl, getBlockscoutHeaders, ROBINHOOD_CHAIN } from "./config";

export type ExplorerKind = "token" | "address" | "transaction";
type JsonRecord = Record<string, unknown>;

export class ExplorerError extends Error {
  readonly status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "ExplorerError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  return null;
}

function getString(record: JsonRecord, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = stringValue(record[key]);
    if (value) return value;
  }
  return null;
}

function nestedAddress(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (isRecord(value)) return getString(value, "hash", "address_hash", "ens_domain_name");
  return null;
}

async function fetchExplorer(path: string): Promise<unknown> {
  const requestOptions = {
    headers: getBlockscoutHeaders(),
    // Next.js supports a short upstream cache for public indexed data.
    next: { revalidate: 15 },
    signal: AbortSignal.timeout(8_000),
  } as RequestInit & { next: { revalidate: number } };
  const response = await fetch(getBlockscoutApiUrl(path), requestOptions);
  if (response.status === 404) throw new ExplorerError("No matching record was found on the Robinhood Chain explorer.", 404);
  if (response.status === 429) throw new ExplorerError("The explorer is rate-limiting requests. Wait briefly and retry.", 429);
  if (!response.ok) throw new ExplorerError(`The explorer returned HTTP ${response.status}.`);
  return response.json();
}

function formatUnits(value: string | null, decimals: number): string | null {
  if (!value || !/^\d+$/.test(value) || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) return null;
  try {
    const amount = BigInt(value);
    const unit = BigInt(10) ** BigInt(decimals);
    const whole = amount / unit;
    if (decimals === 0) return whole.toString();
    const fraction = (amount % unit).toString().padStart(decimals, "0").replace(/0+$/, "").slice(0, 8);
    return fraction ? `${whole.toString()}.${fraction}` : whole.toString();
  } catch {
    return null;
  }
}

function weiToEth(value: string | null): string | null {
  return formatUnits(value, 18);
}

function checkedAddress(value: string): string {
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    throw new ExplorerError("Enter a valid EVM address (0x followed by 40 hexadecimal characters).", 400);
  }
  return trimmed;
}

function checkedHash(value: string): string {
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    throw new ExplorerError("Enter a valid transaction hash (0x followed by 64 hexadecimal characters).", 400);
  }
  return trimmed;
}

export type ExplorerResult = {
  kind: ExplorerKind;
  identifier: string;
  explorerUrl: string;
  fetchedAt: string;
  source: string;
  summary: Record<string, string | number | boolean | null>;
  recentTransactions?: Array<Record<string, string | null>>;
  tokenBalances?: Array<Record<string, string | null>>;
  recentTokenTransfers?: Array<Record<string, string | null>>;
  raw: unknown;
};

export async function exploreRobinhoodChain(kind: ExplorerKind, identifier: string): Promise<ExplorerResult> {
  if (typeof identifier !== "string" || identifier.length > 130) {
    throw new ExplorerError("Search input is too long.", 400);
  }

  const base = ROBINHOOD_CHAIN.explorerUrl;
  const fetchedAt = new Date().toISOString();

  if (kind === "transaction") {
    const hash = checkedHash(identifier);
    const raw = await fetchExplorer(`/transactions/${hash}`);
    if (!isRecord(raw)) throw new ExplorerError("Explorer returned an unexpected transaction response.");
    const from = nestedAddress(raw.from);
    const to = nestedAddress(raw.to);
    const block = isRecord(raw.block) ? raw.block : null;
    const summary = {
      hash: getString(raw, "hash", "transaction_hash") ?? hash,
      status: getString(raw, "status", "result") ?? (typeof raw.status === "boolean" ? String(raw.status) : null),
      block: getString(raw, "block_number") ?? (block ? getString(block, "height", "number") : null),
      timestamp: getString(raw, "timestamp", "timestamp_iso_8601"),
      from,
      to,
      valueEth: weiToEth(getString(raw, "value")),
      feeWei: getString(raw, "fee"),
      gasLimit: getString(raw, "gas_limit"),
      gasUsed: getString(raw, "gas_used"),
      gasPriceWei: getString(raw, "gas_price"),
      transactionType: getString(raw, "type"),
      method: getString(raw, "method", "decoded_input", "function_name"),
      revertReason: getString(raw, "revert_reason", "error"),
    };
    return { kind, identifier: hash, explorerUrl: `${base}/tx/${hash}`, fetchedAt, source: process.env.BLOCKSCOUT_PRO_API_KEY ? "Blockscout PRO API · Robinhood Chain" : "Robinhood Chain Blockscout API", summary, raw };
  }

  const address = checkedAddress(identifier);
  if (kind === "token") {
    const raw = await fetchExplorer(`/tokens/${address}`);
    if (!isRecord(raw)) throw new ExplorerError("Explorer returned an unexpected token response.");
    const summary = {
      address: getString(raw, "address", "address_hash") ?? address,
      name: getString(raw, "name") ?? "Unknown token",
      symbol: getString(raw, "symbol"),
      decimals: getString(raw, "decimals"),
      totalSupply: formatUnits(
        getString(raw, "total_supply", "totalSupply"),
        Number.parseInt(getString(raw, "decimals") ?? "-1", 10),
      ),
      holders: getString(raw, "holders", "holders_count"),
      exchangeRate: getString(raw, "exchange_rate"),
      type: getString(raw, "type"),
      verified: typeof raw.is_verified === "boolean" ? raw.is_verified : null,
    };
    return { kind, identifier: address, explorerUrl: `${base}/token/${address}`, fetchedAt, source: process.env.BLOCKSCOUT_PRO_API_KEY ? "Blockscout PRO API · Robinhood Chain" : "Robinhood Chain Blockscout API", summary, raw };
  }

  const [addressRaw, transactionsRaw, tokenBalancesRaw, tokenTransfersRaw] = await Promise.all([
    fetchExplorer(`/addresses/${address}`),
    fetchExplorer(`/addresses/${address}/transactions?items_count=8`).catch(() => null),
    fetchExplorer(`/addresses/${address}/token-balances`).catch(() => null),
    fetchExplorer(`/addresses/${address}/token-transfers?type=ERC-20&items_count=8`).catch(() => null),
  ]);
  if (!isRecord(addressRaw)) throw new ExplorerError("Explorer returned an unexpected address response.");

  const txItems = isRecord(transactionsRaw) && Array.isArray(transactionsRaw.items)
    ? transactionsRaw.items
    : Array.isArray(transactionsRaw) ? transactionsRaw : [];
  const recentTransactions = txItems.slice(0, 8).filter(isRecord).map((tx) => ({
    hash: getString(tx, "hash", "transaction_hash"),
    timestamp: getString(tx, "timestamp", "timestamp_iso_8601"),
    status: getString(tx, "status", "result"),
    from: nestedAddress(tx.from),
    to: nestedAddress(tx.to),
    valueEth: weiToEth(getString(tx, "value")),
    block: getString(tx, "block_number"),
  }));
  const tokenBalances = Array.isArray(tokenBalancesRaw) ? tokenBalancesRaw.slice(0, 20).filter(isRecord).map((item) => {
    const token = isRecord(item.token) ? item.token : {};
    return {
      token: getString(token, "name", "symbol") ?? "Unknown token",
      symbol: getString(token, "symbol"),
      contract: getString(token, "address", "address_hash"),
      balance: getString(item, "value", "balance"),
      decimals: getString(token, "decimals"),
    };
  }) : [];
  const transferItems = isRecord(tokenTransfersRaw) && Array.isArray(tokenTransfersRaw.items) ? tokenTransfersRaw.items : [];
  const recentTokenTransfers = transferItems.slice(0, 8).filter(isRecord).map((item) => {
    const token = isRecord(item.token) ? item.token : {};
    return {
      hash: getString(item, "transaction_hash", "tx_hash"),
      timestamp: getString(item, "timestamp"),
      from: nestedAddress(item.from),
      to: nestedAddress(item.to),
      amount: getString(item, "total", "amount", "value"),
      token: getString(token, "symbol", "name") ?? "Token",
    };
  });
  const summary = {
    address: getString(addressRaw, "hash", "address_hash") ?? address,
    name: getString(addressRaw, "name") ?? "Unnamed address",
    isContract: typeof addressRaw.is_contract === "boolean" ? addressRaw.is_contract : null,
    balanceEth: weiToEth(getString(addressRaw, "coin_balance")),
    transactionCount: getString(addressRaw, "transactions_count"),
    tokenName: getString(addressRaw, "token_name"),
    tokenSymbol: getString(addressRaw, "token_symbol"),
  };
  return {
    kind, identifier: address, explorerUrl: `${base}/address/${address}`, fetchedAt,
    source: process.env.BLOCKSCOUT_PRO_API_KEY ? "Blockscout PRO API · Robinhood Chain" : "Robinhood Chain Blockscout API", summary, recentTransactions, tokenBalances, recentTokenTransfers, raw: { address: addressRaw, transactions: transactionsRaw, tokenBalances: tokenBalancesRaw, tokenTransfers: tokenTransfersRaw },
  };
}
