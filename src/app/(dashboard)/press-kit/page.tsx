import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LastEdited } from "@/components/ui/last-edited";
import { PressKitForm } from "./form";

export default async function PressKitPage() {
  await requireSessionProfile();
  const supabase = await createClient();

  const { data: pressKit } = await supabase.from("press_kit").select("*").maybeSingle();

  const editorName = pressKit?.updated_by
    ? (await supabase.from("profiles").select("full_name").eq("id", pressKit.updated_by).single()).data
        ?.full_name ?? null
    : null;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Press kit (EPK)"
        description="Il kit da mandare a locali, festival e promoter"
        action={
          <Link href="/epk" target="_blank">
            <Button variant="secondary">Apri pagina pubblica →</Button>
          </Link>
        }
      />
      {pressKit && <LastEdited name={editorName} at={pressKit.updated_at} className="mb-4 text-xs text-zinc-400 dark:text-zinc-500" />}
      <Card>
        <PressKitForm initial={pressKit} />
      </Card>
    </div>
  );
}
