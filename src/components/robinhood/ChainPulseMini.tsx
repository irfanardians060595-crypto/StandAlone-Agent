"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowUpRight, CircleAlert, RefreshCw, RadioTower } from "lucide-react";

type PulseData = {
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

type PulseResponse = { ok: boolean; data?: PulseData; error?: string; setupRequired?: boolean };

type Props = { compact?: boolean };

export function ChainPulseMini({ compact = false }: Props) {
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/robinhood/pulse", { cache: "no-store" });
      const payload = (await response.json()) as PulseResponse;
      if (!response.ok || !payload.ok || !payload.data) {
        setPulse(null);
        setError(payload.error ?? "Chain Pulse is temporarily unavailable.");
        setSetupRequired(Boolean(payload.setupRequired));
        return;
      }
      setPulse(payload.data);
      setError(payload.data.networkMatches ? null : `RPC returned chain ID ${payload.data.chainId}; expected ${payload.data.expectedChainId}.`);
      setSetupRequired(false);
    } catch {
      setPulse(null);
      setError("Could not reach the StandAlone Agent API. Check the server and try again.");
      setSetupRequired(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return (
    <section className={`rh-pulse-mini ${compact ? "rh-pulse-compact" : ""}`} aria-label="Robinhood Chain Pulse">
      <div className="rh-pulse-topline">
        <div className="rh-pulse-title"><span className="rh-icon-tile"><RadioTower size={17} /></span><div><span className="rh-eyebrow">ONCHAIN DATA</span><h2>Robinhood Chain Pulse</h2></div></div>
        <div className="rh-pulse-actions"><span className={`rh-live-status ${pulse?.networkMatches && !error ? "is-live" : "is-idle"}`}><i />{pulse?.networkMatches && !error ? "RPC CONNECTED" : loading ? "CHECKING" : "NEEDS ATTENTION"}</span><button type="button" className="rh-icon-button" onClick={() => void refresh()} disabled={loading} aria-label="Refresh Chain Pulse"><RefreshCw size={14} className={loading ? "rh-spin" : ""} /></button></div>
      </div>
      <div className="rh-pulse-grid">
        <div className="rh-pulse-metric"><span>Latest block</span><strong>{pulse?.latestBlock ? Number(pulse.latestBlock).toLocaleString("en-US") : "—"}</strong><small>Mainnet · Chain ID 4663</small></div>
        <div className="rh-pulse-metric"><span>Gas price</span><strong>{pulse?.gasPriceGwei && pulse.gasPriceGwei !== "Unavailable" ? `${pulse.gasPriceGwei} Gwei` : "—"}</strong><small>Native gas: ETH</small></div>
        <div className="rh-pulse-metric"><span>Transactions in latest block</span><strong>{pulse?.transactionsInLatestBlock == null ? "—" : pulse.transactionsInLatestBlock.toLocaleString("en-US")}</strong><small>Latest block only</small></div>
        <div className="rh-pulse-metric"><span>RPC response</span><strong>{pulse?.latencyMs != null && !error ? `${pulse.latencyMs} ms` : "—"}</strong><small>{pulse?.fetchedAt ? `Updated ${new Date(pulse.fetchedAt).toLocaleTimeString()}` : "Waiting for live data"}</small></div>
      </div>
      {error && <div className="rh-pulse-notice"><CircleAlert size={15} /><div><strong>{setupRequired ? "Alchemy RPC setup required" : "Live data unavailable"}</strong><p>{error}</p>{setupRequired && <p>Add <code>ALCHEMY_ROBINHOOD_API_KEY</code> to <code>.env.local</code>, then restart <code>pnpm dev</code>.</p>}</div></div>}
      <div className="rh-pulse-bottom"><span><Activity size={13} /> {pulse?.networkMatches && !error ? `Live from ${pulse.source}` : "No placeholder numbers are shown"}</span><Link href="/chain">Open Chain Explorer <ArrowUpRight size={13} /></Link></div>
    </section>
  );
}
