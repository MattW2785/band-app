import { prisma } from "@/lib/social/prisma";
import { decryptToken, encryptToken } from "@/lib/social/crypto";
import { refreshLongLivedToken } from "@/lib/social/oauth/instagram";
import { AccountStatus, Platform } from "@/generated/prisma/enums";
import { classifyHttpStatus, PublishError } from "@/lib/social/publishing/retry";
import type { PlatformTarget, Post, PostMedia, Media } from "@/generated/prisma/client";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.instagram.com/${GRAPH_VERSION}`;
const CONTAINER_TIMEOUT_MS = 30 * 60 * 1000; // 30 minuti, come da piano

export type TargetWithPost = PlatformTarget & {
  post: Post & { media: (PostMedia & { media: Media })[] };
};

export type InstagramHandlerResult =
  | { kind: "published"; externalPostId: string; externalPermalink: string; publishedAt: Date }
  | { kind: "in_progress"; containerId: string; containerCreatedAt?: string };

type ContainerExtra = { containerId?: string; containerCreatedAt?: string };

export async function publishToInstagram(
  target: TargetWithPost,
  previousStatus: "SCHEDULED" | "AWAITING_CONTAINER" | string
): Promise<InstagramHandlerResult> {
  const account = await prisma.platformAccount.findUnique({ where: { platform: Platform.INSTAGRAM } });
  if (!account) {
    throw new PublishError("Nessun account Instagram collegato", "PERMANENT");
  }
  if (account.status === AccountStatus.NEEDS_REAUTH) {
    throw new PublishError("Account Instagram richiede una nuova autorizzazione", "PERMANENT");
  }
  if (!account.externalAccountId) {
    throw new PublishError("Account Instagram senza ID business valido", "PERMANENT");
  }

  const accessToken = decryptToken(account.accessTokenEnc);

  if (previousStatus === "AWAITING_CONTAINER") {
    const extra = (target.platformExtra as ContainerExtra | null) ?? {};
    if (!extra.containerId) {
      throw new PublishError("Container Instagram mancante per un target in attesa", "PERMANENT");
    }
    return continuePublish(accessToken, extra, target);
  }

  return startPublish(accessToken, target);
}

// Con il token "Instagram Login" le chiamate di scrittura usano l'alias "me" (l'ID esplicito
// dell'account non è interrogabile/utilizzabile direttamente con questo tipo di token).
async function startPublish(accessToken: string, target: TargetWithPost): Promise<InstagramHandlerResult> {
  const media = target.post.media[0]?.media;
  if (!media) {
    throw new PublishError("Nessun media allegato al post", "PERMANENT");
  }

  const extra = (target.platformExtra as { contentType?: "FEED" | "REELS" | "STORIES" } | null) ?? {};
  const contentType = extra.contentType ?? (media.type === "VIDEO" ? "REELS" : "FEED");

  const params = new URLSearchParams({ access_token: accessToken });
  if (media.type === "VIDEO") {
    params.set("video_url", media.url);
    params.set("media_type", contentType === "STORIES" ? "STORIES" : "REELS");
  } else {
    params.set("image_url", media.url);
    if (contentType === "STORIES") params.set("media_type", "STORIES");
  }
  // Le Stories non supportano una caption testuale via API.
  if (contentType !== "STORIES") {
    params.set("caption", target.description || target.post.baseCaption || "");
  }

  const res = await fetch(`${GRAPH_BASE}/me/media`, { method: "POST", body: params });
  if (!res.ok) {
    throw new PublishError(
      `Creazione container Instagram fallita: ${res.status} ${await res.text()}`,
      classifyHttpStatus(res.status),
      res.status
    );
  }
  const data = await res.json();
  const containerId: string | undefined = data.id;
  if (!containerId) {
    throw new PublishError("Instagram non ha restituito un container id", "TRANSIENT");
  }

  return { kind: "in_progress", containerId, containerCreatedAt: new Date().toISOString() };
}

async function continuePublish(
  accessToken: string,
  extra: ContainerExtra,
  target: TargetWithPost
): Promise<InstagramHandlerResult> {
  const containerId = extra.containerId!;

  if (extra.containerCreatedAt) {
    const elapsed = Date.now() - new Date(extra.containerCreatedAt).getTime();
    if (elapsed > CONTAINER_TIMEOUT_MS) {
      throw new PublishError("Timeout: il container Instagram non è pronto dopo 30 minuti", "PERMANENT");
    }
  }

  const statusParams = new URLSearchParams({ fields: "status_code", access_token: accessToken });
  const statusRes = await fetch(`${GRAPH_BASE}/${containerId}?${statusParams.toString()}`);
  if (!statusRes.ok) {
    throw new PublishError(
      `Controllo stato container Instagram fallito: ${statusRes.status} ${await statusRes.text()}`,
      classifyHttpStatus(statusRes.status),
      statusRes.status
    );
  }
  const statusData = await statusRes.json();
  const statusCode: string = statusData.status_code;

  if (statusCode === "IN_PROGRESS") {
    return { kind: "in_progress", containerId };
  }
  if (statusCode === "ERROR" || statusCode === "EXPIRED") {
    throw new PublishError(`Container Instagram in stato ${statusCode}`, "PERMANENT");
  }

  const publishRes = await fetch(`${GRAPH_BASE}/me/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: containerId, access_token: accessToken }),
  });
  if (!publishRes.ok) {
    throw new PublishError(
      `Pubblicazione Instagram fallita: ${publishRes.status} ${await publishRes.text()}`,
      classifyHttpStatus(publishRes.status),
      publishRes.status
    );
  }
  const publishData = await publishRes.json();
  const mediaId: string | undefined = publishData.id;
  if (!mediaId) {
    throw new PublishError("Instagram non ha restituito un media id dopo la pubblicazione", "TRANSIENT");
  }

  const permalink = await fetchPermalink(mediaId, accessToken);

  if (target.firstComment && target.firstComment.trim()) {
    await postFirstComment(target.id, mediaId, target.firstComment.trim(), accessToken);
  }

  return {
    kind: "published",
    externalPostId: mediaId,
    externalPermalink: permalink ?? `https://www.instagram.com/`,
    publishedAt: new Date(),
  };
}

