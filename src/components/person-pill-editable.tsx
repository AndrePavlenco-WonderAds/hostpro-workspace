"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePersonAction } from "@/lib/pnl-actions";
import { PEOPLE, type Person } from "@/lib/pnl-types";

/**
 * Inline editable person pill. Renders the same coloured pill as before, but
 * clicking it opens a tiny dropdown to switch person without going through
 * the edit modal. Used in the despesa / funcionário tables (where "Pessoa"
 * means "who paid") and in entradas (who received).
 */
export function PersonPillEditable({
  entryId,
  property,
  person,
}: {
  entryId: string;
  property: string;
  person: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useState<Person>(person as Person);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Click outside to close.
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function pick(p: Person) {
    setOpen(false);
    if (p === optimistic) return;
    const prev = optimistic;
    setOptimistic(p);
    start(async () => {
      const res = await changePersonAction(entryId, p, property);
      if (!res.ok) {
        setOptimistic(prev);
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  const tone =
    optimistic === "André"
      ? "bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/30 hover:bg-brand-cyan/25"
      : optimistic === "Carol"
        ? "bg-fuchsia-400/15 text-fuchsia-200 ring-fuchsia-400/30 hover:bg-fuchsia-400/25"
        : optimistic === "Alex"
          ? "bg-amber-300/15 text-amber-200 ring-amber-300/30 hover:bg-amber-300/25"
          : "bg-violet-400/15 text-violet-200 ring-violet-400/30 hover:bg-violet-400/25";

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        title="Trocar pessoa"
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 transition disabled:opacity-50 ${tone}`}
      >
        {optimistic}
        <span aria-hidden className="text-[8px] opacity-70">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-32 overflow-hidden rounded-xl border border-white/15 bg-brand-navy-dark shadow-xl">
          <ul className="py-1">
            {PEOPLE.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => pick(p)}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-xs transition hover:bg-white/[0.06] ${
                    p === optimistic ? "text-brand-cyan" : "text-white/80"
                  }`}
                >
                  {p}
                  {p === optimistic && <span aria-hidden>✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
