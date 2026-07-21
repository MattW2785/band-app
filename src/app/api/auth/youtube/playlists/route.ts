import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth";
import { ensureFreshAccessToken } from "@/lib/social/publishing/youtube";

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    const { accessToken } = await ensureFreshAccessToken(REFRESH_MARGIN_MS);
    const params = new URLSearchParams({ part: "snippet", mine: "true", maxResults: "50" });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlists?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Recupero playlist YouTube fallito: ${res.status} ${await res.text()}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    const playlists = (data.items ?? []).map((item: { id: string; snippet?: { title?: string } }) => ({
      id: item.id,
      title: item.snippet?.title ?? "(senza titolo)",
    }));
    return NextResponse.json({ playlists });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
