import { TargetStatus } from "@/generated/prisma/enums";

// Sotto questa soglia un post non è più modificabile: evita che una modifica arrivi
// mentre il cron sta per reclamare (o ha già reclamato) il target per la pubblicazione.
export const EDIT_CUTOFF_MS = 15 * 60 * 1000;

export function isPostEditable(post: {
  scheduledAt: Date;
  targets: { status: TargetStatus; scheduledAt: Date | null }[];
}): boolean {
  if (!post.targets.every((t) => t.status === TargetStatus.SCHEDULED)) return false;

  const earliest = Math.min(...post.targets.map((t) => (t.scheduledAt ?? post.scheduledAt).getTime()));
  return earliest - Date.now() > EDIT_CUTOFF_MS;
}
