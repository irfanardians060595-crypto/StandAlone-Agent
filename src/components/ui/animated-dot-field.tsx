"use client";

import { useEffect, useRef } from "react";

/**
 * Procedural, monochrome halftone field.
 * Dots deform along two slow-moving wave bands; a nearby pointer subtly brightens them.
 * The canvas is decorative only and never intercepts clicks or keyboard input.
 */
export function AnimatedDotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let scale = 1;
    let animationFrame = 0;
    let lastPaint = 0;
    let pointerX = -10000;
    let pointerY = -10000;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frameInterval = 1000 / 30;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      scale = Math.min(window.devicePixelRatio || 1, 1.4);
      canvas.width = Math.max(1, Math.floor(width * scale));
      canvas.height = Math.max(1, Math.floor(height * scale));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      paint(performance.now());
    };

    const paint = (time: number) => {
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);

      const step = width < 640 ? 16 : width < 1200 ? 14 : 13;
      const phase = time * 0.00034;
      const pointerReach = Math.min(width, height) * 0.22;

      for (let x = step * 0.5; x < width + step; x += step) {
        const xRatio = x / Math.max(width, 1);
        const edgeWeight = 0.34 + Math.pow(Math.abs(xRatio - 0.5) * 2, 1.25) * 0.62;
        const waveA = height * (
          0.51 + Math.sin(x * 0.0062 + phase) * 0.105 + Math.sin(x * 0.012 - phase * 1.7) * 0.024
        );
        const waveB = height * (
          0.70 + Math.sin(x * 0.0038 - phase * 0.8 + 1.4) * 0.09 + Math.cos(x * 0.009 + phase) * 0.022
        );

        for (let y = step * 0.5; y < height + step; y += step) {
          const displacement = Math.sin(y * 0.0038 + phase) * 3.5 + Math.cos(x * 0.005 - phase) * 2.2;
          const warpedY = y + displacement;
          const bandA = Math.exp(-Math.pow((warpedY - waveA) / Math.max(height * 0.145, 1), 2) * 1.65) * 0.62;
          const bandB = Math.exp(-Math.pow((warpedY - waveB) / Math.max(height * 0.135, 1), 2) * 1.65) * 0.36;
          const distanceToPointer = Math.hypot(x - pointerX, y - pointerY);
          const pointerBoost = distanceToPointer < pointerReach
            ? (1 - distanceToPointer / pointerReach) * 0.2
            : 0;
          const intensity = Math.min(0.84, (Math.max(bandA, bandB) + pointerBoost) * edgeWeight);
          if (intensity < 0.035) continue;

          const radius = 0.45 + intensity * 1.2;
          context.fillStyle = `rgba(255,255,255,${Math.min(0.74, intensity * 0.73)})`;
          context.beginPath();
          context.arc(x, y + displacement, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    const animate = (time: number) => {
      if (time - lastPaint >= frameInterval) {
        paint(time);
        lastPaint = time;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };
    const onPointerLeave = () => {
      pointerX = -10000;
      pointerY = -10000;
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    if (!prefersReducedMotion) animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="sa-animated-dot-field" />;
}
