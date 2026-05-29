"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function UnlockForm({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Password incorrecta");
      }
      // Cookie is set — go where the user was originally headed.
      router.replace(next || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo correu mal");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm space-y-3 rounded-2xl border border-white/10 bg-white/[0.045] p-7 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
    >
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          HostPro Workspace
        </h1>
        <p className="mt-1.5 text-sm text-white/55">
          Acesso restrito. Insere a password para continuar.
        </p>
      </div>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-brand-cyan"
      />

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-brand-navy shadow-[0_10px_30px_-8px_rgba(0,181,226,0.6)] transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "A verificar…" : "Entrar"}
      </button>
    </form>
  );
}
