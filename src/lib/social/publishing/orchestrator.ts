import { prisma } from "@/lib/social/prisma";
import { Platform, TargetStatus } from "@/generated/prisma/enums";
import { publishToYoutube, type TargetWithPost } from "@/lib/social/publishing/youtube";
import { publishToInstagram, type InstagramHandlerResult } from "@/lib/social/publishing/instagram";
import { MAX_ATTEMPTS, nextAttemptDelayMs, PublishError } from "@/lib/social/publishing/retry";
import { cleanupPostMediaIfDone } from "@/lib/social/publishing/cleanup";
import type { ClaimedTarget } from "@/lib/social/publishing/claim";

export type DispatchOutcome = { targetId: string; success: boolean };

type HandlerResult =
  | { kind: "published"; externalPostId: string; externalPermalink: string; publishedAt: Date }
  | { kind: "in_progress"; containerId: string; containerCreatedAt?: string };

export async function dispatchClaimedTarget(claimed: ClaimedTarget): Promise<DispatchOutcome> {
  const target = await prisma.platformTarget.findUnique({
    where: { id: claimed.id },
    include: { post: { include: { media: { include: { media: true } } } } },
  });

  if (!target) {
    return { targetId: claimed.id, success: false };
  }

  const attemptNumber = target.attemptCount + 1;
  const startedAt = new Date();

  try {
    const result = await runHandler(claimed.platform, target, claimed.previousStatus);

    if (result.kind === "in_progress") {
      const existingExtra = (target.platformExtra as { containerCreatedAt?: string } | null) ?? {};
      await prisma.platformTarget.update({
        where: { id: target.id },
        data: {
          status: TargetStatus.AWAITING_CONTAINER,
          platformExtra: {
            containerId: result.containerId,
            containerCreatedAt: result.containerCreatedAt ?? existingExtra.containerCreatedAt,
          },
          claimedAt: null,
          claimedBy: null,
        },
      });
      return { targetId: target.id, success: false };
    }

    await prisma.$transaction([
      prisma.platformTarget.update({
        where: { id: target.id },
        data: {
          status: TargetStatus.PUBLISHED,
          externalPostId: result.externalPostId,
          externalPermalink: result.externalPermalink,
          publishedAt: result.publishedAt,
          lastError: null,
          claimedAt: null,
          claimedBy: null,
        },
      }),
      prisma.publishAttempt.create({
        data: {
          platformTargetId: target.id,
          attemptNumber,
          startedAt,
          finishedAt: new Date(),
          success: true,
        },
      }),
    ]);

    await cleanupPostMediaIfDone(target.postId);

    return { targetId: target.id, success: true };
  } catch (err) {
    const publishError =
      err instanceof PublishError ? err : new PublishError(err instanceof Error ? err.message : String(err), "TRANSIENT");

    const shouldRetry = publishError.errorClass === "TRANSIENT" && attemptNumber < MAX_ATTEMPTS;

    await prisma.$transaction([
      prisma.platformTarget.update({
        where: { id: target.id },
        data: shouldRetry
          ? {
              status: TargetStatus.SCHEDULED,
              attemptCount: attemptNumber,
              nextAttemptAt: new Date(Date.now() + nextAttemptDelayMs(attemptNumber)),
              lastError: publishError.message,
              claimedAt: null,
              claimedBy: null,
            }
          : {
              status: TargetStatus.FAILED,
              attemptCount: attemptNumber,
              lastError: publishError.message,
              claimedAt: null,
              claimedBy: null,
            },
      }),
      prisma.publishAttempt.create({
        data: {
          platformTargetId: target.id,
          attemptNumber,
          startedAt,
          finishedAt: new Date(),
          success: false,
          httpStatus: publishError.httpStatus,
          errorClass: publishError.errorClass,
          errorMessage: publishError.message,
        },
      }),
    ]);

    if (!shouldRetry) {
      await cleanupPostMediaIfDone(target.postId);
    }

    return { targetId: target.id, success: false };
  }
}

async function runHandler(platform: Platform, target: TargetWithPost, previousStatus: string): Promise<HandlerResult> {
  switch (platform) {
    case Platform.YOUTUBE: {
      const result = await publishToYoutube(target);
      return { kind: "published", ...result };
    }
    case Platform.INSTAGRAM:
      return publishToInstagram(target, previousStatus) as Promise<InstagramHandlerResult>;
    case Platform.TIKTOK:
      throw new PublishError(`Pubblicazione su ${platform} non ancora implementata`, "PERMANENT");
  }
}
