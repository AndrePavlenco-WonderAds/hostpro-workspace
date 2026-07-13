"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import type { COBEOptions } from "cobe";

// cobe's runtime still accepts `onRender` (per its README) but its shipped
// type definition omits it — extend the options type so TS is happy.
type GlobeOptions = COBEOptions & {
  onRender?: (state: Record<string, number>) => void;
};

// Interactive dotted globe for the report hero. Focus-locked on the property's
// location with a glowing cyan marker front-and-centre; breathes gently and is
// draggable. Bright steel-blue continents so the sphere is clearly visible on
// the dark hero (earlier navy dots were too dark and read as a black ball).

const MARKER: [number, number, number] = [0.05, 0.75, 1]; // cyan

export function ReportGlobe({ lat, lng }: { lat: number; lng: number; place?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerMovement = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Bring the property longitude to the front; hold a fixed tilt that keeps
    // northern-Portugal latitudes near the vertical centre.
    const focusPhi = Math.PI - (lng * Math.PI) / 180 + Math.PI / 2;
    const baseTheta = 0.42;

    let width = canvas.offsetWidth || 460;
    const measure = () => {
      width = canvas.offsetWidth || width;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);

    let t = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      const options: GlobeOptions = {
        devicePixelRatio: 2,
        width: width * 2,
        height: width * 2,
        phi: focusPhi,
        theta: baseTheta,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 20000,
        mapBrightness: 7,
        baseColor: [0.52, 0.65, 0.8],
        markerColor: MARKER,
        glowColor: [0.13, 0.22, 0.33],
        markers: [{ location: [lat, lng], size: 0.1 }],
        onRender: (state) => {
          if (pointerInteracting.current === null && !reduce) {
            t += 0.004;
          }
          state.phi = focusPhi + pointerMovement.current + (reduce ? 0 : Math.sin(t) * 0.22);
          state.theta = baseTheta;
          state.width = width * 2;
          state.height = width * 2;
        },
      };
      globe = createGlobe(canvas, options);
    } catch {
      // WebGL unavailable — the ambient glow still frames the hero.
    }

    return () => {
      globe?.destroy();
      ro.disconnect();
    };
  }, [lat, lng]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[500px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 50% 45%, rgba(0,181,226,0.4), transparent 60%)" }}
      />
      <canvas
        ref={canvasRef}
        className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
        style={{ aspectRatio: "1", contain: "layout paint size" }}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerMovement.current * 200;
          e.currentTarget.style.cursor = "grabbing";
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            pointerMovement.current = (e.clientX - pointerInteracting.current) / 200;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            pointerMovement.current = (e.touches[0].clientX - pointerInteracting.current) / 100;
          }
        }}
      />
    </div>
  );
}
