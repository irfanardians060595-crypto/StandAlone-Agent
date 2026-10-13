import { NextResponse } from "next/server";
import { exploreRobinhoodChain, ExplorerError, type ExplorerKind } from "@/lib/robinhood/explorer";
import { checkRobinhoodRateLimit } from "@/lib/robinhood/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_KINDS = new Set<ExplorerKind>(["token", "address", "transaction"]);

export async function GET(request: Request) {
  const limit = checkRobinhoodRateLimit(request, "explorer", 40);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many explorer requests. Wait a moment and retry." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  }
  const url = new URL(request.url);
  const rawKind = url.searchParams.get("kind");
  const identifier = url.searchParams.get("q") ?? "";

  if (!rawKind || !ALLOWED_KINDS.has(rawKind as ExplorerKind)) {
    return NextResponse.json({ ok: false, error: "Choose token, address, or transaction search." }, { status: 400 });
  }
  if (!identifier.trim()) {
    return NextResponse.json({ ok: false, error: "Enter a contract address, wallet address, or transaction hash." }, { status: 400 });
  }
  if (identifier.length > 130) {
    return NextResponse.json({ ok: false, error: "Search input is too long." }, { status: 400 });
  }

  try {
    const result = await exploreRobinhoodChain(rawKind as ExplorerKind, identifier);
    // Keep the browser payload focused on normalized fields; provider payloads can be verbose.
    const publicResult = {
      kind: result.kind,
      identifier: result.identifier,
      explorerUrl: result.explorerUrl,
      fetchedAt: result.fetchedAt,
      source: result.source,
      summary: result.summary,
      recentTransactions: result.recentTransactions ?? [],
      tokenBalances: result.tokenBalances ?? [],
      recentTokenTransfers: result.recentTokenTransfers ?? [],
    };
    return NextResponse.json({ ok: true, data: publicResult }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Explorer query failed.";
    const status = error instanceof ExplorerError ? error.status : 502;
    return NextResponse.json({ ok: false, error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
