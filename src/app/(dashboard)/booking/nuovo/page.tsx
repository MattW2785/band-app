import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
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
      <Link href="/booking" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        ← Torna al booking
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Nuova trattativa</h1>

      {venues && venues.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-600">
            Devi prima censire almeno un locale.{" "}
            <Link href="/locali/nuovo" className="text-indigo-600 hover:underline">
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
