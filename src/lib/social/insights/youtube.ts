import { ensureFreshAccessToken } from "@/lib/social/publishing/youtube";

const API_BASE = "https://www.googleapis.com/youtube/v3";
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const CHUNK_SIZE = 50; // limite di videos.list per chiamata

export type VideoMetrics = { viewCount: number | null; likeCount: number | null; commentCount: number | null };

export async function fetchVideoMetrics(videoIds: string[]): Promise<Record<string, VideoMetrics>> {
  if (videoIds.length === 0) return {};
  const { accessToken } = await ensureFreshAccessToken(REFRESH_MARGIN_MS);

  const result: Record<string, VideoMetrics> = {};
  for (let i = 0; i < videoIds.length; i += CHUNK_SIZE) {
    const chunk = videoIds.slice(i, i + CHUNK_SIZE);
    const params = new URLSearchParams({ part: "statistics", id: chunk.join(",") });
    const res = await fetch(`${API_BASE}/videos?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Recupero statistiche YouTube fallito: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    for (const item of data.items ?? []) {
      const stats = item.statistics ?? {};
      result[item.id] = {
        viewCount: stats.viewCount != null ? Number(stats.viewCount) : null,
        likeCount: stats.likeCount != null ? Number(stats.likeCount) : null,
        commentCount: stats.commentCount != null ? Number(stats.commentCount) : null,
      };
    }
  }
  return result;
}
