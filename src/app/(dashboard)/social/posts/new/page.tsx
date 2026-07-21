import { requireSessionProfile } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { APP_TIMEZONE } from "@/lib/social/timezone";
import { Platform } from "@/generated/prisma/enums";
import NewPostForm from "./new-post-form";

const SCHEDULED_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ at?: string }> }) {
  const { profile } = await requireSessionProfile();
  const canPublish = profile.role === "admin";
  const { at } = await searchParams;
  const initialScheduledAtLocal = at && SCHEDULED_AT_RE.test(at) ? at : undefined;

  const accounts = await prisma.platformAccount.findMany({
    where: { platform: { in: [Platform.INSTAGRAM, Platform.YOUTUBE] } },
  });
  const instagramAccount = accounts.find((a) => a.platform === Platform.INSTAGRAM);
  const youtubeAccount = accounts.find((a) => a.platform === Platform.YOUTUBE);

  return (
    <NewPostForm
      initialScheduledAtLocal={initialScheduledAtLocal}
      instagramAccountName={instagramAccount?.displayName ?? null}
      instagramProfileImageUrl={instagramAccount?.profileImageUrl ?? null}
      youtubeAccountName={youtubeAccount?.displayName ?? null}
      youtubeProfileImageUrl={youtubeAccount?.profileImageUrl ?? null}
      timezone={APP_TIMEZONE}
      canPublish={canPublish}
    />
  );
}
