import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { ActivityAction, ActivityEntityType, ActivityLog } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Registra un'azione nel registro attività (visibile solo agli admin in /registro).
 * Non deve mai bloccare l'azione principale dell'utente: eventuali errori vengono ignorati.
 * Per le eliminazioni, passa uno `snapshot` con la riga completa: è l'unico modo per poterla
 * ripristinare in seguito dal registro.
 */
export async function logActivity(
  supabase: SupabaseServerClient,
  userId: string,
  action: ActivityAction,
  entityType: ActivityEntityType,
  entityLabel?: string | null,
  detail?: string | null,
  snapshot?: Record<string, unknown> | null
) {
  try {
    await supabase.from("activity_log").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_label: entityLabel ?? null,
      detail: detail ?? null,
      snapshot: snapshot ?? null,
    });
  } catch {
    // il registro attività non deve mai far fallire l'azione che lo ha generato
  }
}

// entity_type per cui esiste una tabella diretta in cui reinserire lo snapshot.
// "member" è escluso: eliminare un membro cancella il suo account Supabase Auth,
// non ripristinabile con un semplice insert — va reinvitato da /membri.
const RESTORABLE_ENTITY_TYPES: ActivityEntityType[] = [
  "song",
  "event",
  "task",
  "setlist",
  "venue",
  "booking_lead",
  "transaction",
  "comment",
  "media_item",
  "equipment",
  "original_work",
];

export function isRestorable(entry: Pick<ActivityLog, "action" | "entity_type" | "snapshot" | "restored_at">) {
  return (
    entry.action === "deleted" &&
    !entry.restored_at &&
    !!entry.snapshot &&
    RESTORABLE_ENTITY_TYPES.includes(entry.entity_type)
  );
}

export type RestoreResult = { error?: string };

