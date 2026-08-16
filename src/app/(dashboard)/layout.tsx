import Link from "next/link";
import { requireSessionProfile } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import { MainNav } from "@/components/nav/main-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { SidebarLogo } from "@/components/nav/sidebar-logo";
import { Avatar } from "@/components/ui/avatar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSessionProfile();
  const isAdmin = profile.role === "admin";

  return (
    <div className="flex min-h-full flex-1 flex-col md:h-screen md:min-h-0 md:flex-none md:flex-row md:overflow-hidden">
      <MobileNav isAdmin={isAdmin} fullName={profile.full_name} />
      <header className="hidden bg-white dark:bg-zinc-950/70 dark:backdrop-blur-md md:flex md:w-60 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-zinc-200/70 dark:md:border-zinc-800/60">
        <div className="flex items-center gap-2 px-4 pt-5 pb-2">
          <SidebarLogo />
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">BandSpace</span>
        </div>
        <MainNav isAdmin={isAdmin} />
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/70 p-4 text-sm">
          <Link href="/profilo" className="flex min-w-0 items-center gap-2 rounded-lg py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800/70">
            <Avatar name={profile.full_name ?? "?"} />
            <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{profile.full_name}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <form action={signOut}>
              <button type="submit" className="text-zinc-400 dark:text-zinc-500 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:min-h-0 md:overflow-y-auto md:p-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
