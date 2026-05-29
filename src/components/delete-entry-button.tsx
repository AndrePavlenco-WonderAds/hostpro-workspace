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
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs transition disabled:opacity-50 ${
        confirming
          ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40"
          : "text-white/35 hover:bg-white/[0.06] hover:text-rose-300"
      }`}
    >
      {pending ? "…" : confirming ? "✓?" : "🗑"}
    </button>
  );
}
