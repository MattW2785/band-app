import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { BookingBoard, type BookingCardData } from "@/components/booking/booking-board";
import { getHiddenUserIds } from "@/lib/visibility";

export default async function BookingPage() {
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const [hiddenIds, { data: leads }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("booking_leads").select("*, venues(name, city)").order("created_at", { ascending: false }),
  ]);

  const cards: BookingCardData[] = (leads ?? [])
    .filter((l) => !l.created_by || !hiddenIds.has(l.created_by))
    .map((l) => {
      const venue = l.venues as unknown as { name: string; city: string | null };
      return {
        id: l.id,
        venueName: venue?.name ?? "—",
        venueCity: venue?.city ?? null,
        status: l.status,
        proposedDate: l.proposed_date,
        feeProposed: l.fee_proposed,
        followUpDate: l.follow_up_date,
      };
    });

  return (
    <div>
      <PageHeader
        title="Booking"
        description="Pipeline delle trattative con locali e promoter"
        action={
          <Link href="/booking/nuovo">
            <Button>+ Nuova trattativa</Button>
          </Link>
        }
      />
      <BookingBoard initialLeads={cards} />
    </div>
  );
}
