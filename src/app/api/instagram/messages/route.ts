import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { sendMessage } from "@/lib/social/messaging/instagram";

type SendMessageBody = { recipientId?: string; text?: string };

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as SendMessageBody | null;
  const recipientId = body?.recipientId?.trim();
  const text = body?.text?.trim();

  if (!recipientId || !text) {
    return NextResponse.json({ error: "Dati mancanti (destinatario o testo)" }, { status: 400 });
  }

  try {
    await sendMessage(recipientId, text);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
