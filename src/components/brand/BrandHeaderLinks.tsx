import { ArrowUpRight } from "lucide-react";
import { STANDALONE_X_HANDLE, STANDALONE_X_URL } from "@/lib/brand-config";
import {
  CONTRACT_ADDRESS_DISPLAY,
  CONTRACT_ADDRESS_EXPLORER_URL,
  IS_CONTRACT_ADDRESS_PENDING,
} from "@/lib/contract-address";

type BrandHeaderLinksProps = {
  variant?: "header" | "sidebar";
};

export function BrandHeaderLinks({ variant = "header" }: BrandHeaderLinksProps) {
  const isSidebar = variant === "sidebar";
  const linkClass = isSidebar
    ? "inline-flex min-w-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.025] px-2 py-1.5 text-[9px] font-medium text-white/70 transition hover:border-[#08c9a6]/50 hover:text-white"
    : "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.035] px-2.5 py-2 text-[11px] font-medium text-white/75 transition hover:border-[#08c9a6]/50 hover:bg-[#08c9a6]/[0.07] hover:text-white";
  const contractClass = isSidebar
    ? "inline-flex min-w-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.025] px-2 py-1.5 text-[9px] font-medium text-white/70 transition hover:border-[#08c9a6]/50 hover:text-white"
    : "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.035] px-2.5 py-2 text-[11px] font-medium text-white/75 transition hover:border-[#08c9a6]/50 hover:bg-[#08c9a6]/[0.07] hover:text-white";

  const contractContents = (
    <>
      <span className="font-semibold tracking-wide text-[#08c9a6]">CA</span>
      <span className="truncate">{CONTRACT_ADDRESS_DISPLAY}</span>
      {!IS_CONTRACT_ADDRESS_PENDING && <ArrowUpRight size={11} aria-hidden="true" />}
    </>
  );

  return (
    <div className={`flex items-center ${isSidebar ? "flex-wrap gap-1.5" : "gap-2"}`}>
      <a
        className={linkClass}
        href={STANDALONE_X_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Follow StandAlone Agent on X (${STANDALONE_X_HANDLE})`}
        title={`Follow ${STANDALONE_X_HANDLE} on X`}
      >
        <span className="text-[13px] font-bold leading-none" aria-hidden="true">𝕏</span>
        <span>{STANDALONE_X_HANDLE}</span>
        <ArrowUpRight size={11} aria-hidden="true" />
      </a>

      {CONTRACT_ADDRESS_EXPLORER_URL ? (
        <a
          className={contractClass}
          href={CONTRACT_ADDRESS_EXPLORER_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Open token contract on Robinhood Chain Blockscout"
          aria-label={`Open contract ${CONTRACT_ADDRESS_DISPLAY} on Blockscout`}
        >
          {contractContents}
        </a>
      ) : (
        <span
          className={`${contractClass} cursor-default`}
          title={IS_CONTRACT_ADDRESS_PENDING ? "Official contract address will be added after launch" : "Check src/lib/contract-address.ts: address format must be 0x followed by 40 hexadecimal characters"}
          aria-label={`Contract address: ${CONTRACT_ADDRESS_DISPLAY}`}
        >
          {contractContents}
        </span>
      )}
    </div>
  );
}
