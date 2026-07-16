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
      <div className="flex items-center gap-2 border-b border-zinc-200/70 bg-white px-3 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Apri il menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
        <Image src="/logo.png" alt="BandSpace" width={24} height={24} className="h-6 w-6 rounded-lg object-contain" />
        <span className="text-base font-semibold tracking-tight text-zinc-900">BandSpace</span>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="BandSpace"
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-lg object-contain"
                />
                <span className="text-lg font-semibold tracking-tight text-zinc-900">BandSpace</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi il menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MainNav isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-100 p-4 text-sm">
              <Link
                href="/profilo"
                onClick={() => setOpen(false)}
                className="flex min-w-0 items-center gap-2 rounded-lg py-1 hover:bg-zinc-100"
              >
                <Avatar name={fullName ?? "?"} />
                <span className="truncate font-medium text-zinc-700">{fullName}</span>
              </Link>
              <form action={signOut}>
                <button type="submit" className="shrink-0 text-zinc-400 transition-colors hover:text-zinc-700">
                  Esci
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
