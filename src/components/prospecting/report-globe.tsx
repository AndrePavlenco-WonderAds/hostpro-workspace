"use client";

import { useEffect, useRef } from "react";

// Starlink-style hero globe (à la wonder-ads): a bright DAYTIME earth projected
// onto a sphere with Canvas 2D (no WebGL — that rendered black in some
// browsers), a latitude/longitude graticule, and an emphasised cyan crosshair
// whose meridian + parallel intersect exactly on the property. A glass data
// card with the key audit figures sits beside the marker.

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

const BACKING = 760;
const R_FRAC = 0.62; // sphere radius vs container half — >0.5 zooms in / crops
const TEX_W = 1024;
const TEX_H = 512;

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

  // View centre — east + south of the property, so Portugal frames upper-left
  // and the data card has room on the right (like the reference).
  const cLat = lat - 10;
  const cLon = lng + 12;

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

    // Forward orthographic projection (used for the graticule + crosshair).
    const projF = (latD: number, lonD: number) => {
      const p = rad(latD);
      const dl = rad(lonD) - lon0;
      const cosc = sinP0 * Math.sin(p) + cosP0 * Math.cos(p) * Math.cos(dl);
      const X = Math.cos(p) * Math.sin(dl);
      const Y = cosP0 * Math.sin(p) - sinP0 * Math.cos(p) * Math.cos(dl);
      return { x: cx + X * Rp, y: cy - Y * Rp, front: cosc >= 0 };
    };

    const drawGraticule = () => {
      const line = (
        pts: Array<{ lat: number; lon: number }>,
        color: string,
        width: number,
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        let started = false;
        for (const { lat: la, lon: lo } of pts) {
          const q = projF(la, lo);
          if (q.front) {
            if (!started) {
              ctx.moveTo(q.x, q.y);
              started = true;
            } else ctx.lineTo(q.x, q.y);
          } else started = false;
        }
        ctx.stroke();
      };

      // Faint graticule every 15°.
      for (let lo = -180; lo < 180; lo += 15) {
        const pts = [];
        for (let la = -85; la <= 85; la += 2) pts.push({ lat: la, lon: lo });
        line(pts, "rgba(150,205,235,0.22)", 1);
      }
      for (let la = -75; la <= 75; la += 15) {
        const pts = [];
        for (let lo = -180; lo <= 180; lo += 2) pts.push({ lat: la, lon: lo });
        line(pts, "rgba(150,205,235,0.22)", 1);
      }

      // Emphasised crosshair through the property.
      const mer = [];
      for (let la = -85; la <= 85; la += 2) mer.push({ lat: la, lon: lng });
      line(mer, "rgba(0,181,226,0.85)", 2);
      const par = [];
      for (let lo = -180; lo <= 180; lo += 2) par.push({ lat, lon: lo });
      line(par, "rgba(0,181,226,0.85)", 2);
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
      if (!octx) return;
      octx.drawImage(img, 0, 0, TEX_W, TEX_H);
      const tex = octx.getImageData(0, 0, TEX_W, TEX_H).data;

      canvas.width = BACKING;
      canvas.height = BACKING;
      const out = ctx.createImageData(BACKING, BACKING);
      const data = out.data;

      for (let py = 0; py < BACKING; py++) {
        for (let px = 0; px < BACKING; px++) {
          const X = (px - cx) / Rp;
          const Y = -(py - cy) / Rp;
          const rho = Math.sqrt(X * X + Y * Y);
          const di = (py * BACKING + px) * 4;
          if (rho > 1) {
            data[di + 3] = 0;
            continue;
          }
          const c = Math.asin(rho);
          const sinC = Math.sin(c);
          const cosC = Math.cos(c);
          const phi =
            rho === 0 ? rad(cLat) : Math.asin(cosC * sinP0 + (Y * sinC * cosP0) / rho);
          const lam = lon0 + Math.atan2(X * sinC, rho * cosC * cosP0 - Y * sinC * sinP0);
          const u = ((((lam / Math.PI) * 0.5 + 0.5) % 1) + 1) % 1;
          const v = 0.5 - phi / Math.PI;
          const tx = Math.min(TEX_W - 1, (u * TEX_W) | 0);
          const ty = Math.min(TEX_H - 1, (v * TEX_H) | 0);
          const ti = (ty * TEX_W + tx) * 4;
          // Keep it bright (day earth), soft limb darkening + a cool rim.
          const shade = 0.72 + 0.28 * Math.sqrt(1 - rho * rho);
          const rim = rho > 0.85 ? (rho - 0.85) / 0.15 : 0;
          data[di] = Math.min(255, tex[ti] * shade + rim * 20);
          data[di + 1] = Math.min(255, tex[ti + 1] * shade + rim * 55);
          data[di + 2] = Math.min(255, tex[ti + 2] * shade + rim * 90);
          data[di + 3] = rho > 0.99 ? 255 * (1 - (rho - 0.99) / 0.01) : 255;
        }
      }
      ctx.putImageData(out, 0, 0);
      drawGraticule();
    };

    return () => {
      cancelled = true;
    };
  }, [cLat, cLon, lat, lng]);

  // Marker position as container percentages.
  const dLon = rad(lng - cLon);
  const p = rad(lat);
  const p0 = rad(cLat);
  const mX = Math.cos(p) * Math.sin(dLon);
  const mY = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dLon);
  const markerLeft = 50 + mX * R_FRAC * 100;
  const markerTop = 50 - mY * R_FRAC * 100;

  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
      <div className="relative mx-auto aspect-square w-full max-w-[440px]">
        {/* Space fallback + atmosphere */}
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: "6%",
            background: "radial-gradient(circle at 42% 36%, #35638a, #16324a 55%, #0a1826 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: "6%",
            boxShadow:
              "0 0 2px 1px rgba(150,215,245,0.6), 0 0 44px 8px rgba(0,181,226,0.4), inset 0 0 40px rgba(0,0,0,0.4)",
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
            <span className="relative inline-flex h-4 w-4 rounded-full bg-brand-cyan ring-[3px] ring-white" />
          </span>
        </div>

        {/* Data card — floats beside the marker on large screens */}
        <div
          className="pointer-events-none absolute hidden lg:block"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%`, transform: "translate(22px,-50%)" }}
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
        background: "linear-gradient(160deg, rgba(20,32,48,0.92), rgba(10,20,32,0.92))",
        borderColor: "rgba(0,181,226,0.4)",
        boxShadow: "0 20px 50px -20px rgba(0,0,0,0.8)",
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
