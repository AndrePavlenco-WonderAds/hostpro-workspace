"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEntryAction } from "@/lib/pnl-actions";

export function DeleteEntryButton({
  id,
  property,
}: {
  id: string;
  property: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    start(async () => {
      const res = await deleteEntryAction(id, property);
      if (res.ok) router.refresh();
      else alert(res.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={confirming ? "Clica novamente para confirmar" : "Apagar entrada"}
      className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition disabled:opacity-50 ${
        confirming
          ? "border-rose-400/60 bg-rose-500/25 text-rose-200"
          : "border-white/15 bg-white/[0.04] text-white/55 hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-rose-200"
      }`}
    >
      <span aria-hidden className="text-sm leading-none">
        {pending ? "…" : confirming ? "✓" : "🗑"}
      </span>
      {confirming ? "Confirmar" : "Apagar"}
    </button>
  );
}
