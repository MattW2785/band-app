import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.savedText.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
