import Link from "next/link";
import { AnimatedDotField } from "@/components/ui/animated-dot-field";
import { ChainPulseMini } from "@/components/robinhood/ChainPulseMini";
import { StandAloneLogo } from "@/components/brand/StandAloneLogo";
import { BrandHeaderLinks } from "@/components/brand/BrandHeaderLinks";
import { LandingMotionIntro } from "@/components/brand/LandingMotionIntro";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  CircleDot,
  Command,
  FileText,
  Globe,
  Layers3,
  MessageSquare,
  Paperclip,
  Plus,
  ScanSearch,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";

const capabilities = [
  {
    number: "01",
    icon: MessageSquare,
    title: "One calm workspace",
    text: "Keep research, questions, files, and follow-up prompts together in a focused conversation.",
    tone: "lavender",
  },
  {
    number: "02",
    icon: Workflow,
    title: "Tools when you need them",
    text: "Let the assistant call connected tools, work through multiple steps, and return useful results.",
    tone: "peach",
  },
  {
    number: "03",
    icon: Layers3,
    title: "Bring your own model",
    text: "Configure a supported provider with your own credentials and choose a model that fits the task.",
    tone: "mint",
  },
];

export default function Home() {
  return (
    <main className="sa-site">
      <LandingMotionIntro />
      <AnimatedDotField />
      <div className="sa-orb sa-orb-one" aria-hidden="true" />
      <div className="sa-orb sa-orb-two" aria-hidden="true" />
      <header className="sa-nav-wrap">
        <nav className="sa-nav" aria-label="Main navigation">
          <Link href="/" className="sa-brand" aria-label="StandAlone Agent home">
            <StandAloneLogo size={38} className="sa-nav-logo" priority />
            <span className="sa-brand-name">StandAlone<span> Agent</span></span>
          </Link>
          <div className="sa-nav-links">
            <a href="#features">What it does</a>
            <a href="#workflow">How it works</a>
          </div>
          <div className="sa-nav-actions">
            <BrandHeaderLinks />
            <Link href="/chain" className="sa-nav-chain-cta">Explore Robinhood <ArrowUpRight size={15} /></Link>
            <Link href="/chat" className="sa-nav-cta">Open workspace <ArrowUpRight size={15} /></Link>
          </div>
        </nav>
      </header>

      <section className="sa-hero">
        <div className="sa-hero-copy">
          <div className="sa-eyebrow"><span className="sa-eyebrow-icon"><Sparkles size={14} /></span> A more personal way to work with AI <span className="sa-eyebrow-line" /></div>
          <h1>Less prompting.<br /><span>More making.</span></h1>
          <p className="sa-hero-description">A thoughtful AI workspace built for ideas that go somewhere. Talk things through, bring in files, use tools, and keep the work moving.</p>
          <div className="sa-hero-actions">
            <Link href="/chat" className="sa-primary-button">Enter your workspace <ArrowRight size={17} /></Link>
            <a href="#features" className="sa-secondary-button">Explore capabilities <ArrowDownRight size={17} /></a>
          </div>
          <div className="sa-proof-row">
            <div className="sa-proof-icon-stack"><span><Bot size={15} /></span><span><Zap size={14} /></span><span><ShieldCheck size={14} /></span></div>
            <p><strong>Your models. Your context.</strong><br /><span>Built to run with your own provider setup.</span></p>
          </div>
        </div>

        <div className="sa-product-stage" aria-label="StandAlone Agent workspace preview">
          <div className="sa-stage-glow" />
          <div className="sa-window">
            <div className="sa-window-topbar">
              <div className="sa-window-controls"><i /><i /><i /></div>
              <div className="sa-window-title"><StandAloneLogo size={20} className="sa-preview-logo" /> StandAlone Agent</div>
              <div className="sa-window-top-right"><span className="sa-live-dot" /> LOCAL</div>
            </div>
            <div className="sa-window-body">
              <aside className="sa-preview-sidebar">
                <div className="sa-preview-new"><Plus size={14} /> New conversation <kbd>⌘ K</kbd></div>
                <div className="sa-preview-label">YOUR SPACE</div>
                <div className="sa-preview-menu active"><MessageSquare size={14} /> Chat workspace</div>
                <div className="sa-preview-menu"><Search size={14} /> Explore ideas</div>
                <div className="sa-preview-menu"><FileText size={14} /> Files & notes</div>
                <div className="sa-preview-bottom"><div className="sa-avatar">SA</div><div><strong>Private workspace</strong><span>Personal setup</span></div><ChevronDown size={13} /></div>
              </aside>
              <div className="sa-preview-chat">
                <div className="sa-chat-heading"><div><span className="sa-kicker">WORKSPACE / SESSION 01</span><h3>Let&apos;s make progress.</h3></div><button aria-label="More options" className="sa-ghost-dots">···</button></div>
                <div className="sa-date-label">TODAY · 9:41 AM</div>
                <div className="sa-user-bubble">Help me turn a rough idea into a clear plan.</div>
                <div className="sa-agent-reply">
                  <div className="sa-agent-avatar"><Sparkles size={16} /></div>
                  <div className="sa-agent-content"><strong>StandAlone</strong><p>Absolutely. We can shape it into a few useful steps, then refine each one as we go.</p>
                    <div className="sa-plan-card"><div className="sa-plan-head"><span><Workflow size={13} /> Proposed approach</span><span className="sa-plan-status">READY</span></div>
                      <div className="sa-plan-step"><span className="sa-step-check"><Check size={10} /></span><span>Clarify the outcome</span><small>01</small></div>
                      <div className="sa-plan-step"><span className="sa-step-check"><Check size={10} /></span><span>Gather useful context</span><small>02</small></div>
                      <div className="sa-plan-step"><span className="sa-step-number">3</span><span>Build and review</span><small>NEXT</small></div>
                    </div>
                    <div className="sa-tool-row"><span><Globe size={12} /> Web search</span><span><Paperclip size={12} /> File aware</span><span><Activity size={12} /> Tool ready</span></div>
                  </div>
                </div>
                <div className="sa-preview-composer"><span>Message your assistant…</span><div><span className="sa-composer-plus"><Plus size={13} /></span><span className="sa-composer-model">Model <ChevronDown size={11} /></span><span className="sa-send-button"><ArrowRight size={14} /></span></div></div>
                <div className="sa-preview-note"><CircleDot size={10} /> Illustrative interface preview · features depend on your configuration</div>
              </div>
            </div>
          </div>
          <div className="sa-float-card sa-float-top"><span className="sa-float-icon purple"><Zap size={15} /></span><div><strong>Tool calling</strong><small>Ready when needed</small></div><span className="sa-float-check"><Check size={12} /></span></div>
          <div className="sa-float-card sa-float-bottom"><span className="sa-float-icon orange"><Layers3 size={15} /></span><div><strong>Your AI stack</strong><small>Provider-flexible</small></div><span className="sa-float-spark">✳</span></div>
        </div>
      </section>

      <section className="sa-motion-ticker" aria-label="StandAlone Agent capabilities ticker">
        <div className="sa-motion-ticker-track">
          <div className="sa-motion-ticker-group">
            <span>STANDALONE AGENT</span><i />
            <span>ROBINHOOD CHAIN MAINNET</span><i />
            <span>INDEPENDENT AI WORKSPACE</span><i />
            <span>READ-ONLY ONCHAIN TOOLS</span><i />
            <span>RESEARCH WITH CONTEXT</span><i />
            <span>YOUR MODELS · YOUR WORKFLOW</span><i />
          </div>
          <div className="sa-motion-ticker-group" aria-hidden="true">
            <span>STANDALONE AGENT</span><i />
            <span>ROBINHOOD CHAIN MAINNET</span><i />
            <span>INDEPENDENT AI WORKSPACE</span><i />
            <span>READ-ONLY ONCHAIN TOOLS</span><i />
            <span>RESEARCH WITH CONTEXT</span><i />
            <span>YOUR MODELS · YOUR WORKFLOW</span><i />
          </div>
        </div>
      </section>

      <section className="sa-capability-strip" id="workflow">
        <div className="sa-strip-label"><span className="sa-status-indicator" /> MADE FOR REAL WORK</div>
        <p>From a first thought to a finished next step.</p>
        <div className="sa-strip-note"><Command size={14} /> Keep your workflow in your hands</div>
      </section>

      <section className="sa-chain-preview" id="robinhood-chain">
        <div className="sa-chain-preview-heading"><span className="sa-section-kicker">ONCHAIN LAYER</span><h2>Built for <em>Robinhood Chain.</em></h2><p>Read network status and explore public onchain records without changing the core AI workspace.</p></div>
        <ChainPulseMini compact />
      </section>

      <section className="sa-chain-info" id="chain-capabilities" aria-labelledby="sa-chain-info-title">
        <div className="sa-chain-info-heading">
          <div>
            <span className="sa-section-kicker">ROBINHOOD CHAIN · CAPABILITIES</span>
            <h2 id="sa-chain-info-title">Understand the chain.<br /><em>Explore with context.</em></h2>
          </div>
          <div className="sa-chain-info-intro">
            <p>StandAlone Agent brings public Robinhood Chain data and read-only research tools into one place. Learn what each tool is designed to help you do, then open the Chain workspace to use it.</p>
            <Link href="/chain" className="sa-chain-info-main-cta">Explore Robinhood Chain <ArrowUpRight size={15} /></Link>
          </div>
        </div>

        <div className="sa-chain-info-grid">
          <article className="sa-chain-info-card">
            <div className="sa-chain-info-card-top"><span className="sa-chain-info-icon"><Activity size={19} /></span><span>01</span></div>
            <h3>Network Pulse &amp; Status</h3>
            <p>Get a quick view of Robinhood Chain Mainnet, including available block information, gas price, recent block activity, and RPC response health. Values depend on the configured data source and may be unavailable when a service cannot respond.</p>
            <Link href="/chain" className="sa-chain-info-link">View network tools <ArrowUpRight size={15} /></Link>
          </article>

          <article className="sa-chain-info-card">
            <div className="sa-chain-info-card-top"><span className="sa-chain-info-icon"><Search size={19} /></span><span>02</span></div>
            <h3>Token, Wallet &amp; Transaction Explorer</h3>
            <p>Look up a token contract, public wallet or address, or transaction hash. Review indexed details and decoded transaction fields when the explorer provides them, then follow the source link for more context.</p>
            <Link href="/chain#explorer" className="sa-chain-info-link">Explore on-chain records <ArrowUpRight size={15} /></Link>
          </article>

          <article className="sa-chain-info-card">
            <div className="sa-chain-info-card-top"><span className="sa-chain-info-icon"><ScanSearch size={19} /></span><span>03</span></div>
            <h3>Token Scanner</h3>
            <p>Browse indexed ERC-20 tokens on Robinhood Chain Mainnet and filter by token name, symbol, or contract. Sort available results by holder count, market cap, or token price when that information is provided by the indexer.</p>
            <Link href="/chain#token-scanner" className="sa-chain-info-link">Explore token data <ArrowUpRight size={15} /></Link>
          </article>

          <article className="sa-chain-info-card">
            <div className="sa-chain-info-card-top"><span className="sa-chain-info-icon"><ShieldAlert size={19} /></span><span>04</span></div>
            <h3>Contract &amp; Token Risk Analysis</h3>
            <p>Review available contract verification details, compiler metadata, and potentially privileged ABI functions. The report is a preliminary, evidence-based heuristic—not a formal security audit or a guarantee that a token is safe or malicious.</p>
            <Link href="/chain#risk-analyzer" className="sa-chain-info-link">Review risk-analysis tools <ArrowUpRight size={15} /></Link>
          </article>

          <article className="sa-chain-info-card">
            <div className="sa-chain-info-card-top"><span className="sa-chain-info-icon"><Sparkles size={19} /></span><span>05</span></div>
            <h3>Research with AI</h3>
            <p>Continue a chain question in the existing AI workspace. Use the assistant to help interpret available network details, token information, or transaction records while keeping conclusions tied to the evidence supplied.</p>
            <Link href="/chat" className="sa-chain-info-link">Ask the AI workspace <ArrowUpRight size={15} /></Link>
          </article>

          <article className="sa-chain-info-card">
            <div className="sa-chain-info-card-top"><span className="sa-chain-info-icon"><Terminal size={19} /></span><span>06</span></div>
            <h3>Developer Toolkit</h3>
            <p>Run a limited set of read-only JSON-RPC checks, such as retrieving the chain ID, latest block number, or gas price. Write methods and transaction submission are blocked; the tools do not connect a wallet or sign transactions.</p>
            <Link href="/chain#developer-toolkit" className="sa-chain-info-link">Open developer tools <ArrowUpRight size={15} /></Link>
          </article>
        </div>

        <div className="sa-chain-info-footnote"><ShieldCheck size={15} /><p>Designed for public-data exploration. Availability and detail depend on the explorer and RPC sources; missing information is not treated as proof of safety.</p><Link href="/chain" className="sa-chain-info-footer-cta">Open Robinhood Chain tools <ArrowRight size={15} /></Link></div>
      </section>


      <section className="sa-features" id="features">
        <div className="sa-section-heading"><div><span className="sa-section-kicker">THE WORKSPACE</span><h2>Everything in its<br /><em>right place.</em></h2></div><p>Less interface noise. More room to think, explore, and get things done with an assistant that works alongside you.</p></div>
        <div className="sa-feature-grid">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return <article className={`sa-feature-card ${item.tone}`} key={item.number}>
              <div className="sa-feature-card-top"><span className="sa-feature-icon"><Icon size={20} /></span><span className="sa-feature-number">{item.number}</span></div>
              <h3>{item.title}</h3><p>{item.text}</p><div className="sa-feature-link"><span>Built into your workspace</span><ArrowUpRight size={16} /></div>
            </article>;
          })}
        </div>
      </section>

      <section className="sa-bottom-cta">
        <div className="sa-cta-mark"><Sparkles size={22} /></div>
        <div className="sa-cta-copy"><span className="sa-section-kicker">YOUR NEXT STEP STARTS HERE</span><h2>Make space for<br /><em>better thinking.</em></h2><p>Open your workspace and start with one question, one document, or one idea.</p></div>
        <Link href="/chat" className="sa-primary-button">Start a conversation <ArrowRight size={17} /></Link>
        <div className="sa-cta-decoration" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      </section>

      <footer className="sa-footer"><Link href="/" className="sa-footer-brand"><StandAloneLogo size={34} className="sa-footer-logo" /> StandAlone Agent</Link><p>Independent by design. Helpful by default.</p><div><Link href="/chat">Workspace</Link><a href="https://x.com/standaloneagent" target="_blank" rel="noreferrer">Twitter <ArrowUpRight size={12} /></a></div></footer>
    </main>
  );
}
