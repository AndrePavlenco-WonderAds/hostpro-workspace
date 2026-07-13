"use client";

import { useEffect, useRef, useState } from "react";

// Small animation primitives for the report dashboard. Numbers count up and
// the donut arc draws itself when the report opens. All setState runs inside
// requestAnimationFrame (never synchronously in the effect body) so it stays
// clear of the react-hooks/set-state-in-effect rule.

function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function CountUp({
  value,
  className,
  suffix = "",
  duration = 1000,
}: {
  value: number;
  className?: string;
  suffix?: string;
  duration?: number;
}) {
  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (prefersReduced() || value === 0) {
      const raf = requestAnimationFrame(() => setN(value));
      return () => cancelAnimationFrame(raf);
    }

    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={className}>
      {n}
      {suffix}
    </span>
  );
}

export function Donut({ score, color }: { score: number; color: string }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (c * score) / 100;

  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#eceff2" strokeWidth="13" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeDashoffset={0}
          className="animate-donut"
          style={{ ["--donut-dash" as string]: `${dash}` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color }}>
          <CountUp
            value={score}
            className="text-4xl font-extrabold tabular-nums"
            duration={1200}
          />
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "#9ca3af" }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}
