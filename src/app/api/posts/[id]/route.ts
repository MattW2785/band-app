import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { deleteMediaFile } from "@/lib/social/storage/r2";
import { localInputToUtcDate } from "@/lib/social/timezone";
import { isPostEditable } from "@/lib/social/posts";
import { Prisma } from "@/generated/prisma/client";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { targets: true, media: { include: { media: true } } },
  });
  if (!post) {
    return NextResponse.json({ error: "Post non trovato" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

type UpdatePostBody = {
  baseCaption?: string;
  scheduledAtLocal?: string;
  targets?: Array<{
    id: string;
    title?: string;
    description?: string;
    tags?: string[];
    platformExtra?: Record<string, unknown>;
    firstComment?: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, include: { targets: true } });
  if (!post) {
    return NextResponse.json({ error: "Post non trovato" }, { status: 404 });
  }

  if (!isPostEditable(post)) {
    return NextResponse.json(
      {
        error:
          "Non modificabile: la pubblicazione è già iniziata, oppure mancano meno di 15 minuti all'orario programmato",
      },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => null)) as UpdatePostBody | null;
  if (!body) {
    return NextResponse.json({ error: "Corpo della richiesta non valido" }, { status: 400 });
  }

  const data: Prisma.PostUpdateInput = {};
  if (typeof body.baseCaption === "string") data.baseCaption = body.baseCaption || null;
  if (body.scheduledAtLocal) {
    const scheduledAt = localInputToUtcDate(body.scheduledAtLocal);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Data programmata non valida" }, { status: 400 });
    }
    data.scheduledAt = scheduledAt;
  }

  await prisma.$transaction([
    prisma.post.update({ where: { id }, data }),
    ...(body.targets ?? []).map((t) =>
      prisma.platformTarget.update({
        where: { id: t.id },
        data: {
          title: t.title ?? undefined,
          description: t.description ?? undefined,
          tags: t.tags ?? undefined,
          platformExtra: t.platformExtra ? (t.platformExtra as Prisma.InputJsonValue) : undefined,
          firstComment: t.firstComment !== undefined ? t.firstComment || null : undefined,
        },
      })
    ),
  ]);

  const updated = await prisma.post.findUnique({
    where: { id },
    include: { targets: true, media: { include: { media: true } } },
  });
  return NextResponse.json({ post: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, include: { media: { include: { media: true } } } });
  if (!post) {
    return NextResponse.json({ error: "Post non trovato" }, { status: 404 });
  }

  for (const link of post.media) {
    try {
      await deleteMediaFile(link.media.storagePath);
    } catch {
      // best-effort: se il file non esiste più o la delete fallisce non blocchiamo la rimozione del post
    }
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
