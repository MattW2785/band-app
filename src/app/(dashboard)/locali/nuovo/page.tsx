import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { VenueForm } from "@/components/venues/venue-form";
import { createVenue } from "../actions";

export default async function NuovoLocalePage() {
  await requireSessionProfile();

  return (
    <div className="max-w-2xl">
      <BackLink href="/locali">Torna ai locali</BackLink>
      <h1 className="mb-6 mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Nuovo locale</h1>
      <Card>
        <VenueForm action={createVenue} submitLabel="Crea locale" />
      </Card>
    </div>
  );
}
