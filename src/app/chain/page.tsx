import type { Metadata } from "next";
import { ChainHubClient } from "@/components/robinhood/ChainHubClient";

export const metadata: Metadata = {
  title: "Robinhood Chain Tools | StandAlone Agent",
  description: "Read-only Robinhood Chain Mainnet explorer, network pulse, and AI research tools.",
};

export default function RobinhoodChainPage() {
  return <ChainHubClient />;
}
