import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { BookingLeadForm } from "@/components/booking/booking-lead-form";
import { createBookingLead } from "../actions";

export default async function NuovaTrattativaPage() {
  await requireSessionProfile();
  const supabase = await createClient();

  const [{ data: venues }, { data: members }] = await Promise.all([
    supabase.from("venues").select("id,name").order("name"),
    supabase.from("profiles").select("id,full_name").order("full_name"),
  ]);

  return (
    <div className="max-w-2xl">
      <BackLink href="/booking">Torna al booking</BackLink>
      <h1 className="mb-6 mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Nuova trattativa</h1>

      {venues && venues.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Devi prima censire almeno un locale.{" "}
            <Link href="/locali/nuovo" className="text-violet-600 dark:text-violet-400 hover:underline">
              Crea il primo locale →
            </Link>
          </p>
        </Card>
      ) : (
        <Card>
          <BookingLeadForm
            action={createBookingLead}
            venues={venues ?? []}
            members={members ?? []}
            submitLabel="Crea trattativa"
          />
        </Card>
      )}
    </div>
  );
}
