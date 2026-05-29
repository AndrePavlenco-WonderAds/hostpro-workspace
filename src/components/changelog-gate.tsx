"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ChangelogGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/changelog-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Password incorrecta");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo correu mal");
      setLoading(false);
    }
  }

  return (
    <section className="mt-12 flex justify-center sm:mt-20">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.035] p-8 backdrop-blur-md">
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan shadow-[0_10px_40px_-8px_rgba(0,181,226,0.7)]"
          >
            🔒
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Acesso restrito
          </h1>
          <p className="mt-2 text-sm text-white/55">
            O changelog é apenas para superadmin. Insere a password para
            continuar.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-brand-cyan"
          />
          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-[0_8px_28px_-6px_rgba(0,181,226,0.6)] transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "A verificar…" : "Unlock"}
          </button>
        </form>
      </div>
    </section>
  );
}
