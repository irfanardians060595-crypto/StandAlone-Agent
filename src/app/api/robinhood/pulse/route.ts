import { NextResponse } from "next/server";
import { getRobinhoodChainPulse, RobinhoodRpcError } from "@/lib/robinhood/rpc";
import { checkRobinhoodRateLimit } from "@/lib/robinhood/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const limit = checkRobinhoodRateLimit(request, "pulse", 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many Chain Pulse requests. Wait a moment and retry." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  }
  try {
    const pulse = await getRobinhoodChainPulse();
    return NextResponse.json({ ok: true, data: pulse }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read Robinhood Chain status.";
    const code = error instanceof RobinhoodRpcError ? error.code : "RPC_ERROR";
    const status = code === "NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json(
      { ok: false, error: message, code, setupRequired: code === "NOT_CONFIGURED" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
