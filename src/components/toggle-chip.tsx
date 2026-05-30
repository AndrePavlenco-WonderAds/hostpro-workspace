"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFlagAction } from "@/lib/pnl-actions";

export type ToggleFlag =
  | "pago"
  | "recebido"
  | "noBanco"
  | "inIvaVault"
  | "outOfAccount";

/**
 * Interactive status chip — click to toggle the underlying boolean without
 * opening the edit modal. Uses optimistic state so the user gets immediate
 * feedback, with a fallback if the server action fails.
 */
export function ToggleChip({
  entryId,
  property,
  flag,
  active,
  label,
  tone,
}: {
  entryId: string;
  property: string;
  flag: ToggleFlag;
  active: boolean;
  label: string;
  tone: "good" | "warn" | "neutral";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useState(active);

  function handleClick() {
    const next = !optimistic;
    setOptimistic(next);
    start(async () => {
      const res = await toggleFlagAction(entryId, flag, next, property);
      if (!res.ok) {
        setOptimistic(!next);
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  const activeCls =
    tone === "good"
      ? "bg-emerald-400/20 text-emerald-200 ring-emerald-400/40 hover:bg-emerald-400/30"
      : tone === "warn"
        ? "bg-amber-300/20 text-amber-200 ring-amber-300/40 hover:bg-amber-300/30"
        : "bg-white/[0.10] text-white/90 ring-white/20 hover:bg-white/[0.16]";
  const inactiveCls =
    "bg-white/[0.03] text-white/35 ring-white/10 hover:bg-white/[0.06] hover:text-white/55";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={
        optimistic
          ? `Carrega para desmarcar "${label}"`
          : `Carrega para marcar "${label}"`
      }
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 transition disabled:opacity-50 ${
        optimistic ? activeCls : inactiveCls
      }`}
    >
      {label}
    </button>
  );
}
