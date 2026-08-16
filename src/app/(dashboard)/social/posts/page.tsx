import Link from "next/link";
import { requireSessionProfile } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { formatInAppTimezone } from "@/lib/social/timezone";
import { isPostEditable } from "@/lib/social/posts";
import { PageHeader } from "@/components/ui/page-header";
import PostActions from "./post-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Bozza",
  SCHEDULED: "Programmato",
  CLAIMED: "In elaborazione",
  AWAITING_CONTAINER: "In elaborazione",
  PUBLISHING: "Pubblicazione in corso",
  PUBLISHED: "Pubblicato",
  FAILED: "Fallito",
  NEEDS_REVIEW: "Richiede verifica",
  CANCELED: "Annullato",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  SCHEDULED: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  CLAIMED: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  AWAITING_CONTAINER: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  PUBLISHING: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  PUBLISHED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  NEEDS_REVIEW: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  CANCELED: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
};

const PLATFORM_LABEL: Record<string, string> = {
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
};

export default async function PostsPage() {
  const { profile } = await requireSessionProfile();
  const isAdmin = profile.role === "admin";
  const posts = await prisma.post.findMany({
    orderBy: { scheduledAt: "desc" },
    take: 100,
    include: { targets: true, media: { include: { media: true }, orderBy: { order: "asc" } } },
  });

  return (
    <div>
      <PageHeader
        title="Post"
        action={
          <Link
            href="/social/posts/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-violet-500 to-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-md shadow-indigo-600/25 transition-all duration-150 hover:from-violet-400 hover:to-indigo-500 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-[0.98]"
          >
            + Nuovo post
          </Link>
        }
      />

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 py-16 text-center">
          <p className="text-zinc-500 dark:text-zinc-500">Nessun post ancora creato.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {posts.map((post) => {
            const media = post.media[0]?.media;
            return (
              <li
                key={post.id}
                className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm transition-colors hover:border-violet-200 dark:hover:border-violet-500/40"
              >
                <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800">
                  {media?.type === "VIDEO" ? (
                    <video src={media.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : media ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-zinc-100 backdrop-blur-sm">
                    {formatInAppTimezone(post.scheduledAt).replace(/:\d{2}$/, "")}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 text-sm text-zinc-700 dark:text-zinc-200">{post.baseCaption || "(nessuna caption)"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.targets.map((t) => (
                      <span
                        key={t.id}
                        className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight whitespace-nowrap ${STATUS_STYLE[t.status] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"}`}
                      >
                        {PLATFORM_LABEL[t.platform] ?? t.platform} · {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    ))}
                  </div>
                  {isAdmin && (
                    <div className="mt-auto flex items-center justify-end border-t border-zinc-100 dark:border-zinc-800 pt-2">
                      <PostActions postId={post.id} editable={isPostEditable(post)} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
