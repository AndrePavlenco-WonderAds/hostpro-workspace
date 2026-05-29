"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  monthLabel,
  monthLabelShort,
  shiftMonth,
  type MonthKey,
} from "@/lib/dates";

export function MonthPicker({
  current,
  options,
  basePath,
}: {
  current: MonthKey;
  options: MonthKey[];
  basePath: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const prev = shiftMonth(current, -1);
  const next = shiftMonth(current, +1);

  const hrefWith = (m: MonthKey) => {
    const p = new URLSearchParams(params.toString());
    p.set("m", m);
    return `${basePath}?${p.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={hrefWith(prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:border-brand-cyan hover:text-white"
        aria-label="Mês anterior"
      >
        ←
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-white transition hover:border-brand-cyan"
        >
          {monthLabel(current)}
          <span aria-hidden className="text-xs text-white/50">▾</span>
        </button>
        {open && (
          <div
            className="absolute left-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-brand-navy-dark shadow-xl"
            onMouseLeave={() => setOpen(false)}
          >
            <ul className="max-h-60 overflow-y-auto py-1">
              {options.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(hrefWith(m));
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                      m === current ? "text-brand-cyan" : "text-white/80"
                    }`}
                  >
                    {monthLabelShort(m)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Link
        href={hrefWith(next)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:border-brand-cyan hover:text-white"
        aria-label="Mês seguinte"
      >
        →
      </Link>
    </div>
  );
}
