import Link from "next/link";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { VenueForm } from "@/components/venues/venue-form";
import { createVenue } from "../actions";

export default async function NuovoLocalePage() {
  await requireSessionProfile();

  return (
    <div className="max-w-2xl">
      <Link href="/locali" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        ← Torna ai locali
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Nuovo locale</h1>
      <Card>
        <VenueForm action={createVenue} submitLabel="Crea locale" />
      </Card>
    </div>
  );
}
