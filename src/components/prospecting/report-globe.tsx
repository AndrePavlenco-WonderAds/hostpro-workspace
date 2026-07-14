"use client";

import { useEffect, useRef } from "react";

// Hero globe — a high-detail, genuinely 3D Earth rendered with Canvas 2D (no
// WebGL, which rendered black in some browsers). Three NASA textures (4K day,
// 4K night city-lights, clouds) are blended per pixel across the terminator
// with BILINEAR sampling and a high backing resolution, so it stays crisp when
// zoomed onto the country. A directional light gives the lit limb / shadow /
// fresnel rim / sun glint. A dotted graticule and a glowing dashed crosshair
// intersect on the property, where a heart-beat marker pulses beside a card.

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

type Tex = { data: Uint8ClampedArray; w: number; h: number };

const BACKING = 1400; // high backing resolution → crisp on retina + zoom
const R_FRAC = 0.48;
const ATMO = 0.05;
const BANDS = 16;

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

  // View centre — a little south/east of the property so the country sits large
  // near the middle with room for the card on the right.
  const cLat = lat - 6;
  const cLon = lng + 4;

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
      const stroke = (pts: Array<[number, number]>, color: string, width: number, dash: number[], glow = 0) => {
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
        stroke(pts, "rgba(160,210,240,0.22)", 1.4, [2, 9]);
      }
      for (let la = -75; la <= 75; la += 15) {
        const pts: Array<[number, number]> = [];
        for (let lo = -180; lo <= 180; lo += 2) pts.push([la, lo]);
        stroke(pts, "rgba(160,210,240,0.22)", 1.4, [2, 9]);
      }
      const mer: Array<[number, number]> = [];
      for (let la = -88; la <= 88; la += 2) mer.push([la, lng]);
      stroke(mer, "rgba(120,230,255,0.95)", 2.6, [9, 7], 14);
      const par: Array<[number, number]> = [];
      for (let lo = -180; lo <= 180; lo += 2) par.push([lat, lo]);
      stroke(par, "rgba(120,230,255,0.95)", 2.6, [9, 7], 14);
    };

    const toTex = (img: HTMLImageElement): Tex | null => {
      if (!img.complete || !img.naturalWidth) return null;
      const w = Math.min(4096, img.naturalWidth);
      const h = Math.min(2048, img.naturalHeight);
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const o = off.getContext("2d");
      if (!o) return null;
      o.drawImage(img, 0, 0, w, h);
      return { data: o.getImageData(0, 0, w, h).data, w, h };
    };

    const render = (day: Tex | null, night: Tex | null, clouds: Tex | null) => {
      canvas.width = BACKING;
      canvas.height = BACKING;
      const out = ctx.createImageData(BACKING, BACKING);
      const data = out.data;
      const atmoOuter = 1 + ATMO;
      const rgb = [0, 0, 0];

      // Bilinear sample (longitude wraps, latitude clamps) → rgb[0..2].
      const sampleInto = (t: Tex, u: number, v: number) => {
        const { data: tex, w, h } = t;
        const fx = u * w - 0.5;
        const fy = v * h - 0.5;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const dx = fx - x0;
        const dy = fy - y0;
        const x0w = ((x0 % w) + w) % w;
        const x1w = (((x0 + 1) % w) + w) % w;
        const y0c = y0 < 0 ? 0 : y0 >= h ? h - 1 : y0;
        const y1c = y0 + 1 < 0 ? 0 : y0 + 1 >= h ? h - 1 : y0 + 1;
        const i00 = (y0c * w + x0w) * 4;
        const i10 = (y0c * w + x1w) * 4;
        const i01 = (y1c * w + x0w) * 4;
        const i11 = (y1c * w + x1w) * 4;
        const w00 = (1 - dx) * (1 - dy);
        const w10 = dx * (1 - dy);
        const w01 = (1 - dx) * dy;
        const w11 = dx * dy;
        rgb[0] = tex[i00] * w00 + tex[i10] * w10 + tex[i01] * w01 + tex[i11] * w11;
        rgb[1] = tex[i00 + 1] * w00 + tex[i10 + 1] * w10 + tex[i01 + 1] * w01 + tex[i11 + 1] * w11;
        rgb[2] = tex[i00 + 2] * w00 + tex[i10 + 2] * w10 + tex[i01 + 2] * w01 + tex[i11 + 2] * w11;
      };

      let band = 0;
      const step = () => {
        if (cancelled) return;
        const yA = Math.floor((band * BACKING) / BANDS);
        const yB = Math.floor(((band + 1) * BACKING) / BANDS);
        for (let py = yA; py < yB; py++) {
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
                const dl = 0.34 + 1.02 * litD;
                sampleInto(day, u, v);
                const dr = rgb[0] * dl;
                const dg = rgb[1] * dl;
                const db = rgb[2] * dl;
                if (night) {
                  sampleInto(night, u, v);
                  const nr = rgb[0] * 1.3 + 4;
                  const ng = rgb[1] * 1.24 + 8;
                  const nb = rgb[2] * 1.12 + 15;
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

              if (clouds) {
                sampleInto(clouds, u, v);
                const cv = rgb[0] / 255;
                const cover = cv * (0.2 + 0.8 * dayAmt);
                const litCloud = 240 * (0.32 + 0.85 * litD);
                r = r * (1 - cover) + litCloud * cover;
                g = g * (1 - cover) + litCloud * cover;
                b = b * (1 - cover) + litCloud * cover;
              }

              const fres = Math.pow(1 - Z, 2.6) * (0.3 + 0.7 * Math.max(0, ndotl));
              const spec = Math.pow(Math.max(0, ndotl), 40) * 0.5;
              data[di] = Math.min(255, r + fres * 55 + spec * 220);
              data[di + 1] = Math.min(255, g + fres * 150 + spec * 235);
              data[di + 2] = Math.min(255, b + fres * 225 + spec * 255);
              data[di + 3] = rho > 0.994 ? 255 * (1 - (rho - 0.994) / 0.006) : 255;
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
        if (band < BANDS) requestAnimationFrame(step);
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
      render(toTex(day), toTex(night), toTex(clouds));
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

  const dLon = rad(lng - cLon);
  const p = rad(lat);
  const p0 = rad(cLat);
  const mX = Math.cos(p) * Math.sin(dLon);
  const mY = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dLon);
  const markerLeft = 50 + mX * R_FRAC * 100;
  const markerTop = 50 - mY * R_FRAC * 100;

  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:max-w-[600px]">
      <div
        aria-hidden
        className="animate-twinkle pointer-events-none absolute -inset-8"
        style={{
          backgroundImage:
            "radial-gradient(1.2px 1.2px at 14% 22%, #fff, transparent), radial-gradient(1px 1px at 82% 16%, #cfefff, transparent), radial-gradient(1px 1px at 68% 82%, #fff, transparent), radial-gradient(1.4px 1.4px at 24% 74%, #bfe6ff, transparent), radial-gradient(1px 1px at 90% 60%, #fff, transparent)",
        }}
      />

      <div className="animate-float relative mx-auto aspect-square w-full">
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{ inset: "4%", background: "radial-gradient(circle at 34% 30%, #35648c, #163650 46%, #08182a 100%)" }}
        />
        <canvas
          ref={canvasRef}
          width={BACKING}
          height={BACKING}
          className="relative h-full w-full"
          aria-label={`Localização: ${place}`}
        />

        <div
          className="pointer-events-none absolute"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%`, transform: "translate(-50%,-50%)" }}
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="animate-heartbeat absolute h-4 w-4 rounded-full bg-brand-cyan" />
            <span className="relative h-3 w-3 rounded-full bg-brand-cyan ring-2 ring-white shadow-[0_0_14px_rgba(0,181,226,1)]" />
          </span>
        </div>

        <div
          className="pointer-events-none absolute hidden lg:block"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%`, transform: "translate(26px,-50%)" }}
        >
          <GlobeCard place={place} stats={stats} />
        </div>
      </div>

      <div className="mt-4 flex justify-center lg:hidden">
        <GlobeCard place={place} stats={stats} />
      </div>
    </div>
  );
}

function GlobeCard({ place, stats }: { place: string; stats: GlobeStats }) {
  // First word of the listing name for a tight title (e.g. "Diana - Vivenda…" → "Diana").
  const firstName = stats.name.trim().split(/\s+/)[0] || stats.name;
  // Bars are relative — the highest count fills the bar, the others scale to it.
  const maxVal = Math.max(stats.strengths, stats.fails, stats.criticals, 1);

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
          <p className="truncate text-base font-bold leading-tight text-white">{firstName}</p>
          <p className="truncate text-[10px] uppercase tracking-[0.14em] text-white/45">{place}</p>
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
        <MetricRow label="Pontos fortes" value={stats.strengths} max={maxVal} color="#4ade80" />
        <MetricRow label="A melhorar" value={stats.fails} max={maxVal} color="#00B5E2" />
        {stats.criticals > 0 && (
          <MetricRow label="Críticos" value={stats.criticals} max={maxVal} color="#f87171" />
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = value > 0 ? Math.max(6, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-white/60">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="mt-1 h-[3px] w-full rounded-full" style={{ background: `${color}55` }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
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
