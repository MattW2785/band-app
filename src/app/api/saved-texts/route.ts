import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { SavedTextKind } from "@/generated/prisma/enums";

function parseKind(value: string | null): SavedTextKind | null {
  if (value === "CAPTION" || value === "COMMENT") return value;
  return null;
}

export async function GET(request: NextRequest) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const kind = parseKind(request.nextUrl.searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ error: "Parametro kind mancante o non valido" }, { status: 400 });
  }

  const savedTexts = await prisma.savedText.findMany({
    where: { kind },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ savedTexts });
}

type CreateSavedTextBody = {
  kind?: string;
  title?: string;
  tags?: string[];
  body?: string;
};

export async function POST(request: NextRequest) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const payload = (await request.json().catch(() => null)) as CreateSavedTextBody | null;
  const kind = parseKind(payload?.kind ?? null);
  const body = payload?.body?.trim();

  if (!kind || !body) {
    return NextResponse.json({ error: "Dati mancanti (kind o testo)" }, { status: 400 });
  }

  const savedText = await prisma.savedText.create({
    data: {
      kind,
      title: payload?.title?.trim() || null,
      tags: (payload?.tags ?? []).map((t) => t.trim()).filter(Boolean),
      body,
    },
  });

  return NextResponse.json({ savedText }, { status: 201 });
}
