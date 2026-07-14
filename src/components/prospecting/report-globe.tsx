"use client";

import { useEffect, useRef } from "react";

// Hero globe — a high-detail, genuinely 3D Earth rendered with Canvas 2D (no
// WebGL, which rendered black in some browsers). Three NASA textures are
// blended per pixel: the DAY map on the sunlit side, NIGHT city-lights on the
// dark side (blended across the terminator), and CLOUDS on top. A directional
// light gives the lit limb / shadow terminator / fresnel rim / sun glint that
// make it read as a real sphere. A dotted graticule and a glowing dashed
// crosshair intersect on the property, where a heart-beat marker pulses beside
// a glass data card.

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

const BACKING = 1024; // HD backing resolution
const R_FRAC = 0.47; // sphere radius vs container half-size (a touch more zoom)
const ATMO = 0.08;
const TEX_W = 2048;
const TEX_H = 1024;

// Light direction (view space): upper-left, tilted toward the viewer.
const LX = -0.58;
const LY = 0.5;
const LZ = 0.64;

function rad(d: number): number {
  return (d * Math.PI) / 180;
}
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
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

  // View centre — a little south/east of the property so the country sits
  // large near the middle with room for the card on the right.
  const cLat = lat - 6;
  const cLon = lng + 3;

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
        dash: number[],
        glow = 0,
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash(dash);
        ctx.shadowBlur = glow;
        ctx.shadowColor = glow ? "rgba(80,220,255,0.95)" : "transparent";
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
        ctx.setLineDash([]);
      };

      for (let lo = -180; lo < 180; lo += 15) {
        const pts: Array<[number, number]> = [];
        for (let la = -85; la <= 85; la += 2) pts.push([la, lo]);
        stroke(pts, "rgba(160,210,240,0.22)", 1.1, [1.5, 7]);
      }
      for (let la = -75; la <= 75; la += 15) {
        const pts: Array<[number, number]> = [];
        for (let lo = -180; lo <= 180; lo += 2) pts.push([la, lo]);
        stroke(pts, "rgba(160,210,240,0.22)", 1.1, [1.5, 7]);
      }
      // Emphasised dashed crosshair through the property (glowing).
      const mer: Array<[number, number]> = [];
      for (let la = -88; la <= 88; la += 2) mer.push([la, lng]);
      stroke(mer, "rgba(120,230,255,0.95)", 2, [7, 6], 12);
      const par: Array<[number, number]> = [];
      for (let lo = -180; lo <= 180; lo += 2) par.push([lat, lo]);
      stroke(par, "rgba(120,230,255,0.95)", 2, [7, 6], 12);
    };

    const toData = (img: HTMLImageElement): Uint8ClampedArray | null => {
      if (!img.complete || !img.naturalWidth) return null;
      const off = document.createElement("canvas");
      off.width = TEX_W;
      off.height = TEX_H;
      const o = off.getContext("2d");
      if (!o) return null;
      o.drawImage(img, 0, 0, TEX_W, TEX_H);
      return o.getImageData(0, 0, TEX_W, TEX_H).data;
    };

    const render = (day: Uint8ClampedArray | null, night: Uint8ClampedArray | null, clouds: Uint8ClampedArray | null) => {
      canvas.width = BACKING;
      canvas.height = BACKING;
      const out = ctx.createImageData(BACKING, BACKING);
      const data = out.data;
      const atmoOuter = 1 + ATMO;
      const bands = 8;
      let band = 0;

      const sample = (tex: Uint8ClampedArray, u: number, v: number, i = 0) => {
        const tx = Math.min(TEX_W - 1, (u * TEX_W) | 0);
        const ty = Math.min(TEX_H - 1, (v * TEX_H) | 0);
        return tex[(ty * TEX_W + tx) * 4 + i];
      };

      const step = () => {
        if (cancelled) return;
        const y0 = Math.floor((band * BACKING) / bands);
        const y1 = Math.floor(((band + 1) * BACKING) / bands);
        for (let py = y0; py < y1; py++) {
          for (let px = 0; px < BACKING; px++) {
            const X = (px - cx) / Rp;
            const Y = -(py - cy) / Rp;
            const rho = Math.hypot(X, Y);
            const di = (py * BACKING + px) * 4;

            if (rho <= 1) {
              const Z = Math.sqrt(1 - rho * rho);
              const ndotl = X * LX + Y * LY + Z * LZ;
              const dayAmt = smoothstep(-0.08, 0.32, ndotl);
              const litD = Math.max(0, ndotl);

              const c = Math.asin(rho);
              const sinC = Math.sin(c);
              const cosC = Math.cos(c);
              const latR = rho === 0 ? rad(cLat) : Math.asin(cosC * sinP0 + (Y * sinC * cosP0) / rho);
              const lam = lon0 + Math.atan2(X * sinC, rho * cosC * cosP0 - Y * sinC * sinP0);
              const u = ((((lam / Math.PI) * 0.5 + 0.5) % 1) + 1) % 1;
              const v = 0.5 - latR / Math.PI;

              let r: number, g: number, b: number;
              if (day) {
                const dl = 0.32 + 1.02 * litD;
                const dr = sample(day, u, v, 0) * dl;
                const dg = sample(day, u, v, 1) * dl;
                const db = sample(day, u, v, 2) * dl;
                if (night) {
                  // City lights glow on the dark side; faint blue ocean ambient.
                  const nr = sample(night, u, v, 0) * 1.25 + 5;
                  const ng = sample(night, u, v, 1) * 1.2 + 9;
                  const nb = sample(night, u, v, 2) * 1.1 + 16;
                  r = nr + (dr - nr) * dayAmt;
                  g = ng + (dg - ng) * dayAmt;
                  b = nb + (db - nb) * dayAmt;
                } else {
                  r = dr;
                  g = dg;
                  b = db;
                }
              } else {
                r = 22;
                g = 52;
                b = 82;
              }

              // Clouds — lit, mostly on the day side, faint at night.
              if (clouds) {
                const cv = sample(clouds, u, v, 0) / 255;
                const cover = cv * (0.22 + 0.78 * dayAmt);
                const litCloud = 235 * (0.3 + 0.85 * litD);
                r = r * (1 - cover) + litCloud * cover;
                g = g * (1 - cover) + litCloud * cover;
                b = b * (1 - cover) + litCloud * cover;
              }

              // Fresnel atmosphere rim + specular sun-glint.
              const fres = Math.pow(1 - Z, 2.6) * (0.3 + 0.7 * Math.max(0, ndotl));
              const spec = Math.pow(Math.max(0, ndotl), 40) * 0.5;
              data[di] = Math.min(255, r + fres * 55 + spec * 220);
              data[di + 1] = Math.min(255, g + fres * 150 + spec * 235);
              data[di + 2] = Math.min(255, b + fres * 225 + spec * 255);
              data[di + 3] = rho > 0.993 ? 255 * (1 - (rho - 0.993) / 0.007) : 255;
            } else if (rho <= atmoOuter) {
              const ox = X / rho;
              const oy = Y / rho;
              const lit = 0.32 + 0.68 * Math.max(0, ox * LX + oy * LY);
              const t = (rho - 1) / ATMO;
              const a = Math.pow(1 - t, 1.7) * lit;
              data[di] = 90;
              data[di + 1] = 200;
              data[di + 2] = 240;
              data[di + 3] = Math.min(255, a * 235);
            } else {
              data[di + 3] = 0;
            }
          }
        }
        band++;
        if (band < bands) requestAnimationFrame(step);
        else {
          ctx.putImageData(out, 0, 0);
          if (day) drawGraticule();
        }
      };
      requestAnimationFrame(step);
    };

    let cancelled = false;
    const day = new Image();
    const night = new Image();
    const clouds = new Image();
    let pending = 3;
    const done = () => {
      if (--pending > 0 || cancelled) return;
      render(toData(day), toData(night), toData(clouds));
    };
    for (const im of [day, night, clouds]) {
      im.onload = done;
      im.onerror = done;
    }
    day.src = "/earth-day.jpg";
    night.src = "/earth-night.jpg";
    clouds.src = "/earth-clouds.jpg";

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
    <div className="relative mx-auto w-full max-w-[440px] lg:max-w-[560px]">
      {/* Twinkling stars close to the globe */}
      <div
        aria-hidden
        className="animate-twinkle pointer-events-none absolute -inset-8"
        style={{
          backgroundImage:
            "radial-gradient(1.2px 1.2px at 14% 22%, #fff, transparent), radial-gradient(1px 1px at 82% 16%, #cfefff, transparent), radial-gradient(1px 1px at 68% 82%, #fff, transparent), radial-gradient(1.4px 1.4px at 24% 74%, #bfe6ff, transparent), radial-gradient(1px 1px at 90% 60%, #fff, transparent)",
        }}
      />

      <div className="animate-float relative mx-auto aspect-square w-full">
        {/* Fallback lit sphere (only shows if textures fail to load) */}
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{ inset: "5%", background: "radial-gradient(circle at 34% 30%, #35648c, #163650 46%, #08182a 100%)" }}
        />
        <canvas
          ref={canvasRef}
          width={BACKING}
          height={BACKING}
          className="relative h-full w-full"
          aria-label={`Localização: ${place}`}
        />

        {/* Heart-beat marker */}
        <div
          className="pointer-events-none absolute"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%`, transform: "translate(-50%,-50%)" }}
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="animate-heartbeat absolute h-4 w-4 rounded-full bg-brand-cyan" />
            <span className="relative h-3 w-3 rounded-full bg-brand-cyan ring-2 ring-white shadow-[0_0_14px_rgba(0,181,226,1)]" />
          </span>
        </div>

        {/* Data card — floats beside the marker on large screens */}
        <div
          className="pointer-events-none absolute hidden lg:block"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%`, transform: "translate(26px,-50%)" }}
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
