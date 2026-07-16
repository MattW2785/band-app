import Link from "next/link";
import Image from "next/image";
import { requireSessionProfile } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import { MainNav } from "@/components/nav/main-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { Avatar } from "@/components/ui/avatar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSessionProfile();
  const isAdmin = profile.role === "admin";

  return (
    <div className="flex min-h-full flex-1 flex-col md:h-screen md:min-h-0 md:flex-none md:flex-row md:overflow-hidden">
      <MobileNav isAdmin={isAdmin} fullName={profile.full_name} />
      <header className="hidden bg-white md:flex md:w-60 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-zinc-200/70">
        <div className="flex items-center gap-2 px-4 pt-5 pb-2">
          <Image src="/logo.png" alt="BandSpace" width={28} height={28} className="h-7 w-7 rounded-lg object-contain" />
          <span className="text-lg font-semibold tracking-tight text-zinc-900">BandSpace</span>
        </div>
        <MainNav isAdmin={isAdmin} />
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-100 p-4 text-sm">
          <Link href="/profilo" className="flex min-w-0 items-center gap-2 rounded-lg py-1 hover:bg-zinc-100">
            <Avatar name={profile.full_name ?? "?"} />
            <span className="truncate font-medium text-zinc-700">{profile.full_name}</span>
          </Link>
          <form action={signOut}>
            <button type="submit" className="shrink-0 text-zinc-400 transition-colors hover:text-zinc-700">
              Esci
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 bg-zinc-50/60 p-4 sm:p-6 md:min-h-0 md:overflow-y-auto md:p-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
