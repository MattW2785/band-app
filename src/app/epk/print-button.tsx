"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50"
    >
      Stampa / Salva PDF
    </button>
  );
}
