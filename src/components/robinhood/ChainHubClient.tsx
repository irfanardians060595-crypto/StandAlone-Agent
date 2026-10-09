"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Blocks, CircleAlert, Clock3, Database, ExternalLink, FileSearch, Globe2, RefreshCw, Search, ShieldCheck, Sparkles } from "lucide-react";
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
};

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
          <div className="rh-chain-nav-links"><BrandHeaderLinks /><span className="rh-chain-pill"><i /> MAINNET · 4663</span><Link href="/chat">AI workspace <ArrowUpRight size={14} /></Link></div>
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
              <div className="rh-panel-heading"><div><span className="rh-eyebrow">PUBLIC BLOCK EXPLORER DATA</span><h2>Token & transaction explorer</h2><p>Look up a token contract, address, or transaction hash.</p></div><span className="rh-icon-tile"><FileSearch size={18} /></span></div>
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

        <footer className="rh-chain-footer"><Link href="/">StandAlone Agent</Link><span>Independent AI workspace · Robinhood Chain Mainnet</span><span><Database size={12} /> RPC and explorer data may be delayed</span></footer>
      </div>
    </main>
  );
}
