import { requireSessionProfile } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { Platform } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const PLATFORM_LABEL: Partial<Record<Platform, string>> = {
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
};

const PLATFORM_ACCENT: Partial<Record<Platform, string>> = {
  YOUTUBE: "bg-red-500/15 text-red-400",
  INSTAGRAM: "bg-fuchsia-500/15 text-fuchsia-400",
};

const PLATFORM_INITIALS: Partial<Record<Platform, string>> = {
  YOUTUBE: "YT",
  INSTAGRAM: "IG",
};

const CONNECT_HREF: Partial<Record<Platform, string>> = {
  YOUTUBE: "/api/auth/youtube/connect",
  INSTAGRAM: "/api/auth/instagram/connect",
};

const STATUS_LABEL: Record<string, string> = {
  CONNECTED: "Connesso",
  NEEDS_REAUTH: "Richiede nuova autorizzazione",
  ERROR: "Errore",
};

const STATUS_DOT: Record<string, string> = {
  CONNECTED: "bg-emerald-400",
  NEEDS_REAUTH: "bg-amber-400",
  ERROR: "bg-red-400",
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { profile } = await requireSessionProfile();
  const isAdmin = profile.role === "admin";
  const { error, detail } = await searchParams;
  const accounts = await prisma.platformAccount.findMany();
  const byPlatform = new Map(accounts.map((a) => [a.platform, a]));

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Account collegati</h1>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          Connessione fallita ({error}){detail ? `: ${detail}` : ""}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {(Object.keys(PLATFORM_LABEL) as Platform[]).map((platform) => {
          const account = byPlatform.get(platform);
          const connectHref = CONNECT_HREF[platform];

          return (
            <li
              key={platform}
              className="flex items-center justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {account?.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={account.profileImageUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${PLATFORM_ACCENT[platform] ?? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300"}`}
                  >
                    {PLATFORM_INITIALS[platform] ?? PLATFORM_LABEL[platform]?.charAt(0)}
                  </span>
                )}
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{PLATFORM_LABEL[platform]}</p>
                  {account ? (
                    <p className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[account.status] ?? "bg-zinc-400"}`} />
                      {STATUS_LABEL[account.status] ?? account.status}
                      {account.displayName ? ` — ${account.displayName}` : ""}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">Non connesso</p>
                  )}
                </div>
              </div>
              {!isAdmin ? (
                <span className="text-xs text-zinc-400 dark:text-zinc-600">Solo l&apos;amministratore può collegare gli account</span>
              ) : connectHref ? (
                <a
                  href={connectHref}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  {account ? "Riconnetti" : "Connetti"}
                </a>
              ) : (
                <span className="text-sm text-zinc-400 dark:text-zinc-600">Disponibile in una fase successiva</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
