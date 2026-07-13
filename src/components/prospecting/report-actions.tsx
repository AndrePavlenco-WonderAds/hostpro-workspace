"use client";

import { useState } from "react";

// Two distinct actions on the live report:
//  · Partilhar — copies the public report link (the shareable web version).
//  · Download PDF — triggers the browser's print-to-PDF, which renders the
//    print-optimised vertical layout defined in the report page's stylesheet.

export function ReportActions() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: fall back to a temporary selection.
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={share}
        className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:border-brand-cyan hover:text-white"
      >
        <ShareIcon />
        {copied ? "Link copiado ✓" : "Copiar Link"}
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full bg-brand-cyan px-4 py-2 text-sm font-bold text-brand-navy shadow-[0_10px_30px_-8px_rgba(0,181,226,0.7)] transition hover:opacity-90"
      >
        <DownloadIcon />
        Download PDF
      </button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8a3 3 0 1 0-2.83-4M18 8a3 3 0 0 1-2.83-2M18 8l-9 4m9 8a3 3 0 1 0-2.83-4M18 20a3 3 0 0 1-2.83-2M18 20l-9-4M9 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0Zm0 0 6-2m-6 2 6 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
