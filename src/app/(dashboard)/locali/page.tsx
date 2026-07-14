import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default async function LocaliPage() {
  await requireSessionProfile();
  const supabase = await createClient();

  const { data: venues } = await supabase.from("venues").select("*").order("name");

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Locali"
        description="Anagrafica di locali e promoter"
        action={
          <Link href="/locali/nuovo">
            <Button>+ Nuovo locale</Button>
          </Link>
        }
      />

      <div className="space-y-2">
        {venues?.map((v) => (
          <Link key={v.id} href={`/locali/${v.id}`}>
            <Card className="hover:border-indigo-200 hover:shadow-md">
              <p className="font-medium text-zinc-900">{v.name}</p>
              <p className="text-xs text-zinc-500">
                {v.city && `${v.city}`}
                {v.capacity && ` · capienza ${v.capacity}`}
                {v.contact_name && ` · ${v.contact_name}`}
              </p>
            </Card>
          </Link>
        ))}

        {(!venues || venues.length === 0) && <p className="text-sm text-zinc-500">Nessun locale censito ancora.</p>}
      </div>
    </div>
  );
}
