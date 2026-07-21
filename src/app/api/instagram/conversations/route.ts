import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth";
import { fetchConversations } from "@/lib/social/messaging/instagram";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    const conversations = await fetchConversations();
    return NextResponse.json({ conversations });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
