import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth";
import { buildStoragePath, createSignedUploadUrl } from "@/lib/social/storage/r2";
import { MediaType } from "@/generated/prisma/enums";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

function detectMediaType(mimeType: string): MediaType | null {
  if (mimeType.startsWith("image/")) return MediaType.IMAGE;
  if (mimeType.startsWith("video/")) return MediaType.VIDEO;
  return null;
}

export async function POST(request: NextRequest) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const { filename, contentType, fileSize } = body ?? {};

  if (typeof filename !== "string" || typeof contentType !== "string" || typeof fileSize !== "number") {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }
  if (!detectMediaType(contentType)) {
    return NextResponse.json({ error: "Tipo di file non supportato (solo immagini o video)" }, { status: 400 });
  }
  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File troppo grande (max 2GB)" }, { status: 400 });
  }

  const storagePath = buildStoragePath(filename);
  const uploadUrl = await createSignedUploadUrl(storagePath, contentType);

  return NextResponse.json({ storagePath, uploadUrl });
}
