import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LastEdited } from "@/components/ui/last-edited";
import { AddStagePlotItemForm } from "@/components/stage-plot/add-item-form";
import { DeleteStagePlotItemButton } from "@/components/stage-plot/delete-item-button";
import { getHiddenUserIds } from "@/lib/visibility";

export default async function StagePlotPage() {
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();

  const [hiddenIds, { data: rawItems }, { data: rawMembers }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("stage_plot_items").select("*").order("created_at"),
    supabase.from("profiles").select("id,full_name"),
  ]);

  const members = (rawMembers ?? []).filter((m) => !hiddenIds.has(m.id));
  const nameById = new Map(members.map((m) => [m.id, m.full_name]));
  const items = (rawItems ?? []).filter((i) => !i.created_by || !hiddenIds.has(i.created_by));

  return (
    <div className="max-w-2xl">
      <PageHeader title="Stage Plot" description="Disposizione di strumenti e postazioni sul palco" />

      <Card className="mb-6 bg-zinc-50 text-sm text-zinc-600">
        Lo stage plot indica al fonico/organizzatore dove posizionare strumenti, amplificatori e microfoni sul
        palco prima del vostro arrivo. Elencate ogni strumento con la sua posizione (es. &quot;palco sinistra&quot;,
        &quot;centro&quot;, &quot;palco destra&quot;).
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900">Aggiungi un elemento</h2>
        <AddStagePlotItemForm />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium text-zinc-900">Elenco</h2>
        <ul className="divide-y divide-zinc-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-zinc-900">
                  {item.instrument} <span className="font-normal text-zinc-500">— {item.position}</span>
                </p>
                {item.notes && <p className="mt-0.5 text-xs text-zinc-500">{item.notes}</p>}
                <LastEdited
                  name={item.updated_by ? (nameById.get(item.updated_by) ?? null) : null}
                  at={item.updated_at}
                  className="mt-1 text-[11px] text-zinc-400"
                />
              </div>
              <DeleteStagePlotItemButton id={item.id} />
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="text-sm text-zinc-500">Nessun elemento aggiunto ancora.</p>}
      </Card>
    </div>
  );
}