// Best-effort: il post è già pubblicato a questo punto, quindi un fallimento nell'invio
// del primo commento non deve far fallire (né ritentare) la pubblicazione del post stesso.
async function postFirstComment(
  targetId: string,
  mediaId: string,
  message: string,
  accessToken: string
): Promise<void> {
  try {
    const res = await fetch(`${GRAPH_BASE}/${mediaId}/comments`, {
      method: "POST",
      body: new URLSearchParams({ message, access_token: accessToken }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      await prisma.platformTarget.update({
        where: { id: targetId },
        data: { firstCommentError: `${res.status} ${errorText}`.slice(0, 500) },
      });
      return;
    }
    await prisma.platformTarget.update({
      where: { id: targetId },
      data: { firstCommentPostedAt: new Date(), firstCommentError: null },
    });
  } catch (err) {
    await prisma.platformTarget
      .update({
        where: { id: targetId },
        data: { firstCommentError: (err instanceof Error ? err.message : String(err)).slice(0, 500) },
      })
      .catch(() => null);
  }
}

async function fetchPermalink(mediaId: string, accessToken: string): Promise<string | null> {
  const params = new URLSearchParams({ fields: "permalink", access_token: accessToken });
  const res = await fetch(`${GRAPH_BASE}/${mediaId}?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.permalink ?? null;
}

// Il token long-lived Instagram (~60gg) si rinnova con l'endpoint ig_refresh_token
// prima che scada, estendendone la validità di altri ~60gg.
export async function ensureFreshInstagramToken(marginMs: number): Promise<{ refreshed: boolean }> {
  const account = await prisma.platformAccount.findUnique({ where: { platform: Platform.INSTAGRAM } });
  if (!account) {
    throw new PublishError("Nessun account Instagram collegato", "PERMANENT");
  }
  if (account.status === AccountStatus.NEEDS_REAUTH) {
    throw new PublishError("Account Instagram richiede una nuova autorizzazione", "PERMANENT");
  }

  const expiresAt = account.tokenExpiresAt?.getTime() ?? 0;
  if (expiresAt - Date.now() > marginMs) {
    return { refreshed: false };
  }

  try {
    const currentToken = decryptToken(account.accessTokenEnc);
    const refreshed = await refreshLongLivedToken(currentToken);
    await prisma.platformAccount.update({
      where: { platform: Platform.INSTAGRAM },
      data: {
        accessTokenEnc: encryptToken(refreshed.accessToken),
        tokenExpiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
        lastRefreshedAt: new Date(),
        status: AccountStatus.CONNECTED,
      },
    });
    return { refreshed: true };
  } catch (err) {
    await prisma.platformAccount.update({
      where: { platform: Platform.INSTAGRAM },
      data: { status: AccountStatus.NEEDS_REAUTH },
    });
    throw new PublishError(
      `Refresh token Instagram fallito: ${err instanceof Error ? err.message : String(err)}`,
      "PERMANENT"
    );
  }
}
