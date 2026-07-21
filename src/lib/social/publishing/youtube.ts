import { prisma } from "@/lib/social/prisma";
import { decryptToken, encryptToken } from "@/lib/social/crypto";
import { refreshAccessToken } from "@/lib/social/oauth/youtube";
import { getPublicUrl } from "@/lib/social/storage/r2";
import { AccountStatus, Platform } from "@/generated/prisma/enums";
import { classifyHttpStatus, PublishError } from "@/lib/social/publishing/retry";
import type { PlatformTarget, Post, PostMedia, Media } from "@/generated/prisma/client";

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

async function getValidAccessToken(): Promise<string> {
  return (await ensureFreshAccessToken(REFRESH_MARGIN_MS)).accessToken;
}

// Usata anche dal cron di refresh periodico (margine più ampio) per rinnovare il token
// prima che il refresh token stesso rischi di invalidarsi per inattività prolungata.
export async function ensureFreshAccessToken(
  marginMs: number
): Promise<{ accessToken: string; refreshed: boolean }> {
  const account = await prisma.platformAccount.findUnique({ where: { platform: Platform.YOUTUBE } });
  if (!account) {
    throw new PublishError("Nessun account YouTube collegato", "PERMANENT");
  }
  if (account.status === AccountStatus.NEEDS_REAUTH) {
    throw new PublishError("Account YouTube richiede una nuova autorizzazione", "PERMANENT");
  }

  const expiresAt = account.tokenExpiresAt?.getTime() ?? 0;
  if (expiresAt - Date.now() > marginMs) {
    return { accessToken: decryptToken(account.accessTokenEnc), refreshed: false };
  }

  if (!account.refreshTokenEnc) {
    await prisma.platformAccount.update({
      where: { platform: Platform.YOUTUBE },
      data: { status: AccountStatus.NEEDS_REAUTH },
    });
    throw new PublishError("Token YouTube scaduto e nessun refresh token disponibile", "PERMANENT");
  }

  try {
    const refreshToken = decryptToken(account.refreshTokenEnc);
    const tokens = await refreshAccessToken(refreshToken);
    await prisma.platformAccount.update({
      where: { platform: Platform.YOUTUBE },
      data: {
        accessTokenEnc: encryptToken(tokens.access_token),
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        lastRefreshedAt: new Date(),
        status: AccountStatus.CONNECTED,
      },
    });
    return { accessToken: tokens.access_token, refreshed: true };
  } catch (err) {
    await prisma.platformAccount.update({
      where: { platform: Platform.YOUTUBE },
      data: { status: AccountStatus.NEEDS_REAUTH },
    });
    throw new PublishError(
      `Refresh token YouTube fallito: ${err instanceof Error ? err.message : String(err)}`,
      "PERMANENT"
    );
  }
}

export type TargetWithPost = PlatformTarget & {
  post: Post & { media: (PostMedia & { media: Media })[] };
};

export type PublishResult = {
  externalPostId: string;
  externalPermalink: string;
  publishedAt: Date;
};

