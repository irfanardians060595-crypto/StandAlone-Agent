import { NextResponse } from "next/server";
import { getBlockscoutApiUrl, getBlockscoutHeaders } from "@/lib/robinhood/config";
import { checkRobinhoodRateLimit } from "@/lib/robinhood/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RecordValue = Record<string, unknown>;
function record(value: unknown): value is RecordValue { return typeof value === "object" && value !== null && !Array.isArray(value); }
function str(value: unknown): string | null { return typeof value === "string" || typeof value === "number" ? String(value) : null; }

export async function GET(request: Request) {
  const limit = checkRobinhoodRateLimit(request, "scanner", 20);
  if (!limit.allowed) return NextResponse.json({ ok: false, error: "Scanner rate limit reached. Wait a moment and retry." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
  const url = new URL(request.url);
  const sortValue = url.searchParams.get("sort") ?? "holders_count";
  const sort = ["holders_count", "fiat_value", "circulating_market_cap"].includes(sortValue) ? sortValue : "holders_count";
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const api = new URL(getBlockscoutApiUrl("/tokens"));
  api.searchParams.set("type", "ERC-20");
  api.searchParams.set("sort", sort);
  api.searchParams.set("order", "desc");
  api.searchParams.set("items_count", "20");
  if (q) api.searchParams.set("q", q);
  try {
    const response = await fetch(api, { headers: getBlockscoutHeaders(), cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      const message = response.status === 401 || response.status === 403
        ? "Blockscout menolak akses API. Pastikan BLOCKSCOUT_PRO_API_KEY valid dan sudah diatur di environment server Vercel."
        : `Blockscout token scanner returned HTTP ${response.status}.`;
      return NextResponse.json({ ok: false, error: message }, { status, headers: { "Cache-Control": "no-store" } });
    }
    const body: unknown = await response.json();
    if (!record(body) || !Array.isArray(body.items)) return NextResponse.json({ ok: false, error: "Blockscout returned an unexpected token list." }, { status: 502 });
    const items = body.items.filter(record).map((item) => ({
      address: str(item.address) ?? str(item.address_hash) ?? str(item.contract_address_hash),
      name: str(item.name) ?? "Unknown token",
      symbol: str(item.symbol),
      decimals: str(item.decimals),
      holders: str(item.holders) ?? str(item.holders_count),
      marketCap: str(item.circulating_market_cap) ?? str(item.market_cap),
      fiatValue: str(item.exchange_rate) ?? str(item.fiat_value),
      totalSupply: str(item.total_supply),
      type: str(item.type) ?? "ERC-20",
      verified: typeof item.is_verified === "boolean" ? item.is_verified : null,
      explorerUrl: (str(item.address) ?? str(item.address_hash) ?? str(item.contract_address_hash)) ? `https://robinhoodchain.blockscout.com/token/${str(item.address) ?? str(item.address_hash) ?? str(item.contract_address_hash)}` : "https://robinhoodchain.blockscout.com/",
    })).filter((item) => item.address);
    return NextResponse.json({ ok: true, data: { items, count: items.length, fetchedAt: new Date().toISOString(), source: process.env.BLOCKSCOUT_PRO_API_KEY ? "Blockscout PRO API · Robinhood Chain" : "Robinhood Chain Blockscout API" } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "Blockscout request timed out. Retry in a moment." : error instanceof Error && error.message.includes("BLOCKSCOUT_PRO_API_KEY") ? error.message : "Unable to reach the Blockscout token index. Check API configuration and try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
