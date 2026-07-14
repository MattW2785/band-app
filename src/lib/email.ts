import "server-only";
import { Resend } from "resend";
import type { createClient } from "@/lib/supabase/server";
import type { NotificationPreference } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type NotifyField = keyof Omit<NotificationPreference, "user_id" | "email_enabled">;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "BandSpace <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) return;
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch {
    // Non blocchiamo mai l'azione dell'utente se l'invio email fallisce
    // (es. dominio Resend non ancora verificato, provider momentaneamente giù).
  }
}

async function getSubscribedMembers(supabase: SupabaseServerClient, field: NotifyField, excludeUserId?: string) {
  const [{ data: profiles }, { data: prefs }] = await Promise.all([
    supabase.from("profiles").select("id, email"),
    supabase.from("notification_preferences").select("*"),
  ]);

  const prefByUser = new Map((prefs ?? []).map((p) => [p.user_id, p]));

  return (profiles ?? []).filter((p) => {
    if (p.id === excludeUserId || !p.email) return false;
    const pref = prefByUser.get(p.id);
    if (!pref) return true; // nessuna preferenza salvata = impostazioni di default (tutto attivo)
    return pref.email_enabled && pref[field];
  });
}

export async function notifyNewSong(
  supabase: SupabaseServerClient,
  songTitle: string,
  proposedByName: string,
  proposedByUserId: string
) {
  const recipients = await getSubscribedMembers(supabase, "notify_new_song", proposedByUserId);

  await Promise.all(
    recipients.map((r) =>
      sendEmail(
        r.email!,
        `Nuovo brano proposto: ${songTitle}`,
        `<p>${proposedByName} ha proposto un nuovo brano: <strong>${songTitle}</strong>.</p><p>Vai su BandSpace per votarlo.</p>`
      )
    )
  );
}

export async function notifyTaskAssigned(supabase: SupabaseServerClient, taskTitle: string, assignedToUserId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", assignedToUserId)
    .single();

  if (!profile?.email) return;

  const { data: pref } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", assignedToUserId)
    .maybeSingle();

  if (pref && (!pref.email_enabled || !pref.notify_task_assigned)) return;

  await sendEmail(
    profile.email,
    `Nuovo task assegnato: ${taskTitle}`,
    `<p>Ti è stato assegnato un nuovo task su BandSpace: <strong>${taskTitle}</strong>.</p>`
  );
}

export async function notifyBookingUpdate(
  supabase: SupabaseServerClient,
  venueName: string,
  statusLabel: string,
  triggeredByUserId: string
) {
  const recipients = await getSubscribedMembers(supabase, "notify_booking_update", triggeredByUserId);

  await Promise.all(
    recipients.map((r) =>
      sendEmail(
        r.email!,
        `Trattativa aggiornata: ${venueName}`,
        `<p>La trattativa con <strong>${venueName}</strong> è passata allo stato "${statusLabel}".</p>`
      )
    )
  );
}
