import Link from "next/link";
import { requireSessionProfile } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { formatInAppTimezone } from "@/lib/social/timezone";
import { isPostEditable } from "@/lib/social/posts";
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
  DRAFT: "bg-neutral-800 text-neutral-400",
  SCHEDULED: "bg-indigo-500/15 text-indigo-300",
  CLAIMED: "bg-amber-500/15 text-amber-300",
  AWAITING_CONTAINER: "bg-amber-500/15 text-amber-300",
  PUBLISHING: "bg-amber-500/15 text-amber-300",
  PUBLISHED: "bg-emerald-500/15 text-emerald-300",
  FAILED: "bg-red-500/15 text-red-300",
  NEEDS_REVIEW: "bg-orange-500/15 text-orange-300",
  CANCELED: "bg-neutral-800 text-neutral-500",
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Post</h1>
        <Link
          href="/social/posts/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          + Nuovo post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-neutral-800 py-16 text-center">
          <p className="text-zinc-500 dark:text-neutral-500">Nessun post ancora creato.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {posts.map((post) => {
            const media = post.media[0]?.media;
            return (
              <li
                key={post.id}
                className="flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40 transition-colors hover:border-neutral-700"
              >
                <div className="relative aspect-video w-full bg-neutral-800">
                  {media?.type === "VIDEO" ? (
                    <video src={media.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : media ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media.url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-neutral-200 backdrop-blur-sm">
                    {formatInAppTimezone(post.scheduledAt).replace(/:\d{2}$/, "")}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 text-sm text-neutral-200">{post.baseCaption || "(nessuna caption)"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.targets.map((t) => (
                      <span
                        key={t.id}
                        className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight whitespace-nowrap ${STATUS_STYLE[t.status] ?? "bg-neutral-900 text-neutral-300"}`}
                      >
                        {PLATFORM_LABEL[t.platform] ?? t.platform} · {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    ))}
                  </div>
                  {isAdmin && (
                    <div className="mt-auto flex items-center justify-end border-t border-neutral-800 pt-2">
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
