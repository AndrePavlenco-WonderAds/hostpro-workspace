"use client";

import { useEffect, useRef } from "react";

// Realistic 3D earth for the report hero, recreated with Canvas 2D — NOT WebGL
// (which rendered black in some browsers). We orthographically project a NASA
// night-lights texture onto a sphere, so real continents and city lights show,
// with an atmosphere glow and the property marker pinned to its coordinates.
//
// The view is centred a little south/east of the property so the location sits
// in the upper hemisphere with Europe/Africa framed around it, like the
// reference. A CSS sphere sits behind the canvas as a fallback if the texture
// can't load — the globe is never blank.

const BACKING = 720; // canvas backing resolution (square)
const R_FRAC = 0.46; // sphere radius as a fraction of the container half-size
const TEX_W = 1024;
const TEX_H = 512;

function rad(d: number): number {
  return (d * Math.PI) / 180;
}

export function ReportGlobe({
  lat,
  lng,
  place,
}: {
  lat: number;
  lng: number;
  place: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // View centre — pull down/west so the property frames upper-centre.
  const cLat = lat - 20;
  const cLon = lng - 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/earth-night.jpg";

    img.onload = () => {
      if (cancelled) return;

      // Sample the texture from a downscaled offscreen canvas.
      const off = document.createElement("canvas");
      off.width = TEX_W;
      off.height = TEX_H;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.drawImage(img, 0, 0, TEX_W, TEX_H);
      const tex = octx.getImageData(0, 0, TEX_W, TEX_H).data;

      const size = BACKING;
      canvas.width = size;
      canvas.height = size;
      const out = ctx.createImageData(size, size);
      const data = out.data;

      const cx = size / 2;
      const cy = size / 2;
      const Rp = size * R_FRAC;
      const sinP0 = Math.sin(rad(cLat));
      const cosP0 = Math.cos(rad(cLat));
      const lon0 = rad(cLon);

      for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
          const X = (px - cx) / Rp; // right +
          const Y = -(py - cy) / Rp; // up +
          const rho = Math.sqrt(X * X + Y * Y);
          const di = (py * size + px) * 4;

          if (rho > 1) {
            data[di + 3] = 0; // space → transparent (dark hero shows through)
            continue;
          }

          const c = Math.asin(rho);
          const sinC = Math.sin(c);
          const cosC = Math.cos(c);

          const phi =
            rho === 0 ? rad(cLat) : Math.asin(cosC * sinP0 + (Y * sinC * cosP0) / rho);
          const lam =
            lon0 + Math.atan2(X * sinC, rho * cosC * cosP0 - Y * sinC * sinP0);

          // Texture lookup (wrap longitude).
          const u = (((lam / Math.PI) * 0.5 + 0.5) % 1 + 1) % 1;
          const v = 0.5 - phi / Math.PI;
          const tx = Math.min(TEX_W - 1, (u * TEX_W) | 0);
          const ty = Math.min(TEX_H - 1, (v * TEX_H) | 0);
          const ti = (ty * TEX_W + tx) * 4;

          // Limb darkening + gentle cool lift so the sphere reads as 3D.
          const shade = 0.42 + 0.58 * Math.sqrt(1 - rho * rho);
          data[di] = Math.min(255, tex[ti] * shade * 1.05);
          data[di + 1] = Math.min(255, tex[ti + 1] * shade * 1.08 + 4);
          data[di + 2] = Math.min(255, tex[ti + 2] * shade * 1.2 + 12);
          // Feather the rim to avoid jaggies.
          data[di + 3] = rho > 0.99 ? 255 * (1 - (rho - 0.99) / 0.01) : 255;
        }
      }
      ctx.putImageData(out, 0, 0);
    };

    return () => {
      cancelled = true;
    };
  }, [cLat, cLon]);

  // Marker position (forward orthographic) as container percentages.
  const dLon = rad(lng - cLon);
  const p = rad(lat);
  const p0 = rad(cLat);
  const mX = Math.cos(p) * Math.sin(dLon);
  const mY = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dLon);
  const markerLeft = 50 + mX * R_FRAC * 100;
  const markerTop = 50 - mY * R_FRAC * 100;
  const labelRight = markerLeft < 62;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      {/* Fallback dark sphere (shows if the texture fails). */}
      <div
        aria-hidden
        className="absolute rounded-full"
        style={{
          inset: "4%",
          background: "radial-gradient(circle at 40% 34%, #24425f, #12263a 55%, #081420 100%)",
        }}
      />
      {/* Atmosphere glow ring. */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: "4%",
          boxShadow:
            "0 0 1px 1px rgba(120,200,240,0.55), 0 0 34px 6px rgba(0,181,226,0.35), inset 0 0 46px rgba(0,0,0,0.55)",
        }}
      />
      <canvas
        ref={canvasRef}
        width={BACKING}
        height={BACKING}
        className="relative h-full w-full"
        aria-label={`Localização: ${place}`}
      />

      {/* Marker + label */}
      <div
        className="pointer-events-none absolute"
        style={{ left: `${markerLeft}%`, top: `${markerTop}%`, transform: "translate(-50%,-50%)" }}
      >
        <span className="relative flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-60" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-brand-cyan ring-2 ring-white" />
        </span>
      </div>
      <div
        className="pointer-events-none absolute"
        style={{
          left: `${markerLeft}%`,
          top: `${markerTop}%`,
          transform: `translate(${labelRight ? "16px" : "calc(-100% - 16px)"}, -50%)`,
        }}
      >
        <span
          className="whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-semibold text-white backdrop-blur"
          style={{ background: "rgba(8,20,32,0.72)", border: "1px solid rgba(0,181,226,0.6)" }}
        >
          {place}
        </span>
      </div>
    </div>
  );
}
