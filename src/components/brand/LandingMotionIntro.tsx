"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { StandAloneLogo } from "@/components/brand/StandAloneLogo";
import { CometOrbitField } from "@/components/brand/CometOrbitField";

type IntroPhase = "intro" | "exiting" | "hidden";

/**
 * Frontend-only motion layer for the landing page.
 * Shows a short brand intro once per browser tab session, then observes sections
 * for reveal-on-scroll and adds a restrained pointer tilt to the workspace preview.
 * No API, provider, tool, or chat behavior is modified here.
 */
export function LandingMotionIntro() {
  const [phase, setPhase] = useState<IntroPhase>("intro");
  const finishIntroRef = useRef<() => void>(() => undefined);
  const introDecisionRef = useRef<boolean | null>(null);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    let exitTimer: number | undefined;
    let finishTimer: number | undefined;
    let skipTimer: number | undefined;
    let revealObserver: IntersectionObserver | undefined;
    let cleanupPointer: (() => void) | undefined;
    let disposed = false;

    const motionTargets = [
      ".sa-hero-copy",
      ".sa-product-stage",
      ".sa-motion-ticker",
      ".sa-capability-strip",
      ".sa-chain-preview",
      ".sa-feature-card",
      ".sa-bottom-cta",
      ".sa-footer",
    ].join(",");

    const enableLandingMotion = () => {
      if (disposed) return;
      const root = document.documentElement;
      const targets = Array.from(document.querySelectorAll<HTMLElement>(motionTargets));
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      targets.forEach((target, index) => {
        target.classList.add("sa-motion-reveal");
        const delay = target.classList.contains("sa-feature-card")
          ? (Array.from(target.parentElement?.children ?? []).indexOf(target) % 3) * 95
          : Math.min(index, 4) * 65;
        target.style.setProperty("--sa-reveal-delay", `${delay}ms`);
      });

      if (reducedMotion || !("IntersectionObserver" in window)) {
        targets.forEach((target) => target.classList.add("sa-in-view"));
        return;
      }

      root.classList.add("sa-motion-ready");
      revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("sa-in-view");
            revealObserver?.unobserve(entry.target);
          }
        },
        { threshold: 0.13, rootMargin: "0px 0px -5% 0px" },
      );
      targets.forEach((target) => revealObserver?.observe(target));

      const stage = document.querySelector<HTMLElement>(".sa-product-stage");
      if (stage && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const handlePointerMove = (event: PointerEvent) => {
          const rect = stage.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
          stage.style.setProperty("--sa-tilt-x", `${(x * 2.1).toFixed(2)}deg`);
          stage.style.setProperty("--sa-tilt-y", `${(-y * 1.4).toFixed(2)}deg`);
        };
        const resetPointer = () => {
          stage.style.setProperty("--sa-tilt-x", "0deg");
          stage.style.setProperty("--sa-tilt-y", "0deg");
        };
        stage.addEventListener("pointermove", handlePointerMove, { passive: true });
        stage.addEventListener("pointerleave", resetPointer, { passive: true });
        cleanupPointer = () => {
          stage.removeEventListener("pointermove", handlePointerMove);
          stage.removeEventListener("pointerleave", resetPointer);
        };
      }
    };

    const finishIntro = () => {
      if (disposed) return;
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
      if (skipTimer !== undefined) window.clearTimeout(skipTimer);
      setShowSkip(false);
      try {
        window.sessionStorage.setItem("standalone-agent:intro-seen-v3", "1");
      } catch {
        // The intro can still be skipped if session storage is unavailable.
      }
      setPhase("hidden");
      enableLandingMotion();
    };
    finishIntroRef.current = finishIntro;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introKey = "standalone-agent:intro-seen-v3";
    const documentTokenKey = "standalone-agent:intro-document-token";

    if (introDecisionRef.current === null) {
      let alreadySeen = false;
      try {
        // sessionStorage survives a reload, so explicitly allow the intro to replay on
        // a full document load at the landing page. The document token prevents it from
        // replaying when Next.js remounts this component during client-side navigation.
        const navigationEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const documentToken = String(window.performance.timeOrigin);
        const storedDocumentToken = window.sessionStorage.getItem(documentTokenKey);
        if (storedDocumentToken !== documentToken) {
          if (window.location.pathname === "/" && navigationEntry?.type !== "back_forward") {
            window.sessionStorage.removeItem(introKey);
          }
          window.sessionStorage.setItem(documentTokenKey, documentToken);
        }
        alreadySeen = window.sessionStorage.getItem(introKey) === "1";
      } catch {
        alreadySeen = false;
      }
      introDecisionRef.current = !reducedMotion && !alreadySeen;
      // Mark immediately so a route transition within this document never replays it.
      if (introDecisionRef.current) {
        try {
          window.sessionStorage.setItem(introKey, "1");
        } catch {
          // Intro timing remains functional when storage is unavailable.
        }
      }
    }

    const shouldPlayIntro = introDecisionRef.current && !reducedMotion;
    if (!shouldPlayIntro) {
      setPhase("hidden");
      enableLandingMotion();
    } else {
      setPhase("intro");
      skipTimer = window.setTimeout(() => setShowSkip(true), 1700);
      // Give the logo and wordmark a slower reveal, then hold the complete brand long enough to read.
      // The total intro is about 6.6 seconds including its final fade.
      exitTimer = window.setTimeout(() => setPhase("exiting"), 5650);
      finishTimer = window.setTimeout(finishIntro, 6600);
    }

    return () => {
      disposed = true;
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
      if (skipTimer !== undefined) window.clearTimeout(skipTimer);
      revealObserver?.disconnect();
      cleanupPointer?.();
      document.documentElement.classList.remove("sa-motion-ready");
    };
  }, []);

  return (
    <>
      <CometOrbitField />
      {phase !== "hidden" && <div
      className={`sa-intro-overlay${phase === "exiting" ? " is-exiting" : ""}`}
      role="status"
      aria-label="StandAlone Agent is opening"
    >
      <div className="sa-intro-grid" aria-hidden="true" />
      <div className="sa-intro-vignette" aria-hidden="true" />
      <div className="sa-intro-center">
        <div className="sa-intro-logo-wrap">
          <span className="sa-intro-orbit sa-intro-orbit-one" aria-hidden="true" />
          <span className="sa-intro-orbit sa-intro-orbit-two" aria-hidden="true" />
          <StandAloneLogo size={96} className="sa-intro-logo" priority />
        </div>
        <div className="sa-intro-wordmark">StandAlone <span>Agent</span></div>
        <div className="sa-intro-rule" aria-hidden="true"><span /></div>
        <p className="sa-intro-caption">INDEPENDENT AI WORKSPACE</p>
      </div>
      {showSkip && <button className="sa-intro-skip" type="button" onClick={() => finishIntroRef.current()}>
        Skip intro <ArrowRight size={13} aria-hidden="true" />
      </button>}
    </div>}
    </>
  );
}
