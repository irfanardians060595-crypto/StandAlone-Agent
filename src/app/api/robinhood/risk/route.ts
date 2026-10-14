import { NextResponse } from "next/server";
import { getBlockscoutApiUrl, getBlockscoutHeaders } from "@/lib/robinhood/config";
import { checkRobinhoodRateLimit } from "@/lib/robinhood/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Dict = Record<string, unknown>;
const isRecord = (value: unknown): value is Dict => typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown): string | null => typeof value === "string" ? value : typeof value === "number" ? String(value) : null;

export async function GET(request: Request) {
  const limit = checkRobinhoodRateLimit(request, "risk", 12);
  if (!limit.allowed) return NextResponse.json({ ok: false, error: "Too many risk-analysis requests. Wait a moment and retry." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
  const address = new URL(request.url).searchParams.get("address")?.trim() ?? "";
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return NextResponse.json({ ok: false, error: "Enter a valid EVM contract address." }, { status: 400 });

  try {
    const [tokenResponse, contractResponse] = await Promise.all([
      fetch(getBlockscoutApiUrl(`/tokens/${address}`), { headers: getBlockscoutHeaders(), cache: "no-store", signal: AbortSignal.timeout(8000) }),
      fetch(getBlockscoutApiUrl(`/smart-contracts/${address}`), { headers: getBlockscoutHeaders(), cache: "no-store", signal: AbortSignal.timeout(8000) }).catch(() => null),
    ]);
    if (tokenResponse.status === 401 || tokenResponse.status === 403) return NextResponse.json({ ok: false, error: "Blockscout menolak akses. Periksa BLOCKSCOUT_PRO_API_KEY di environment server." }, { status: 502 });
    if (!tokenResponse.ok && tokenResponse.status !== 404) return NextResponse.json({ ok: false, error: `Token data source returned HTTP ${tokenResponse.status}.` }, { status: 502 });
    let tokenData: Dict = {};
    if (tokenResponse.ok) {
      const parsed: unknown = await tokenResponse.json().catch(() => null);
      tokenData = isRecord(parsed) ? parsed : {};
    }
    let contractData: Dict = {};
    if (contractResponse?.ok) {
      const parsed: unknown = await contractResponse.json().catch(() => null);
      if (isRecord(parsed)) contractData = parsed;
    }
    const abiValue = contractData.abi;
    let abi: unknown[] = [];
    if (Array.isArray(abiValue)) abi = abiValue;
    else if (typeof abiValue === "string") { try { const parsed: unknown = JSON.parse(abiValue); if (Array.isArray(parsed)) abi = parsed; } catch { /* ABI may be unavailable or malformed */ } }
    const functions = abi.filter((item): item is Dict => isRecord(item) && item.type === "function").map((item) => str(item.name)).filter((name): name is string => Boolean(name));
    const privilegedPatterns = [
      { pattern: /(^|_)mint($|_)/i, label: "Mint-related function detected", points: 18 },
      { pattern: /blacklist|blocklist|denylist/i, label: "Address restriction function detected", points: 12 },
      { pattern: /pause|unpause/i, label: "Pause control detected", points: 8 },
      { pattern: /set(owner|tax|fee|router|implementation)|upgradeTo|upgradeToAndCall/i, label: "Administrative or upgrade function detected", points: 12 },
      { pattern: /renounceOwnership/i, label: "Ownership renunciation function detected (not proof ownership was renounced)", points: 0 },
    ];
    const verified = contractData.is_verified === true || tokenData.is_verified === true || Boolean(contractData.source_code) || Boolean(contractData.abi);
    const findings: Array<{ severity: "info" | "warning"; title: string; detail: string }> = [];
    let score = 0;
    if (!verified) { score += 25; findings.push({ severity: "warning", title: "Source code not verified in this explorer response", detail: "Bytecode behavior cannot be fully assessed from the available indexed data." }); }
    else findings.push({ severity: "info", title: "Verified source/ABI appears available", detail: "Verification helps inspection but does not establish that the contract is safe." });
    for (const item of privilegedPatterns) {
      const matches = functions.filter((name) => item.pattern.test(name));
      if (matches.length) {
        score += item.points;
        findings.push({ severity: item.points > 0 ? "warning" : "info", title: item.label, detail: `ABI function names: ${matches.slice(0, 8).join(", ")}. Function presence alone does not prove malicious behavior.` });
      }
    }
    if (!functions.length) findings.push({ severity: "info", title: "Function-level inspection unavailable", detail: "No usable verified ABI was returned; this is an evidence gap, not a safety verdict." });
    const holderCount = str(tokenData.holders) ?? str(tokenData.holders_count);
    const scoreClamped = Math.min(100, score);
    const label = scoreClamped >= 50 ? "Elevated indicators" : scoreClamped >= 25 ? "Needs review" : "Limited indicators detected";
    return NextResponse.json({ ok: true, data: { address, token: { name: str(tokenData.name), symbol: str(tokenData.symbol), holders: holderCount, verified: verified || null }, contract: { verified, compilerVersion: str(contractData.compiler_version), language: str(contractData.language), proxy: contractData.is_proxy === true ? true : contractData.is_proxy === false ? false : null }, score: scoreClamped, label, findings, functions: functions.slice(0, 80), fetchedAt: new Date().toISOString(), source: "Robinhood Chain Blockscout indexed data", disclaimer: "Heuristic triage only; not a security audit or guarantee. Missing indexed data is not treated as proof of safety." } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "Risk analysis timed out while requesting indexed contract data." : error instanceof Error && error.message.includes("BLOCKSCOUT_PRO_API_KEY") ? error.message : "Could not retrieve enough indexed data to analyze this contract. Check Blockscout API access and retry.";
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
