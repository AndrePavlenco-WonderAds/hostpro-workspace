"use client";

import { useEffect, useRef } from "react";

// Hero globe — a genuinely 3D-lit Earth rendered with Canvas 2D (no WebGL,
// which rendered black in some browsers). The realism comes from a directional
// light: every pixel's surface normal is dotted with a light vector, giving a
// bright lit limb (upper-left), a soft terminator into shadow (lower-right), a
// fresnel atmosphere rim and a sun glint. A latitude/longitude graticule and a
// glowing cyan crosshair intersect exactly on the property, and a glass data
// card sits beside the marker.

export type GlobeStats = {
  platform: string;
  name: string;
  score: number;
  scoreColor: string;
  band: string;
  strengths: number;
  fails: number;
  criticals: number;
};

const BACKING = 800;
const R_FRAC = 0.42; // sphere radius vs container half-size (leaves room for atmosphere)
const ATMO = 0.16; // atmosphere thickness beyond the sphere (fraction of R)
const TEX_W = 1024;
const TEX_H = 512;

// Light direction (view space): upper-left, tilted toward the viewer.
const LX = -0.6;
const LY = 0.55;
const LZ = 0.58;

function rad(d: number): number {
  return (d * Math.PI) / 180;
}

export function ReportGlobe({
  lat,
  lng,
  place,
  stats,
}: {
  lat: number;
  lng: number;
  place: string;
  stats: GlobeStats;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // View centre — east + south of the property so Portugal frames upper-left
  // and the data card has room to its right.
  const cLat = lat - 14;
  const cLon = lng + 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sinP0 = Math.sin(rad(cLat));
    const cosP0 = Math.cos(rad(cLat));
    const lon0 = rad(cLon);
    const cx = BACKING / 2;
    const cy = BACKING / 2;
    const Rp = BACKING * R_FRAC;

    const projF = (latD: number, lonD: number) => {
      const pp = rad(latD);
      const dl = rad(lonD) - lon0;
      const cosc = sinP0 * Math.sin(pp) + cosP0 * Math.cos(pp) * Math.cos(dl);
      const X = Math.cos(pp) * Math.sin(dl);
      const Y = cosP0 * Math.sin(pp) - sinP0 * Math.cos(pp) * Math.cos(dl);
      return { x: cx + X * Rp, y: cy - Y * Rp, front: cosc >= 0 };
    };

    const drawGraticule = () => {
      const stroke = (
        pts: Array<[number, number]>,
        color: string,
        width: number,
        glow = 0,
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.shadowBlur = glow;
        ctx.shadowColor = glow ? "rgba(0,181,226,0.9)" : "transparent";
        ctx.beginPath();
        let started = false;
        for (const [la, lo] of pts) {
          const q = projF(la, lo);
          if (q.front) {
            if (!started) {
              ctx.moveTo(q.x, q.y);
              started = true;
            } else ctx.lineTo(q.x, q.y);
          } else started = false;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      for (let lo = -180; lo < 180; lo += 15) {
        const pts: Array<[number, number]> = [];
        for (let la = -85; la <= 85; la += 2) pts.push([la, lo]);
        stroke(pts, "rgba(150,205,235,0.16)", 1);
      }
      for (let la = -75; la <= 75; la += 15) {
        const pts: Array<[number, number]> = [];
        for (let lo = -180; lo <= 180; lo += 2) pts.push([la, lo]);
        stroke(pts, "rgba(150,205,235,0.16)", 1);
      }
      // Emphasised crosshair through the property (glowing).
      const mer: Array<[number, number]> = [];
      for (let la = -88; la <= 88; la += 2) mer.push([la, lng]);
      stroke(mer, "rgba(120,225,255,0.95)", 1.8, 10);
      const par: Array<[number, number]> = [];
      for (let lo = -180; lo <= 180; lo += 2) par.push([lat, lo]);
      stroke(par, "rgba(120,225,255,0.95)", 1.8, 10);
    };

    const renderSphere = (tex: Uint8ClampedArray | null) => {
      canvas.width = BACKING;
      canvas.height = BACKING;
      const out = ctx.createImageData(BACKING, BACKING);
      const data = out.data;
      const atmoOuter = 1 + ATMO;

      for (let py = 0; py < BACKING; py++) {
        for (let px = 0; px < BACKING; px++) {
          const X = (px - cx) / Rp;
          const Y = -(py - cy) / Rp;
          const rho = Math.hypot(X, Y);
          const di = (py * BACKING + px) * 4;

          if (rho <= 1) {
            const Z = Math.sqrt(1 - rho * rho);
            const ndotl = Math.max(0, X * LX + Y * LY + Z * LZ);

            let r: number, g: number, b: number;
            if (tex) {
              // Inverse orthographic → (lat, lon) → texture sample.
              const c = Math.asin(rho);
              const sinC = Math.sin(c);
              const cosC = Math.cos(c);
              const latR =
                rho === 0 ? rad(cLat) : Math.asin(cosC * sinP0 + (Y * sinC * cosP0) / rho);
              const lam = lon0 + Math.atan2(X * sinC, rho * cosC * cosP0 - Y * sinC * sinP0);
              const u = ((((lam / Math.PI) * 0.5 + 0.5) % 1) + 1) % 1;
              const v = 0.5 - latR / Math.PI;
              const tx = Math.min(TEX_W - 1, (u * TEX_W) | 0);
              const ty = Math.min(TEX_H - 1, (v * TEX_H) | 0);
              const ti = (ty * TEX_W + tx) * 4;
              r = tex[ti];
              g = tex[ti + 1];
              b = tex[ti + 2];
            } else {
              // Fallback ocean tint when texture is missing.
              r = 26;
              g = 58;
              b = 86;
            }

            const light = 0.26 + 1.05 * ndotl;
            const fres = Math.pow(1 - Z, 2.6) * (0.35 + 0.65 * ndotl);
            const spec = Math.pow(ndotl, 34) * 0.6;

            data[di] = Math.min(255, r * light + fres * 60 + spec * 230);
            data[di + 1] = Math.min(255, g * light + fres * 150 + spec * 240);
            data[di + 2] = Math.min(255, b * light + fres * 220 + spec * 255);
            data[di + 3] = rho > 0.992 ? 255 * (1 - (rho - 0.992) / 0.008) : 255;
          } else if (rho <= atmoOuter) {
            // Atmospheric halo — brighter on the lit limb.
            const ox = X / rho;
            const oy = Y / rho;
            const lit = 0.35 + 0.65 * Math.max(0, ox * LX + oy * LY);
            const t = (rho - 1) / ATMO;
            const a = Math.pow(1 - t, 1.8) * lit;
            data[di] = 90;
            data[di + 1] = 200;
            data[di + 2] = 240;
            data[di + 3] = Math.min(255, a * 235);
          } else {
            data[di + 3] = 0;
          }
        }
      }
      ctx.putImageData(out, 0, 0);
      if (tex) drawGraticule();
    };

    let cancelled = false;
    const img = new Image();
    img.src = "/earth-day.jpg";
    img.onload = () => {
      if (cancelled) return;
      const off = document.createElement("canvas");
      off.width = TEX_W;
      off.height = TEX_H;
      const octx = off.getContext("2d");
      if (!octx) return renderSphere(null);
      octx.drawImage(img, 0, 0, TEX_W, TEX_H);
      renderSphere(octx.getImageData(0, 0, TEX_W, TEX_H).data);
    };
    img.onerror = () => {
      if (!cancelled) renderSphere(null);
    };

    return () => {
      cancelled = true;
    };
  }, [cLat, cLon, lat, lng]);

  // Marker position as container percentages (same projection).
  const dLon = rad(lng - cLon);
  const p = rad(lat);
  const p0 = rad(cLat);
  const mX = Math.cos(p) * Math.sin(dLon);
  const mY = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dLon);
  const markerLeft = 50 + mX * R_FRAC * 100;
  const markerTop = 50 - mY * R_FRAC * 100;

  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:max-w-[540px]">
      {/* Ambient space glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 40% 36%, rgba(0,181,226,0.28), transparent 62%)" }}
      />
      {/* Twinkling stars */}
      <div
        aria-hidden
        className="animate-twinkle pointer-events-none absolute -inset-8"
        style={{
          backgroundImage:
            "radial-gradient(1.2px 1.2px at 12% 22%, #fff, transparent), radial-gradient(1px 1px at 82% 16%, #cfefff, transparent), radial-gradient(1px 1px at 68% 82%, #fff, transparent), radial-gradient(1.4px 1.4px at 24% 74%, #bfe6ff, transparent), radial-gradient(1px 1px at 90% 60%, #fff, transparent), radial-gradient(1px 1px at 46% 8%, #fff, transparent)",
        }}
      />

      <div className="animate-float relative mx-auto aspect-square w-full">
        {/* Fallback lit sphere (shows only if the texture fails to load) */}
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: "8%",
            background: "radial-gradient(circle at 32% 30%, #3a6a92, #1a3a56 46%, #08182a 100%)",
          }}
        />
        <canvas
          ref={canvasRef}
          width={BACKING}
          height={BACKING}
          className="relative h-full w-full"
          aria-label={`Localização: ${place}`}
        />

        {/* Marker */}
        <div
          className="pointer-events-none absolute"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%`, transform: "translate(-50%,-50%)" }}
        >
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-60" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-brand-cyan ring-[3px] ring-white shadow-[0_0_12px_rgba(0,181,226,0.9)]" />
          </span>
        </div>

        {/* Data card — floats beside the marker on large screens */}
        <div
          className="pointer-events-none absolute hidden lg:block"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%`, transform: "translate(24px,-50%)" }}
        >
          <GlobeCard place={place} stats={stats} />
        </div>
      </div>

      {/* Data card — below the globe on small screens */}
      <div className="mt-4 flex justify-center lg:hidden">
        <GlobeCard place={place} stats={stats} />
      </div>
    </div>
  );
}

