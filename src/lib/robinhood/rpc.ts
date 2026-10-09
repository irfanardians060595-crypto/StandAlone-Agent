import { getRobinhoodRpcUrl, ROBINHOOD_CHAIN } from "./config";

type JsonRpcResponse<T> = {
  result?: T;
  error?: { code?: number; message?: string; data?: unknown };
};

type RobinhoodRpcErrorCode = "NOT_CONFIGURED" | "RPC_ERROR" | "RPC_TIMEOUT";

export class RobinhoodRpcError extends Error {
  readonly code: RobinhoodRpcErrorCode;

  constructor(
    message: string,
    code: RobinhoodRpcErrorCode = "RPC_ERROR",
  ) {
    super(message);
    this.name = "RobinhoodRpcError";
    this.code = code;
  }
}

export async function robinhoodRpc<T>(method: string, params: unknown[] = []): Promise<T> {
  let url: string;
  try {
    url = getRobinhoodRpcUrl();
  } catch (error) {
    throw new RobinhoodRpcError(
      error instanceof Error ? error.message : "Alchemy RPC is not configured.",
      "NOT_CONFIGURED",
    );
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    throw new RobinhoodRpcError(
      timeout ? "Robinhood Chain RPC timed out after 8 seconds." : "Could not reach the Robinhood Chain RPC provider.",
      timeout ? "RPC_TIMEOUT" : "RPC_ERROR",
    );
  }

  if (!response.ok) {
    throw new RobinhoodRpcError(`Alchemy RPC returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as JsonRpcResponse<T>;
  if (payload.error) {
    throw new RobinhoodRpcError(
      `Alchemy RPC ${payload.error.code ?? "error"}: ${payload.error.message ?? "Request failed."}`,
    );
  }
  if (payload.result === undefined) {
    throw new RobinhoodRpcError("Alchemy RPC response did not include a result.");
  }
  return payload.result;
}

function hexToDecimal(value: string): string {
  try {
    return BigInt(value).toString(10);
  } catch {
    return "0";
  }
}

function weiToGwei(value: string): string {
  try {
    const wei = BigInt(value);
    const divisor = BigInt("1000000000");
    const whole = wei / divisor;
    const fraction = ((wei % divisor) / BigInt("1000000")).toString().padStart(3, "0");
    return `${whole.toString()}.${fraction}`;
  } catch {
    return "Unavailable";
  }
}

export type ChainPulse = {
  chainName: string;
  expectedChainId: number;
  chainId: number | null;
  networkMatches: boolean;
  latestBlock: string;
  transactionsInLatestBlock: number | null;
  gasPriceGwei: string;
  latencyMs: number;
  rpcStatus: "connected" | "wrong-network";
  fetchedAt: string;
  source: string;
};

export async function getRobinhoodChainPulse(): Promise<ChainPulse> {
  const startedAt = Date.now();
  const [chainIdHex, latestBlockHex, gasPriceHex, txCountHex] = await Promise.all([
    robinhoodRpc<string>("eth_chainId"),
    robinhoodRpc<string>("eth_blockNumber"),
    robinhoodRpc<string>("eth_gasPrice"),
    robinhoodRpc<string>("eth_getBlockTransactionCountByNumber", ["latest"]),
  ]);

  const chainId = Number.parseInt(chainIdHex, 16);
  const networkMatches = chainId === ROBINHOOD_CHAIN.chainId;
  const txCount = Number.parseInt(hexToDecimal(txCountHex), 10);

  return {
    chainName: ROBINHOOD_CHAIN.name,
    expectedChainId: ROBINHOOD_CHAIN.chainId,
    chainId: Number.isFinite(chainId) ? chainId : null,
    networkMatches,
    latestBlock: hexToDecimal(latestBlockHex),
    transactionsInLatestBlock: Number.isFinite(txCount) ? txCount : null,
    gasPriceGwei: weiToGwei(gasPriceHex),
    latencyMs: Date.now() - startedAt,
    rpcStatus: networkMatches ? "connected" : "wrong-network",
    fetchedAt: new Date().toISOString(),
    source: "Alchemy Robinhood Chain RPC",
  };
}
