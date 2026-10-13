"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Blocks, CircleAlert, Clock3, Database, ExternalLink, FileSearch, Globe2, RefreshCw, Search, ShieldCheck, Sparkles, ScanSearch, Wallet, Coins, Code2, Terminal, ShieldAlert } from "lucide-react";
import { AnimatedDotField } from "@/components/ui/animated-dot-field";
import { ChainPulseMini } from "@/components/robinhood/ChainPulseMini";
import { StandAloneLogo } from "@/components/brand/StandAloneLogo";
import { BrandHeaderLinks } from "@/components/brand/BrandHeaderLinks";

type ExplorerKind = "token" | "address" | "transaction";
type ExplorerResult = {
  kind: ExplorerKind;
  identifier: string;
  explorerUrl: string;
  fetchedAt: string;
  source: string;
  summary: Record<string, string | number | boolean | null>;
  recentTransactions?: Array<Record<string, string | null>>;
  tokenBalances?: Array<Record<string, string | null>>;
  recentTokenTransfers?: Array<Record<string, string | null>>;
};
type ScannedToken = { address: string; name: string; symbol: string | null; decimals: string | null; holders: string | null; marketCap: string | null; fiatValue: string | null; totalSupply: string | null; type: string; verified: boolean | null; explorerUrl: string };
type RiskReport = { address: string; token: { name: string | null; symbol: string | null; holders: string | null; verified: boolean | null }; contract: { verified: boolean; compilerVersion: string | null; language: string | null; proxy: boolean | null }; score: number; label: string; findings: Array<{ severity: "info" | "warning"; title: string; detail: string }>; functions: string[]; fetchedAt: string; source: string; disclaimer: string };
type RpcResult = { method: string; result: unknown; fetchedAt: string; network: string };

const searchKinds: Array<{ value: ExplorerKind; label: string; placeholder: string }> = [
  { value: "token", label: "Token contract", placeholder: "0x… token contract address" },
  { value: "address", label: "Wallet / address", placeholder: "0x… wallet or contract address" },
  { value: "transaction", label: "Transaction", placeholder: "0x… transaction hash" },
];

function shorten(value: string | null | undefined, front = 10, back = 8) {
  if (!value) return "—";
  if (value.length <= front + back + 3) return value;
  return `${value.slice(0, front)}…${value.slice(-back)}`;
}