export async function publishToYoutube(target: TargetWithPost): Promise<PublishResult> {
  const firstMedia = target.post.media[0]?.media;
  if (!firstMedia) {
    throw new PublishError("Nessun video allegato al post", "PERMANENT");
  }
  if (firstMedia.type !== "VIDEO") {
    throw new PublishError("YouTube richiede un file video", "PERMANENT");
  }

  const accessToken = await getValidAccessToken();
  const publishAt = target.scheduledAt ?? target.post.scheduledAt;
  const extra =
    (target.platformExtra as {
      thumbnailStoragePath?: string;
      madeForKids?: boolean;
      categoryId?: string;
      playlistId?: string;
    } | null) ?? {};

  // Solo una HEAD per conoscere la dimensione: il video non viene mai scaricato per intero
  // in memoria, altrimenti file grandi esauriscono la RAM della funzione serverless e il
  // processo viene ucciso a livello di sistema (senza che il nostro try/catch se ne accorga).
  const headRes = await fetch(firstMedia.url, { method: "HEAD" });
  if (!headRes.ok) {
    throw new PublishError(
      `Video non raggiungibile su storage: ${headRes.status}`,
      classifyHttpStatus(headRes.status),
      headRes.status
    );
  }
  const contentLength = headRes.headers.get("content-length") ?? String(firstMedia.fileSize);

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": firstMedia.mimeType,
        "X-Upload-Content-Length": contentLength,
      },
      body: JSON.stringify({
        snippet: {
          title: target.title || target.post.baseCaption || "Senza titolo",
          description: target.description || target.post.baseCaption || "",
          tags: target.tags,
          categoryId: extra.categoryId || undefined,
        },
        status: {
          privacyStatus: target.privacyStatus || "private",
          publishAt: publishAt.toISOString(),
          selfDeclaredMadeForKids: extra.madeForKids ?? false,
        },
      }),
    }
  );

  if (!initRes.ok) {
    throw new PublishError(
      `Inizializzazione upload YouTube fallita: ${initRes.status} ${await initRes.text()}`,
      classifyHttpStatus(initRes.status),
      initRes.status
    );
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new PublishError("YouTube non ha restituito un upload URL", "TRANSIENT");
  }

  // Il video fluisce direttamente dallo storage a YouTube, un pezzo alla volta.
  const videoRes = await fetch(firstMedia.url);
  if (!videoRes.ok || !videoRes.body) {
    throw new PublishError(
      `Impossibile scaricare il video dallo storage: ${videoRes.status}`,
      classifyHttpStatus(videoRes.status),
      videoRes.status
    );
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": firstMedia.mimeType,
      "Content-Length": contentLength,
    },
    body: videoRes.body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  if (!uploadRes.ok) {
    throw new PublishError(
      `Upload video su YouTube fallito: ${uploadRes.status} ${await uploadRes.text()}`,
      classifyHttpStatus(uploadRes.status),
      uploadRes.status
    );
  }

  const videoData = await uploadRes.json();
  const videoId: string | undefined = videoData.id;
  if (!videoId) {
    throw new PublishError("Risposta upload YouTube senza id video", "TRANSIENT");
  }

  if (extra.thumbnailStoragePath) {
    await setThumbnail(videoId, extra.thumbnailStoragePath, accessToken);
  }
  if (extra.playlistId) {
    await addToPlaylist(videoId, extra.playlistId, accessToken);
  }

  return {
    externalPostId: videoId,
    externalPermalink: `https://youtu.be/${videoId}`,
    publishedAt: publishAt,
  };
}

// Best-effort: se la miniatura fallisce non deve invalidare la pubblicazione del video,
// che a questo punto è già andata a buon fine.
async function setThumbnail(videoId: string, thumbnailStoragePath: string, accessToken: string): Promise<void> {
  try {
    const thumbUrl = getPublicUrl(thumbnailStoragePath);
    const thumbRes = await fetch(thumbUrl);
    if (!thumbRes.ok || !thumbRes.body) return;

    const contentType = thumbRes.headers.get("content-type") ?? "image/jpeg";
    await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
      body: thumbRes.body,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
  } catch {
    // non bloccare la pubblicazione per un errore sulla sola miniatura
  }
}

// Best-effort: richiede lo scope "youtube" (non solo upload/readonly). Un account collegato
// prima dell'introduzione di questo scope avrà un token privo del permesso: in quel caso
// l'aggiunta alla playlist fallisce silenziosamente finché l'utente non ricollega l'account,
// ma il video resta comunque pubblicato correttamente.
async function addToPlaylist(videoId: string, playlistId: string, accessToken: string): Promise<void> {
  try {
    await fetch("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } },
      }),
    });
  } catch {
    // vedi commento sopra
  }
}
