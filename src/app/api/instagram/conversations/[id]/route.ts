import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth";
import { fetchMessages } from "@/lib/social/messaging/instagram";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    const messages = await fetchMessages(id);
    return NextResponse.json({ messages });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