function GlobeCard({ place, stats }: { place: string; stats: GlobeStats }) {
  return (
    <div
      className="w-[248px] overflow-hidden rounded-2xl border p-4 backdrop-blur-md"
      style={{
        background: "linear-gradient(160deg, rgba(20,32,48,0.94), rgba(10,20,32,0.94))",
        borderColor: "rgba(0,181,226,0.4)",
        boxShadow: "0 24px 60px -22px rgba(0,0,0,0.85)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "rgba(0,181,226,0.16)", border: "1px solid rgba(0,181,226,0.4)" }}
        >
          <HomeIcon />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-white">{stats.name}</p>
          <p className="truncate text-[10px] uppercase tracking-[0.14em] text-white/45">
            {stats.platform} · {place}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-end gap-2 border-t border-white/10 pt-3">
        <span className="text-4xl font-extrabold leading-none tabular-nums" style={{ color: stats.scoreColor }}>
          {stats.score}
        </span>
        <span className="pb-0.5 text-xs font-semibold text-white/50">/ 100</span>
        <span
          className="mb-0.5 ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ color: stats.scoreColor, background: `${stats.scoreColor}22`, border: `1px solid ${stats.scoreColor}55` }}
        >
          {stats.band}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        <MetricRow label="Pontos fortes" value={stats.strengths} color="#4ade80" />
        <MetricRow label="A melhorar" value={stats.fails} color="#00B5E2" />
        {stats.criticals > 0 && <MetricRow label="Críticos" value={stats.criticals} color="#f87171" />}
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-white/60">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="mt-1 h-[3px] w-full rounded-full" style={{ background: `${color}55` }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value * 12 + 12)}%`, background: color }} />
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 11 12 4l9 7M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9"
        stroke="#00B5E2"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
