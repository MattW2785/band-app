import { NextRequest, NextResponse } from "next/server";
import { ensureFreshAccessToken } from "@/lib/social/publishing/youtube";
import { ensureFreshInstagramToken } from "@/lib/social/publishing/instagram";
import { syncProfileImages } from "@/lib/social/profile-sync";

const YOUTUBE_REFRESH_MARGIN_MS = 24 * 60 * 60 * 1000; // rinnova se manca meno di 24h alla scadenza
const INSTAGRAM_REFRESH_MARGIN_MS = 7 * 24 * 60 * 60 * 1000; // rinnova se mancano meno di 7gg (token dura ~60gg)

// Senza questo, Next.js può servire una risposta 200 già in cache invece di rieseguire
// davvero la logica ad ogni chiamata del cron esterno.
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${expected}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    const { refreshed } = await ensureFreshAccessToken(YOUTUBE_REFRESH_MARGIN_MS);
    results.youtube = refreshed ? "refreshed" : "still_valid";
  } catch (err) {
    results.youtube = err instanceof Error ? err.message : String(err);
  }

  try {
    const { refreshed } = await ensureFreshInstagramToken(INSTAGRAM_REFRESH_MARGIN_MS);
    results.instagram = refreshed ? "refreshed" : "still_valid";
  } catch (err) {
    results.instagram = err instanceof Error ? err.message : String(err);
  }

  const profileSyncResults = await syncProfileImages();

  return NextResponse.json({ ok: true, results, profileSync: profileSyncResults });
}
