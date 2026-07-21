import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { localInputToUtcDate } from "@/lib/social/timezone";
import { Platform, TargetStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const posts = await prisma.post.findMany({
    orderBy: { scheduledAt: "desc" },
    take: 100,
    include: { targets: true, media: { include: { media: true } } },
  });
  return NextResponse.json({ posts });
}

type CreatePostBody = {
  baseCaption?: string;
  scheduledAtLocal: string;
  mediaId?: string;
  status?: string;
  targets: Array<{
    platform: Platform;
    title?: string;
    description?: string;
    tags?: string[];
    privacyStatus?: string;
    platformExtra?: Record<string, unknown>;
    firstComment?: string;
  }>;
};

export async function POST(request: NextRequest) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;
  const isAdmin = auth.session.profile.role === "admin";

  const body = (await request.json().catch(() => null)) as CreatePostBody | null;

  if (!body?.scheduledAtLocal || !body.targets?.length) {
    return NextResponse.json({ error: "Dati mancanti (data programmata o piattaforme)" }, { status: 400 });
  }

  const scheduledAt = localInputToUtcDate(body.scheduledAtLocal);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Data programmata non valida" }, { status: 400 });
  }

  // Bozza: il post viene salvato ma nessun target è in stato SCHEDULED,
  // quindi claimDueTargets non lo reclamerà mai per la pubblicazione. I membri non-admin
  // possono solo creare bozze: lo stato richiesto dal client non è attendibile, va forzato
  // qui lato server indipendentemente da cosa passa body.status.
  const status = isAdmin && body.status !== "DRAFT" ? TargetStatus.SCHEDULED : TargetStatus.DRAFT;

  const post = await prisma.post.create({
    data: {
      baseCaption: body.baseCaption || null,
      scheduledAt,
      media: body.mediaId ? { create: [{ mediaId: body.mediaId, order: 0 }] } : undefined,
      targets: {
        create: body.targets.map((t) => ({
          platform: t.platform,
          status,
          title: t.title || null,
          description: t.description || body.baseCaption || null,
          tags: t.tags ?? [],
          privacyStatus: t.privacyStatus || null,
          platformExtra: t.platformExtra ? (t.platformExtra as Prisma.InputJsonValue) : undefined,
          firstComment: t.platform === Platform.INSTAGRAM ? t.firstComment || null : null,
        })),
      },
    },
    include: { targets: true, media: { include: { media: true } } },
  });

  return NextResponse.json({ post }, { status: 201 });
}
