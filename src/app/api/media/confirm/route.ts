import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { getPublicUrl } from "@/lib/social/storage/r2";
import { MediaType } from "@/generated/prisma/enums";

function detectMediaType(mimeType: string): MediaType | null {
  if (mimeType.startsWith("image/")) return MediaType.IMAGE;
  if (mimeType.startsWith("video/")) return MediaType.VIDEO;
  return null;
}

export async function POST(request: NextRequest) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const { storagePath, mimeType, fileSize } = body ?? {};

  if (typeof storagePath !== "string" || typeof mimeType !== "string" || typeof fileSize !== "number") {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }
  const mediaType = detectMediaType(mimeType);
  if (!mediaType) {
    return NextResponse.json({ error: "Tipo di file non supportato" }, { status: 400 });
  }

  const media = await prisma.media.create({
    data: {
      url: getPublicUrl(storagePath),
      storagePath,
      type: mediaType,
      mimeType,
      fileSize,
    },
  });

  return NextResponse.json({ media });
}
