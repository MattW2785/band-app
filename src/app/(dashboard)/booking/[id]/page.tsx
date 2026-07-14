import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LastEdited } from "@/components/ui/last-edited";
import { BookingLeadForm } from "@/components/booking/booking-lead-form";
import { BookingStatusSelect } from "@/components/booking/booking-status-select";
import { DeleteBookingButton } from "@/components/booking/delete-booking-button";
import { CommentsSection } from "@/components/comments/comments-section";
import { updateBookingDetails } from "../actions";

export default async function BookingLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSessionProfile();
  const supabase = await createClient();

  const { data: lead } = await supabase.from("booking_leads").select("*, venues(name)").eq("id", id).single();
  if (!lead) notFound();

  const [{ data: venues }, { data: members }, { data: rawComments }] = await Promise.all([
    supabase.from("venues").select("id,name").order("name"),
    supabase.from("profiles").select("id,full_name").order("full_name"),
    supabase.from("comments").select("*").eq("parent_type", "booking_lead").eq("parent_id", id).order("created_at"),
  ]);

  const nameById = new Map((members ?? []).map((m) => [m.id, m.full_name]));
  const comments = (rawComments ?? []).map((c) => ({
    id: c.id,
    text: c.text,
    created_at: c.created_at,
    authorName: c.user_id ? (nameById.get(c.user_id) ?? null) : null,
  }));

  const editorName = lead.updated_by
    ? (await supabase.from("profiles").select("full_name").eq("id", lead.updated_by).single()).data?.full_name ??
      null
    : null;

  const venueName = (lead.venues as unknown as { name: string } | null)?.name ?? "—";

  return (
    <div className="max-w-2xl">
      <Link href="/booking" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        ← Torna al booking
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{venueName}</h1>
      <LastEdited name={editorName} at={lead.updated_at} className="mb-6 text-xs text-zinc-400" />

      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-zinc-900">Stato trattativa</h2>
          <BookingStatusSelect bookingId={lead.id} status={lead.status} />
        </div>
        {lead.event_id && (
          <Link href={`/eventi/${lead.event_id}`}>
            <Button variant="secondary">Apri evento collegato →</Button>
          </Link>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-medium text-zinc-900">Dettagli</h2>
        <BookingLeadForm
          action={updateBookingDetails}
          initial={lead}
          venues={venues ?? []}
          members={members ?? []}
          submitLabel="Salva modifiche"
        />
      </Card>

      <Card className="mb-4">
        <CommentsSection
          comments={comments}
          parentType="booking_lead"
          parentId={lead.id}
          revalidatePath={`/booking/${lead.id}`}
        />
      </Card>

      <DeleteBookingButton bookingId={lead.id} />
    </div>
  );
}
