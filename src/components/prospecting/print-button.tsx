"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-full bg-[#00B5E2] px-5 py-2 text-sm font-semibold text-[#203247] shadow transition hover:opacity-90"
    >
      Imprimir / Guardar PDF
    </button>
  );
}
