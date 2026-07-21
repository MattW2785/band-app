import { prisma } from "@/lib/social/prisma";
import { deleteMediaFile } from "@/lib/social/storage/r2";
import { TargetStatus } from "@/generated/prisma/enums";

const TERMINAL_STATUSES: TargetStatus[] = [TargetStatus.PUBLISHED, TargetStatus.FAILED, TargetStatus.CANCELED];

// I video/immagini servono su R2 solo finché non sono stati recuperati da
// YouTube/Instagram: una volta che ogni target del post è in uno stato finale, il file
// non serve più e va cancellato per non riempire lo storage gratuito.
export async function cleanupPostMediaIfDone(postId: string): Promise<void> {
  const targets = await prisma.platformTarget.findMany({ where: { postId } });
  const allTerminal = targets.every((t) => TERMINAL_STATUSES.includes(t.status));
  if (!allTerminal) return;

  const postMediaLinks = await prisma.postMedia.findMany({
    where: { postId },
    include: { media: true },
  });

  for (const link of postMediaLinks) {
    const otherUsages = await prisma.postMedia.findMany({
      where: { mediaId: link.mediaId, postId: { not: postId } },
      include: { post: { include: { targets: true } } },
    });
    const usedElsewhereAndNotDone = otherUsages.some(
      (u) => !u.post.targets.every((t) => TERMINAL_STATUSES.includes(t.status))
    );
    if (usedElsewhereAndNotDone) continue;

    try {
      await deleteMediaFile(link.media.storagePath);
    } catch {
      // non bloccare il flusso di pubblicazione per un errore di pulizia: si ritenterà
      // implicitamente alla prossima chiamata (deleteMediaFile su un file già rimosso non fallisce).
    }
  }

  for (const target of targets) {
    const extra = (target.platformExtra as { thumbnailStoragePath?: string } | null) ?? {};
    if (!extra.thumbnailStoragePath) continue;
    try {
      await deleteMediaFile(extra.thumbnailStoragePath);
    } catch {
      // vedi sopra
    }
  }
}
