import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { utcDateToLocalInput } from "@/lib/social/timezone";
import { isPostEditable } from "@/lib/social/posts";
import EditForm from "./edit-form";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { targets: true, media: { include: { media: true } } },
  });

  if (!post) notFound();
  if (!isPostEditable(post)) {
    redirect("/social/posts");
  }

  const youtubeTarget = post.targets.find((t) => t.platform === "YOUTUBE");
  const instagramTarget = post.targets.find((t) => t.platform === "INSTAGRAM");

  return (
    <EditForm
      postId={post.id}
      baseCaption={post.baseCaption ?? ""}
      scheduledAtLocal={utcDateToLocalInput(post.scheduledAt)}
      mediaUrl={post.media[0]?.media.url ?? null}
      youtube={
        youtubeTarget
          ? {
              id: youtubeTarget.id,
              title: youtubeTarget.title ?? "",
              description: youtubeTarget.description ?? "",
              tags: youtubeTarget.tags.join(", "),
            }
          : null
      }
      instagram={
        instagramTarget
          ? {
              id: instagramTarget.id,
              description: instagramTarget.description ?? "",
              contentType:
                ((instagramTarget.platformExtra as { contentType?: string } | null)?.contentType as
                  | "FEED"
                  | "REELS"
                  | "STORIES") ?? "FEED",
              firstComment: instagramTarget.firstComment ?? "",
              firstCommentPosted: !!instagramTarget.firstCommentPostedAt,
            }
          : null
      }
    />
  );
}
