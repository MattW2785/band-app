import { decryptToken } from "@/lib/social/crypto";
import { prisma } from "@/lib/social/prisma";
import { AccountStatus, Platform } from "@/generated/prisma/enums";

const GRAPH_BASE = "https://graph.instagram.com/v21.0";

export type HourlyPoint = { endTime: string; hourly: Record<string, number> };

async function getInstagramAccount() {
  const account = await prisma.platformAccount.findUnique({ where: { platform: Platform.INSTAGRAM } });
  if (!account) {
    throw new Error("Account Instagram non collegato");
  }
  if (account.status === AccountStatus.NEEDS_REAUTH) {
    throw new Error("Account Instagram richiede una nuova autorizzazione");
  }
  return account;
}

export async function fetchOnlineFollowers(): Promise<HourlyPoint[]> {
  const account = await getInstagramAccount();
  const accessToken = decryptToken(account.accessTokenEnc);
  const params = new URLSearchParams({ metric: "online_followers", period: "lifetime", access_token: accessToken });
  const res = await fetch(`${GRAPH_BASE}/me/insights?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Recupero insights Instagram fallito: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const values = data.data?.[0]?.values ?? [];
  return values.map((v: { end_time: string; value?: Record<string, number> }) => ({
    endTime: v.end_time,
    hourly: v.value ?? {},
  }));
}

// Griglia lun-dom (0-6) x 24 ore, valori normalizzati 0-100 rispetto alla cella con più follower online.
export function buildHeatmapGrid(points: HourlyPoint[]): number[][] {
  const sums = Array.from({ length: 7 }, () => Array(24).fill(0));
  const counts = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const point of points) {
    const date = new Date(point.endTime);
    if (Number.isNaN(date.getTime())) continue;
    const weekday = (date.getUTCDay() + 6) % 7; // 0 = lunedì

    for (const [hourStr, value] of Object.entries(point.hourly)) {
      const hour = Number(hourStr);
      if (Number.isNaN(hour) || hour < 0 || hour > 23) continue;
      sums[weekday][hour] += value;
      counts[weekday][hour] += 1;
    }
  }

  const averages = sums.map((row, d) => row.map((v, h) => (counts[d][h] > 0 ? v / counts[d][h] : 0)));
  const max = Math.max(1, ...averages.flat());
  return averages.map((row) => row.map((v) => Math.round((v / max) * 100)));
}

export type MediaMetrics = { likeCount: number | null; commentsCount: number | null; reach: number | null };

// Il "reach" richiede una chiamata separata all'endpoint insights (permesso
// instagram_business_manage_insights); like/commenti sono invece campi diretti del nodo media.
export async function fetchMediaMetrics(mediaIds: string[]): Promise<Record<string, MediaMetrics>> {
  if (mediaIds.length === 0) return {};
  const account = await getInstagramAccount();
  const accessToken = decryptToken(account.accessTokenEnc);

  const entries = await Promise.all(
    mediaIds.map(async (id): Promise<[string, MediaMetrics]> => {
      const fieldsParams = new URLSearchParams({ fields: "like_count,comments_count", access_token: accessToken });
      const fieldsRes = await fetch(`${GRAPH_BASE}/${id}?${fieldsParams.toString()}`);
      const fields = fieldsRes.ok ? await fieldsRes.json() : {};

      const insightsParams = new URLSearchParams({ metric: "reach", access_token: accessToken });
      const insightsRes = await fetch(`${GRAPH_BASE}/${id}/insights?${insightsParams.toString()}`);
      const insightsData = insightsRes.ok ? await insightsRes.json() : null;
      const reach = insightsData?.data?.[0]?.values?.[0]?.value ?? null;

      return [id, { likeCount: fields.like_count ?? null, commentsCount: fields.comments_count ?? null, reach }];
    })
  );

  return Object.fromEntries(entries);
}