/** Reinserisce l'elemento eliminato a partire dallo snapshot salvato nel registro. */
export async function restoreActivity(
  supabase: SupabaseServerClient,
  logId: string,
  adminUserId: string
): Promise<RestoreResult> {
  const { data: entry } = await supabase.from("activity_log").select("*").eq("id", logId).single();

  if (!entry || !isRestorable(entry)) {
    return { error: "Questo elemento non può essere ripristinato." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapshot = entry.snapshot as any;

  switch (entry.entity_type) {
    case "song": {
      const { error } = await supabase.from("songs").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito: il brano potrebbe già esistere." };
      if (Array.isArray(snapshot.votes) && snapshot.votes.length > 0) {
        await supabase.from("votes").insert(snapshot.votes);
      }
      break;
    }
    case "task": {
      const { error } = await supabase.from("tasks").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito." };
      break;
    }
    case "event": {
      const { error } = await supabase.from("events").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito." };
      break;
    }
    case "setlist": {
      const { error } = await supabase.from("setlists").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito." };
      if (Array.isArray(snapshot.items) && snapshot.items.length > 0) {
        await supabase.from("setlist_items").insert(snapshot.items);
      }
      break;
    }
    case "venue": {
      const { error } = await supabase.from("venues").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito." };
      break;
    }
    case "booking_lead": {
      const { error } = await supabase.from("booking_leads").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito." };
      break;
    }
    case "transaction": {
      const { error } = await supabase.from("transactions").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito." };
      break;
    }
    case "comment": {
      const { error } = await supabase.from("comments").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito." };
      break;
    }
    case "media_item": {
      const { error } = await supabase.from("media_items").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito." };
      break;
    }
    case "equipment": {
      const { error } = await supabase.from("equipment").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito." };
      break;
    }
    case "original_work": {
      const { error } = await supabase.from("original_works").insert(snapshot.row);
      if (error) return { error: "Ripristino fallito: il brano potrebbe avere già un deposito SIAE." };
      break;
    }
    default:
      return { error: "Questo tipo di elemento non può essere ripristinato." };
  }

  await supabase
    .from("activity_log")
    .update({ restored_at: new Date().toISOString(), restored_by: adminUserId })
    .eq("id", logId);
  await logActivity(supabase, adminUserId, "restored", entry.entity_type, entry.entity_label);

  return {};
}

const TASK_STATUS_LABEL: Record<string, string> = { da_fare: "Da fare", in_corso: "In corso", fatto: "Fatto" };

/** Trasforma una riga del registro in una frase leggibile in italiano. */
export function describeActivity(entry: Pick<ActivityLog, "action" | "entity_type" | "entity_label" | "detail">) {
  const label = entry.entity_label ? `«${entry.entity_label}»` : "senza nome";
  const { action, entity_type: type, detail } = entry;

  if (action === "restored") return `ha ripristinato ${label}`;

  switch (type) {
    case "song":
      if (action === "created") return `ha proposto il brano ${label}`;
      if (action === "status_changed") return `ha cambiato lo stato del brano ${label} in "${detail}"`;
      if (action === "voted") return `ha votato il brano ${label} (${detail})`;
      if (action === "deleted") return `ha eliminato il brano ${label}`;
      break;
    case "event":
      if (action === "created") return `ha creato l'evento ${label}`;
      if (action === "updated") return `ha modificato l'evento ${label}${detail ? ` (${detail})` : ""}`;
      if (action === "deleted") return `ha eliminato l'evento ${label}`;
      break;
    case "task":
      if (action === "created") return `ha creato il task ${label}`;
      if (action === "status_changed")
        return `ha spostato il task ${label} in "${TASK_STATUS_LABEL[detail ?? ""] ?? detail}"`;
      if (action === "deleted") return `ha eliminato il task ${label}`;
      break;
    case "setlist":
      if (action === "created") return `ha generato la scaletta ${label}${detail ? ` (${detail})` : ""}`;
      if (action === "updated") return `ha aggiornato la scaletta ${label}${detail ? `: ${detail}` : ""}`;
      if (action === "deleted") return `ha eliminato la scaletta ${label}`;
      break;
    case "venue":
      if (action === "created") return `ha aggiunto il locale ${label}`;
      if (action === "updated") return `ha modificato il locale ${label}`;
      if (action === "deleted") return `ha eliminato il locale ${label}`;
      break;
    case "booking_lead":
      if (action === "created") return `ha avviato una trattativa con ${label}`;
      if (action === "updated") return `ha aggiornato la trattativa con ${label}`;
      if (action === "status_changed") return `ha portato la trattativa con ${label} a "${detail}"`;
      if (action === "deleted") return `ha eliminato la trattativa con ${label}`;
      break;
    case "transaction":
      if (action === "created") return `ha registrato un movimento ${label}${detail ? ` (${detail})` : ""}`;
      if (action === "deleted") return `ha eliminato un movimento ${label}${detail ? ` (${detail})` : ""}`;
      break;
    case "member":
      if (action === "invited") return `ha invitato ${label}`;
      if (action === "deleted") return `ha rimosso il membro ${label}`;
      break;
    case "profile":
      if (action === "updated") return `ha aggiornato il proprio profilo (nome: ${entry.entity_label})`;
      break;
    case "availability":
      if (action === "updated") return `ha aggiornato la propria disponibilità per il ${entry.entity_label}`;
      break;
    case "comment":
      if (action === "created") return `ha commentato ${label}${detail ? `: "${detail}"` : ""}`;
      if (action === "deleted") return `ha eliminato un commento su ${label}`;
      break;
    case "media_item":
      if (action === "created") return `ha caricato il file ${label}`;
      if (action === "deleted") return `ha eliminato il file ${label}`;
      break;
    case "equipment":
      if (action === "created") return `ha aggiunto l'attrezzatura ${label}`;
      if (action === "updated") return `ha modificato l'attrezzatura ${label}`;
      if (action === "deleted") return `ha eliminato l'attrezzatura ${label}`;
      break;
    case "original_work":
      if (action === "created") return `ha aggiunto i dati SIAE per ${label}`;
      if (action === "updated") return `ha aggiornato i dati SIAE per ${label}`;
      if (action === "deleted") return `ha eliminato i dati SIAE per ${label}`;
      break;
  }

  return `${action} ${type} ${label}`;
}