function displayValue(value: string | number | boolean | null) {
  if (value === null || value === "") return "Unavailable";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function ChainHubClient() {
  const [kind, setKind] = useState<ExplorerKind>("token");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [result, setResult] = useState<ExplorerResult | null>(null);
  const [scannerSort, setScannerSort] = useState("holders_count");
  const [scannerQuery, setScannerQuery] = useState("");
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerTokens, setScannerTokens] = useState<ScannedToken[]>([]);
  const [scannerFetchedAt, setScannerFetchedAt] = useState<string | null>(null);
  const [riskAddress, setRiskAddress] = useState("");
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [rpcMethod, setRpcMethod] = useState("eth_blockNumber");
  const [rpcLoading, setRpcLoading] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [rpcResult, setRpcResult] = useState<RpcResult | null>(null);

  const runRiskAnalysis = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    const address = riskAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) { setRiskError("Enter a valid Robinhood Chain contract address."); setRiskReport(null); return; }
    setRiskLoading(true); setRiskError(null); setRiskReport(null);
    try {
      const response = await fetch(`/api/robinhood/risk?address=${encodeURIComponent(address)}`, { cache: "no-store" });
      const payload = await response.json() as { ok: boolean; data?: RiskReport; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error ?? "Risk analysis request failed.");
      setRiskReport(payload.data);
    } catch (error) { setRiskError(error instanceof Error ? error.message : "Risk analysis request failed."); }
    finally { setRiskLoading(false); }
  }, [riskAddress]);

  const runRpcCheck = useCallback(async () => {
    setRpcLoading(true); setRpcError(null); setRpcResult(null);
    try {
      const response = await fetch("/api/robinhood/rpc", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: rpcMethod, params: [] }) });
      const payload = await response.json() as { ok: boolean; result?: unknown; method?: string; fetchedAt?: string; network?: string; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "RPC request failed.");
      setRpcResult({ method: payload.method ?? rpcMethod, result: payload.result, fetchedAt: payload.fetchedAt ?? new Date().toISOString(), network: payload.network ?? "Robinhood Chain Mainnet · 4663" });
    } catch (error) { setRpcError(error instanceof Error ? error.message : "RPC request failed."); }
    finally { setRpcLoading(false); }
  }, [rpcMethod]);

  const loadScanner = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    setScannerLoading(true); setScannerError(null);
    try {
      const params = new URLSearchParams({ sort: scannerSort });
      if (scannerQuery.trim()) params.set("q", scannerQuery.trim());
      const response = await fetch(`/api/robinhood/scanner?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json() as { ok: boolean; data?: { items: ScannedToken[]; fetchedAt: string }; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error ?? "Token scanner request failed.");
      setScannerTokens(payload.data.items); setScannerFetchedAt(payload.data.fetchedAt);
    } catch (error) { setScannerError(error instanceof Error ? error.message : "Token scanner request failed."); }
    finally { setScannerLoading(false); }
  }, [scannerQuery, scannerSort]);

  const startResearchPrompt = (prompt: string) => {
    try {
      window.sessionStorage.setItem("standalone-agent:playground-draft", JSON.stringify({ prompt }));
    } catch {
      // If session storage is unavailable, still open the workspace normally.
    }
    window.location.assign("/chat");
  };

  const submitLookup = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setLookupError("Enter an address or transaction hash to search.");
      setResult(null);
      return;
    }
    setLoading(true);
    setLookupError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({ kind, q: cleanQuery });
      const response = await fetch(`/api/robinhood/explorer?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as { ok: boolean; data?: ExplorerResult; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error ?? "Explorer request failed.");
      setResult(payload.data);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Explorer request failed.");
    } finally {
      setLoading(false);
    }
  }, [kind, query]);

  return (
    <main className="rh-chain-page">
      <AnimatedDotField />
      <div className="rh-chain-content">
        <header className="rh-chain-nav">
          <Link href="/" className="rh-chain-brand"><StandAloneLogo size={35} className="rh-chain-logo" priority /><span>StandAlone <b>Agent</b><small>ROBINHOOD CHAIN TOOLS</small></span></Link>
          <div className="rh-chain-nav-links"><BrandHeaderLinks /><span className="rh-chain-pill"><i /> MAINNET · 4663</span><Link href="/chat" className="rh-chain-workspace-link">Open workspace <ArrowUpRight size={14} /></Link><a href="#explorer" className="rh-chain-explore-cta">Explore Robinhood <ArrowUpRight size={14} /></a></div>
        </header>

        <section className="rh-chain-hero">
          <div className="rh-chain-overline"><span className="rh-chain-overline-mark"><Blocks size={13} /></span> STANDALONE ONCHAIN INTELLIGENCE <span className="rh-overline-rule" /></div>
          <h1>Read the chain.<br /><span>Ask better questions.</span></h1>
          <p>Explore public Robinhood Chain Mainnet data, check network health, and use the existing AI workspace to investigate onchain records. Read-only by design.</p>
          <div className="rh-chain-hero-actions"><a href="#explorer" className="rh-solid-button">Explore an address <Search size={15} /></a><Link href="/chat" className="rh-outline-button">Ask the AI agent <Sparkles size={15} /></Link></div>
          <div className="rh-chain-trustline"><ShieldCheck size={14} /><span>No wallet connection. No signatures. No transactions submitted.</span></div>
        </section>

        <div className="rh-chain-main-grid">
          <div className="rh-chain-left-column">
            <ChainPulseMini />
            <section className="rh-explorer-panel" id="explorer">
              <div className="rh-panel-heading"><div><span className="rh-eyebrow">PUBLIC BLOCK EXPLORER DATA</span><h2>Token, wallet & transaction explorer</h2><p>Look up a token contract, wallet address, or transaction hash. Transaction searches include decoded fields when indexed data provides them.</p></div><span className="rh-icon-tile"><FileSearch size={18} /></span></div>
              <div className="rh-search-tabs" role="tablist" aria-label="Explorer search type">
                {searchKinds.map((item) => <button key={item.value} type="button" role="tab" aria-selected={kind === item.value} className={kind === item.value ? "is-selected" : ""} onClick={() => { setKind(item.value); setResult(null); setLookupError(null); }}>{item.label}</button>)}
              </div>
              <form className="rh-explorer-search" onSubmit={(event) => void submitLookup(event)}>
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} spellCheck={false} autoComplete="off" placeholder={searchKinds.find((item) => item.value === kind)?.placeholder} aria-label="Explorer query" />
                <button type="submit" disabled={loading}>{loading ? <RefreshCw size={15} className="rh-spin" /> : <>Search <ArrowUpRight size={14} /></>}</button>
              </form>
              <div className="rh-explorer-helper"><span>Search stays read-only</span><span>Source: Blockscout</span></div>
              {lookupError && <div className="rh-error-card"><CircleAlert size={16} /><div><strong>Could not load this record</strong><p>{lookupError}</p></div></div>}
              {result && <div className="rh-explorer-result">
                <div className="rh-result-heading"><div><span className="rh-result-type">{result.kind.toUpperCase()} RESULT</span><h3>{String(result.summary.name ?? result.summary.symbol ?? (result.kind === "transaction" ? "Transaction detail" : result.kind === "address" ? "Address detail" : "Token detail"))}</h3><code>{shorten(result.identifier, 14, 12)}</code></div><a href={result.explorerUrl} target="_blank" rel="noreferrer" className="rh-external-link">Open explorer <ExternalLink size={13} /></a></div>
                <div className="rh-result-fields">{Object.entries(result.summary as Record<string, string | number | boolean | null>).map(([key, value]) => <div className="rh-result-field" key={key}><span>{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</span><strong>{displayValue(value)}</strong></div>)}</div>
                {result.recentTransactions && result.recentTransactions.length > 0 && <div className="rh-recent-txs"><h4><Clock3 size={14} /> Recent transactions</h4>{result.recentTransactions.map((tx, index) => <div key={`${tx.hash ?? "tx"}-${index}`} className="rh-tx-row"><span>{shorten(tx.hash, 13, 8)}</span><span>{tx.status ?? "Indexed"}</span><span>{tx.block ?? "—"}</span>{tx.hash && <a href={`https://robinhoodchain.blockscout.com/tx/${tx.hash}`} target="_blank" rel="noreferrer" aria-label="Open transaction"><ArrowUpRight size={13} /></a>}</div>)}</div>}
                {result.kind === "address" && <div className="rh-wallet-analytics">
                  <h4><Wallet size={14} /> Wallet analytics</h4>
                  <div className="rh-wallet-analytics-grid"><div><span>Native ETH balance</span><strong>{displayValue(result.summary.balanceEth ?? null)} ETH</strong></div><div><span>Transactions indexed</span><strong>{displayValue(result.summary.transactionCount ?? null)}</strong></div><div><span>Token balances found</span><strong>{result.tokenBalances?.length ?? 0}</strong></div><div><span>Recent ERC-20 transfers</span><strong>{result.recentTokenTransfers?.length ?? 0}</strong></div></div>
                  {result.tokenBalances && result.tokenBalances.length > 0 && <div className="rh-wallet-list"><strong>Token holdings (up to 20 indexed assets)</strong>{result.tokenBalances.map((item, index) => <div key={`${item.contract ?? item.token}-${index}`}><span>{item.token ?? "Token"}{item.symbol ? ` (${item.symbol})` : ""}</span><code>{shorten(item.contract, 8, 6)}</code><small>{item.balance ?? "Balance indexed"}</small></div>)}</div>}
                  {result.recentTokenTransfers && result.recentTokenTransfers.length > 0 && <div className="rh-wallet-list"><strong>Recent token transfers</strong>{result.recentTokenTransfers.map((item, index) => <div key={`${item.hash ?? "transfer"}-${index}`}><span>{item.token ?? "Token"}</span><code>{shorten(item.hash, 8, 6)}</code><small>{item.amount ?? "Amount indexed"}</small></div>)}</div>}
                </div>}
                <div className="rh-result-footer"><span>Fetched {new Date(result.fetchedAt).toLocaleString()}</span><span>{result.source}</span></div>
              </div>}
              {!result && !lookupError && <div className="rh-explorer-empty"><div className="rh-empty-symbol"><Search size={20} /></div><strong>Start with an onchain identifier</strong><p>Paste a public address or transaction hash to load indexed explorer data. We do not fabricate data for empty states.</p></div>}
            </section>
          </div>

          <aside className="rh-chain-side-column">
            <section className="rh-side-card">
              <div className="rh-side-card-title"><Globe2 size={16} /><h2>Network details</h2></div>
              <div className="rh-fact-row"><span>Network</span><strong>Robinhood Chain</strong></div>
              <div className="rh-fact-row"><span>Environment</span><strong>Mainnet</strong></div>
              <div className="rh-fact-row"><span>Chain ID</span><strong>4663 <code>0x1237</code></strong></div>
              <div className="rh-fact-row"><span>Native gas token</span><strong>ETH</strong></div>
              <div className="rh-fact-row"><span>Explorer</span><a href="https://robinhoodchain.blockscout.com/" target="_blank" rel="noreferrer">Blockscout <ExternalLink size={12} /></a></div>
            </section>
            <section className="rh-side-card rh-research-card">
              <div className="rh-side-card-title"><Sparkles size={16} /><h2>Research with AI</h2></div>
              <p>Continue in the original StandAlone Agent chat. The agent now has read-only tools for chain pulse and explorer lookups.</p>
              <div className="rh-prompt-shortcuts">
                {["Check Robinhood Chain health", "Explain a transaction hash", "Research a token contract"].map((prompt) => <button key={prompt} type="button" onClick={() => startResearchPrompt(prompt)}>{prompt}<ArrowUpRight size={13} /></button>)}
              </div>
              <Link href="/chat" className="rh-side-cta">Open AI workspace <ArrowUpRight size={14} /></Link>
            </section>
            <section className="rh-side-card rh-safety-card"><ShieldCheck size={17} /><div><strong>Read-only integration</strong><p>These tools fetch public data only. There is no wallet connection, transaction signing, or transaction submission.</p></div></section>
          </aside>
        </div>

          <section className="rh-explorer-panel rh-token-scanner" id="token-scanner">
            <div className="rh-panel-heading"><div><span className="rh-eyebrow">LIVE INDEXED TOKEN DATA</span><h2><ScanSearch size={19} /> Token Scanner</h2><p>Browse indexed ERC-20 contracts on Robinhood Chain Mainnet. Results come from Blockscout, not simulated data.</p></div><span className="rh-icon-tile"><Coins size={18} /></span></div>
            <form className="rh-scanner-controls" onSubmit={(event) => void loadScanner(event)}>
              <label className="rh-scanner-query"><Search size={15} /><input value={scannerQuery} onChange={(event) => setScannerQuery(event.target.value)} placeholder="Filter by token name, symbol, or contract" aria-label="Filter tokens" /></label>
              <select value={scannerSort} onChange={(event) => setScannerSort(event.target.value)} aria-label="Sort tokens"><option value="holders_count">Most holders</option><option value="circulating_market_cap">Market cap</option><option value="fiat_value">Token price</option></select>
              <button type="submit" disabled={scannerLoading}>{scannerLoading ? <RefreshCw size={14} className="rh-spin" /> : <><ScanSearch size={14} /> Scan tokens</>}</button>
            </form>
            {scannerError && <div className="rh-error-card"><CircleAlert size={16} /><div><strong>Scanner unavailable</strong><p>{scannerError}</p></div></div>}
            {scannerTokens.length > 0 && <><div className="rh-scanner-table-wrap"><table className="rh-scanner-table"><thead><tr><th>Token</th><th>Holders</th><th>Market cap</th><th>Contract</th></tr></thead><tbody>{scannerTokens.map((token) => <tr key={token.address}><td><strong>{token.name}</strong><small>{token.symbol ?? "—"} · {token.type}</small></td><td>{token.holders ?? "—"}</td><td>{token.marketCap ? `$${Number(token.marketCap).toLocaleString()}` : "—"}</td><td><a href={token.explorerUrl} target="_blank" rel="noreferrer">{shorten(token.address, 8, 6)} <ExternalLink size={12} /></a></td></tr>)}</tbody></table></div><div className="rh-result-footer"><span>{scannerTokens.length} tokens returned</span><span>{scannerFetchedAt ? `Fetched ${new Date(scannerFetchedAt).toLocaleString()}` : ""}</span></div></>}
            {!scannerTokens.length && !scannerError && <div className="rh-explorer-empty"><div className="rh-empty-symbol"><ScanSearch size={20} /></div><strong>Ready to scan Robinhood Chain</strong><p>Choose a sort mode and click Scan tokens to request the latest indexed ERC-20 token list.</p></div>}
          </section>

          <section className="rh-explorer-panel rh-feature-panel" id="risk-analyzer">
            <div className="rh-panel-heading"><div><span className="rh-eyebrow">EVIDENCE-BASED CONTRACT TRIAGE</span><h2><ShieldAlert size={19} /> AI Contract & Token Risk Analyzer</h2><p>Inspect indexed verification and ABI function names. This is a heuristic triage report, not an audit or safety guarantee.</p></div><span className="rh-icon-tile"><ShieldCheck size={18} /></span></div>
            <form className="rh-scanner-controls" onSubmit={(event) => void runRiskAnalysis(event)}>
              <label className="rh-scanner-query"><Search size={15} /><input value={riskAddress} onChange={(event) => setRiskAddress(event.target.value)} spellCheck={false} placeholder="0x… token or contract address" aria-label="Contract address for risk analysis" /></label>
              <button type="submit" disabled={riskLoading}>{riskLoading ? <RefreshCw size={14} className="rh-spin" /> : <><ShieldCheck size={14} /> Analyze contract</>}</button>
            </form>
            {riskError && <div className="rh-error-card"><CircleAlert size={16} /><div><strong>Risk analysis unavailable</strong><p>{riskError}</p></div></div>}
            {riskReport && <div className="rh-risk-report"><div className="rh-risk-summary"><div><span>Heuristic indicator score</span><strong>{riskReport.score}/100</strong></div><div><span>Assessment</span><strong>{riskReport.label}</strong></div><div><span>Source verified</span><strong>{riskReport.contract.verified ? "Yes" : "No / unavailable"}</strong></div></div><div className="rh-risk-findings">{riskReport.findings.map((finding, index) => <div key={`${finding.title}-${index}`} className={finding.severity === "warning" ? "rh-risk-finding is-warning" : "rh-risk-finding"}><strong>{finding.title}</strong><p>{finding.detail}</p></div>)}</div>{riskReport.functions.length > 0 && <div className="rh-risk-functions"><strong>ABI function names ({riskReport.functions.length})</strong><p>{riskReport.functions.join(", ")}</p></div>}<button type="button" className="rh-risk-ai-button" onClick={() => startResearchPrompt(`Explain this Robinhood Chain contract risk report using evidence, distinguish facts from uncertainty, and do not claim the contract is safe or malicious without proof. Address: ${riskReport.address}. Score: ${riskReport.score}/100 (${riskReport.label}). Findings: ${JSON.stringify(riskReport.findings)}. Contract details: ${JSON.stringify(riskReport.contract)}. Data source: ${riskReport.source}. Disclaimer: ${riskReport.disclaimer}`)}><Sparkles size={14} /> Explain findings with AI <ArrowUpRight size={13} /></button><div className="rh-result-footer"><span>{riskReport.source}</span><span>Fetched {new Date(riskReport.fetchedAt).toLocaleString()}</span></div><p className="rh-disclaimer">{riskReport.disclaimer}</p></div>}
            {!riskReport && !riskError && <div className="rh-explorer-empty"><div className="rh-empty-symbol"><ShieldAlert size={20} /></div><strong>Check a contract before interacting</strong><p>Enter a contract address to review available verification data and potentially privileged ABI functions. Missing data is not treated as proof of safety.</p></div>}
          </section>

          <section className="rh-explorer-panel rh-feature-panel" id="developer-toolkit">
            <div className="rh-panel-heading"><div><span className="rh-eyebrow">READ-ONLY RPC PLAYGROUND</span><h2><Terminal size={19} /> Developer Toolkit</h2><p>Run a small allowlist of read-only Robinhood Chain RPC checks. Write methods and transaction submission are blocked.</p></div><span className="rh-icon-tile"><Code2 size={18} /></span></div>
            <div className="rh-scanner-controls"><label className="rh-rpc-method-label"><span>JSON-RPC method</span><select value={rpcMethod} onChange={(event) => setRpcMethod(event.target.value)} aria-label="JSON-RPC method"><option value="eth_chainId">eth_chainId</option><option value="eth_blockNumber">eth_blockNumber</option><option value="eth_gasPrice">eth_gasPrice</option></select></label><button type="button" onClick={() => void runRpcCheck()} disabled={rpcLoading}>{rpcLoading ? <RefreshCw size={14} className="rh-spin" /> : <><Terminal size={14} /> Run read-only request</>}</button></div>
            {rpcError && <div className="rh-error-card"><CircleAlert size={16} /><div><strong>RPC request failed</strong><p>{rpcError}</p></div></div>}
            {rpcResult && <div className="rh-rpc-result"><div className="rh-result-footer"><span>{rpcResult.network}</span><span>{rpcResult.method}</span></div><pre>{JSON.stringify(rpcResult.result, null, 2)}</pre><div className="rh-result-footer"><span>Response received</span><span>{new Date(rpcResult.fetchedAt).toLocaleString()}</span></div></div>}
            {!rpcResult && !rpcError && <div className="rh-explorer-empty"><div className="rh-empty-symbol"><Code2 size={20} /></div><strong>Test the Robinhood Chain RPC</strong><p>Check the configured server-side RPC connection without exposing API keys or sending transactions.</p></div>}
          </section>

        <footer className="rh-chain-footer"><Link href="/">StandAlone Agent</Link><span>Independent AI workspace · Robinhood Chain Mainnet</span><span><Database size={12} /> RPC and explorer data may be delayed</span></footer>
      </div>
    </main>
  );
}
