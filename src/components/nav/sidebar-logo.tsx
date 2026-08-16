"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export function SidebarLogo() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mostra il logo di BandSpace"
        className="shrink-0 rounded-lg transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)"
      >
        <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="animate-fade-in relative flex flex-col items-center gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chiudi"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
            <Image src="/logo.png" alt="BandSpace" width={240} height={240} className="h-48 w-48 object-contain sm:h-60 sm:w-60" />
            <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">BandSpace</p>
          </div>
        </div>
      )}
    </>
  );
}
