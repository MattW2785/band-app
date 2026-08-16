"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { MainNav } from "@/components/nav/main-nav";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth-actions";

export function MobileNav({ isAdmin, fullName }: { isAdmin: boolean; fullName: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-2 border-b border-zinc-200/70 dark:border-zinc-800/60 bg-white dark:bg-zinc-950/70 dark:backdrop-blur-md px-3 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Apri il menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
        <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
        <span className="flex-1 text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">BandSpace</span>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white dark:bg-zinc-950 shadow-xl">
            <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">BandSpace</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi il menu"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              <MainNav isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 p-4 text-sm">
              <Link
                href="/profilo"
                onClick={() => setOpen(false)}
                className="flex min-w-0 items-center gap-2 rounded-lg py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Avatar name={fullName ?? "?"} />
                <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{fullName}</span>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <form action={signOut}>
                  <button type="submit" className="text-zinc-400 dark:text-zinc-500 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
                    Esci
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
