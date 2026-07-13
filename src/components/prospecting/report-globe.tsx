"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import type { COBEOptions } from "cobe";

// cobe's runtime still accepts `onRender` (per its README) but its shipped
// type definition omits it — extend the options type so TS is happy.
type GlobeOptions = COBEOptions & {
  onRender?: (state: Record<string, number>) => void;
};

// Interactive dotted globe for the report hero. Focuses on the property's
// location with a glowing cyan marker, breathes gently so the marker stays
// front-and-centre, and lets the reader drag to spin. A CSS sphere sits
// behind the canvas, so if WebGL is unavailable the reader still sees a
// tasteful globe with the location marker instead of a blank square.

const CYAN: [number, number, number] = [0 / 255, 181 / 255, 226 / 255];

/** Phi/theta that bring a lat/long to the front of the globe. */
function locationToAngles(lat: number, long: number): [number, number] {
  return [Math.PI - (long * Math.PI) / 180 - Math.PI / 2, (lat * Math.PI) / 180];
}

export function ReportGlobe({ lat, lng }: { lat: number; lng: number; place?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pointer-drag state.
  const pointerInteracting = useRef<number | null>(null);
  const pointerMovement = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const [focusPhi, focusTheta] = locationToAngles(lat, lng);
    let width = canvas.offsetWidth || 400;
    const onResize = () => {
      width = canvas.offsetWidth || width;
    };
    window.addEventListener("resize", onResize);

    let t = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      const options: GlobeOptions = {
        devicePixelRatio: 2,
        width: width * 2,
        height: width * 2,
        phi: focusPhi,
        theta: focusTheta,
        dark: 1,
        diffuse: 1.25,
        mapSamples: 18000,
        mapBrightness: 5.4,
        baseColor: [0.22, 0.32, 0.44],
        markerColor: CYAN,
        glowColor: [0.11, 0.18, 0.26],
        markers: [{ location: [lat, lng], size: 0.09 }],
        onRender: (state) => {
          // Manual drag wins; otherwise breathe around the focus point.
          if (pointerInteracting.current === null && !reduce) {
            t += 0.0045;
          }
          state.phi = focusPhi + pointerMovement.current + (reduce ? 0 : Math.sin(t) * 0.26);
          state.theta = focusTheta + (reduce ? 0 : Math.cos(t * 0.6) * 0.03);
          state.width = width * 2;
          state.height = width * 2;
        },
      };
      globe = createGlobe(canvas, options);
    } catch {
      // WebGL unavailable — the CSS sphere behind the canvas stays visible.
    }

    return () => {
      globe?.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [lat, lng]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* Ambient glow behind the sphere. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full blur-2xl"
        style={{ background: "radial-gradient(circle at 50% 45%, rgba(0,181,226,0.35), transparent 62%)" }}
      />
      {/* CSS sphere fallback — hidden behind the canvas when WebGL renders. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[6%] rounded-full"
        style={{
          background: "radial-gradient(circle at 38% 32%, #2c4a63, #1b2b3d 55%, #101a26 100%)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.55)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
        style={{ aspectRatio: "1" }}
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
            const delta = e.clientX - pointerInteracting.current;
            pointerMovement.current = delta / 200;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerMovement.current = delta / 100;
          }
        }}
      />
      {/* Marker halo pinned to the front-facing property location. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-cyan ring-2 ring-white/70" />
        </span>
      </div>
    </div>
  );
}
