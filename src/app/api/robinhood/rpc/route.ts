import { NextResponse } from "next/server";
import { getRobinhoodRpcUrl } from "@/lib/robinhood/config";
import { checkRobinhoodRateLimit } from "@/lib/robinhood/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const READ_METHODS = new Set(["eth_chainId", "eth_blockNumber", "eth_gasPrice", "eth_getBlockByNumber"]);
export async function POST(request: Request) {
  const limit = checkRobinhoodRateLimit(request, "rpc-playground", 20);
  if (!limit.allowed) return NextResponse.json({ ok: false, error: "RPC playground rate limit reached. Wait and retry." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) return NextResponse.json({ ok: false, error: "Send a JSON object containing method and params." }, { status: 400 });
    const { method, params } = body as { method?: unknown; params?: unknown };
    if (typeof method !== "string" || !READ_METHODS.has(method)) return NextResponse.json({ ok: false, error: "Only read-only methods are allowed: eth_chainId, eth_blockNumber, eth_gasPrice, eth_getBlockByNumber." }, { status: 400 });
    const safeParams = params === undefined ? [] : params;
    if (!Array.isArray(safeParams) || safeParams.length > 2 || safeParams.some((item) => typeof item !== "string" && typeof item !== "boolean" && item !== null)) return NextResponse.json({ ok: false, error: "RPC params must be an array of up to two simple values." }, { status: 400 });
    if (method === "eth_getBlockByNumber" && (safeParams.length !== 2 || typeof safeParams[0] !== "string" || typeof safeParams[1] !== "boolean")) return NextResponse.json({ ok: false, error: "eth_getBlockByNumber expects [blockTag, includeTransactions]." }, { status: 400 });
    if (method !== "eth_getBlockByNumber" && safeParams.length !== 0) return NextResponse.json({ ok: false, error: `${method} does not accept parameters in this playground.` }, { status: 400 });
    const response = await fetch(getRobinhoodRpcUrl(), { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: safeParams }), cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return NextResponse.json({ ok: false, error: `Robinhood RPC returned HTTP ${response.status}. Check the server-side Alchemy configuration.` }, { status: 502 });
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return NextResponse.json({ ok: false, error: "RPC returned an unexpected response." }, { status: 502 });
    const result = payload as { result?: unknown; error?: { message?: string; code?: number } };
    if (result.error) return NextResponse.json({ ok: false, error: result.error.message ?? "RPC returned an error.", code: result.error.code }, { status: 502 });
    return NextResponse.json({ ok: true, method, result: result.result, fetchedAt: new Date().toISOString(), network: "Robinhood Chain Mainnet · 4663" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("not configured") ? error.message : error instanceof Error && error.name === "TimeoutError" ? "Robinhood RPC request timed out." : "Could not reach Robinhood Chain RPC. Check server-side configuration.";
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
