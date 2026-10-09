"use client";

import { useEffect, useState } from "react";

/** Decorative, frontend-only orbital/comet layer for the landing page. */
export function CometOrbitField() {
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!preference.matches);
    update();
    preference.addEventListener?.("change", update);
    return () => preference.removeEventListener?.("change", update);
  }, []);

  return (
    <div className="sa-comet-field" aria-hidden="true">
      <svg
        className="sa-comet-svg"
        viewBox="0 0 1440 2400"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="sa-comet-tail" x1="-190" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#08c9a6" stopOpacity="0" />
            <stop offset="42%" stopColor="#08c9a6" stopOpacity="0.18" />
            <stop offset="77%" stopColor="#ffffff" stopOpacity="0.64" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="sa-comet-tail-soft" x1="-155" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="72%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#08c9a6" stopOpacity="1" />
          </linearGradient>
          <filter id="sa-comet-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="sa-comet-halo">
            <stop offset="0%" stopColor="#08c9a6" stopOpacity="0.17" />
            <stop offset="100%" stopColor="#08c9a6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Large orbital arcs remain quiet behind readable content. */}
        <path className="sa-comet-orbit sa-comet-orbit-one" d="M -100 420 C 205 115, 630 150, 930 410 S 1330 720, 1530 440" />
        <path className="sa-comet-orbit sa-comet-orbit-two" d="M -120 1240 C 220 950, 710 990, 1010 1250 S 1370 1530, 1540 1220" />
        <path className="sa-comet-orbit sa-comet-orbit-three" d="M -100 2050 C 240 1785, 620 1860, 920 2075 S 1340 2300, 1540 1990" />
        <path className="sa-comet-orbit sa-comet-orbit-cross" d="M 115 15 C 480 410, 850 670, 1270 1000 S 1050 1640, 1380 2380" />

        <g className="sa-comet-stars">
          <circle cx="94" cy="140" r="1.2" />
          <circle cx="184" cy="265" r="1.4" />
          <circle cx="420" cy="205" r="1.1" />
          <circle cx="680" cy="330" r="1.3" />
          <circle cx="930" cy="165" r="1.1" />
          <circle cx="1180" cy="310" r="1.7" />
          <circle cx="1330" cy="190" r="1.2" />
          <circle cx="104" cy="570" r="1.1" />
          <circle cx="350" cy="695" r="1.5" />
          <circle cx="815" cy="610" r="1.2" />
          <circle cx="1035" cy="790" r="1.2" />
          <circle cx="1280" cy="650" r="1.4" />
          <circle cx="255" cy="1020" r="1.5" />
          <circle cx="510" cy="880" r="1.0" />
          <circle cx="875" cy="1010" r="1.4" />
          <circle cx="1195" cy="1115" r="1.1" />
          <circle cx="140" cy="1270" r="1.4" />
          <circle cx="430" cy="1390" r="1.2" />
          <circle cx="755" cy="1295" r="1.1" />
          <circle cx="1290" cy="1470" r="1.4" />
          <circle cx="1110" cy="1600" r="1.0" />
          <circle cx="225" cy="1780" r="1.3" />
          <circle cx="480" cy="1700" r="1.1" />
          <circle cx="900" cy="1850" r="1.4" />
          <circle cx="1215" cy="1770" r="1.2" />
          <circle cx="190" cy="2160" r="1.6" />
          <circle cx="470" cy="2290" r="1.1" />
          <circle cx="760" cy="2115" r="1.3" />
          <circle cx="1120" cy="2250" r="1.2" />
          <circle cx="1360" cy="2070" r="1.0" />
        </g>

        {motionAllowed && (
          <>
            <g className="sa-comet sa-comet-one">
              <ellipse cx="-9" cy="0" rx="31" ry="18" fill="url(#sa-comet-halo)" />
              <path d="M -190 0 C -128 -5, -63 3, 0 0" stroke="url(#sa-comet-tail)" strokeWidth="2.2" strokeLinecap="round" fill="none" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="2.8" fill="#ffffff" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="1.25" fill="#08c9a6" />
              <animateMotion path="M -220 660 C 130 470, 330 775, 645 590 S 1115 390, 1640 190" dur="21s" begin="-8s" repeatCount="indefinite" rotate="auto" />
              <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.82;1" dur="21s" begin="-8s" repeatCount="indefinite" />
            </g>
            <g className="sa-comet sa-comet-two">
              <ellipse cx="-8" cy="0" rx="25" ry="14" fill="url(#sa-comet-halo)" />
              <path d="M -155 0 C -105 3, -48 -1, 0 0" stroke="url(#sa-comet-tail-soft)" strokeWidth="1.8" strokeLinecap="round" fill="none" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="2.2" fill="#ffffff" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="1" fill="#08c9a6" />
              <animateMotion path="M -180 1390 C 150 1190, 370 1305, 700 1125 S 1170 980, 1630 720" dur="29s" begin="-17s" repeatCount="indefinite" rotate="auto" />
              <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.12;0.82;1" dur="29s" begin="-17s" repeatCount="indefinite" />
            </g>
            <g className="sa-comet sa-comet-three">
              <ellipse cx="-8" cy="0" rx="22" ry="13" fill="url(#sa-comet-halo)" />
              <path d="M -140 0 C -93 -3, -42 1, 0 0" stroke="url(#sa-comet-tail)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <circle cx="0" cy="0" r="2" fill="#ffffff" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="0.9" fill="#08c9a6" />
              <animateMotion path="M -180 2160 C 155 1920, 505 2110, 845 1840 S 1280 1635, 1640 1440" dur="35s" begin="-25s" repeatCount="indefinite" rotate="auto" />
              <animate attributeName="opacity" values="0;0.64;0.64;0" keyTimes="0;0.1;0.82;1" dur="35s" begin="-25s" repeatCount="indefinite" />
            </g>
            <g className="sa-comet sa-comet-four">
              <ellipse cx="-7" cy="0" rx="20" ry="12" fill="url(#sa-comet-halo)" />
              <path d="M -155 0 C -102 -2, -47 2, 0 0" stroke="url(#sa-comet-tail-soft)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              <circle cx="0" cy="0" r="2" fill="#ffffff" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="0.9" fill="#08c9a6" />
              <animateMotion path="M 1640 355 C 1330 145, 1120 450, 805 385 S 250 250, -180 505" dur="26s" begin="-11s" repeatCount="indefinite" rotate="auto" />
              <animate attributeName="opacity" values="0;0.58;0.58;0" keyTimes="0;0.12;0.82;1" dur="26s" begin="-11s" repeatCount="indefinite" />
            </g>
            <g className="sa-comet sa-comet-five">
              <ellipse cx="-7" cy="0" rx="18" ry="10" fill="url(#sa-comet-halo)" />
              <path d="M -128 0 C -84 3, -40 -1, 0 0" stroke="url(#sa-comet-tail)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <circle cx="0" cy="0" r="1.9" fill="#ffffff" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="0.85" fill="#08c9a6" />
              <animateMotion path="M -180 920 C 180 1090, 420 840, 755 955 S 1270 1120, 1640 890" dur="24s" begin="-5s" repeatCount="indefinite" rotate="auto" />
              <animate attributeName="opacity" values="0;0.62;0.62;0" keyTimes="0;0.1;0.8;1" dur="24s" begin="-5s" repeatCount="indefinite" />
            </g>
            <g className="sa-comet sa-comet-six">
              <path d="M -135 0 C -88 -2, -39 2, 0 0" stroke="url(#sa-comet-tail-soft)" strokeWidth="1.35" strokeLinecap="round" fill="none" />
              <circle cx="0" cy="0" r="1.8" fill="#ffffff" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="0.8" fill="#08c9a6" />
              <animateMotion path="M 1640 1275 C 1310 1470, 1050 1210, 760 1350 S 245 1510, -180 1290" dur="31s" begin="-19s" repeatCount="indefinite" rotate="auto" />
              <animate attributeName="opacity" values="0;0.56;0.56;0" keyTimes="0;0.1;0.83;1" dur="31s" begin="-19s" repeatCount="indefinite" />
            </g>
            <g className="sa-comet sa-comet-seven">
              <ellipse cx="-6" cy="0" rx="20" ry="11" fill="url(#sa-comet-halo)" />
              <path d="M -145 0 C -96 1, -43 -2, 0 0" stroke="url(#sa-comet-tail)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <circle cx="0" cy="0" r="2" fill="#ffffff" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="0.9" fill="#08c9a6" />
              <animateMotion path="M -180 1685 C 165 1470, 465 1710, 770 1760 S 1270 1845, 1640 1620" dur="33s" begin="-9s" repeatCount="indefinite" rotate="auto" />
              <animate attributeName="opacity" values="0;0.67;0.67;0" keyTimes="0;0.12;0.82;1" dur="33s" begin="-9s" repeatCount="indefinite" />
            </g>
            <g className="sa-comet sa-comet-eight">
              <path d="M -125 0 C -80 2, -38 -1, 0 0" stroke="url(#sa-comet-tail-soft)" strokeWidth="1.25" strokeLinecap="round" fill="none" />
              <circle cx="0" cy="0" r="1.7" fill="#ffffff" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="0.8" fill="#08c9a6" />
              <animateMotion path="M 1640 1970 C 1305 2110, 980 1890, 650 2025 S 200 2175, -180 1980" dur="38s" begin="-27s" repeatCount="indefinite" rotate="auto" />
              <animate attributeName="opacity" values="0;0.5;0.5;0" keyTimes="0;0.1;0.8;1" dur="38s" begin="-27s" repeatCount="indefinite" />
            </g>
            <g className="sa-comet sa-comet-nine">
              <ellipse cx="-6" cy="0" rx="18" ry="10" fill="url(#sa-comet-halo)" />
              <path d="M -132 0 C -86 -2, -40 2, 0 0" stroke="url(#sa-comet-tail)" strokeWidth="1.35" strokeLinecap="round" fill="none" />
              <circle cx="0" cy="0" r="1.8" fill="#ffffff" filter="url(#sa-comet-glow)" />
              <circle cx="0" cy="0" r="0.85" fill="#08c9a6" />
              <animateMotion path="M -180 2300 C 210 2140, 535 2330, 865 2250 S 1290 2180, 1640 2350" dur="29s" begin="-15s" repeatCount="indefinite" rotate="auto" />
              <animate attributeName="opacity" values="0;0.6;0.6;0" keyTimes="0;0.1;0.82;1" dur="29s" begin="-15s" repeatCount="indefinite" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
