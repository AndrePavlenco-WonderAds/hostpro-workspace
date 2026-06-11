"use client";

// Tiny wrapper around <form action={...}> that asks for confirmation
// before submitting. Used by the admin cron-trigger buttons in
// /admin/email-import-log so accidental double-clicks (or impulsive
// re-runs during dev) don't burn Blob ops — each cron run is ~10 ops
// post-v0.10.2, so the cost is small but >0. v0.10.3.

import { useTransition, type ReactNode } from "react";

export function ConfirmForm({
  action,
  message,
  children,
}: {
  action: () => void | Promise<void>;
  message: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm(message)) return;
        startTransition(async () => {
          await action();
        });
      }}
      aria-busy={pending}
    >
      {children}
    </form>
  );
}
