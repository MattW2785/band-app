import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/social/oauth/instagram";

const STATE_COOKIE = "instagram_oauth_state";

// Genera un state CSRF diverso ad ogni richiesta: senza questo, Next.js potrebbe servire
// una risposta già in cache con uno state (e cookie) riutilizzato da una richiesta precedente.
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const state = randomBytes(16).toString("hex");
  const url = buildAuthUrl(state);

  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
