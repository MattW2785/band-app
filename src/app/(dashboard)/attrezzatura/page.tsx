import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { AddEquipmentForm } from "@/components/attrezzatura/add-equipment-form";
import { DeleteEquipmentButton } from "@/components/attrezzatura/delete-equipment-button";
import { UpdateMaintenanceForm } from "@/components/attrezzatura/update-maintenance-form";
import type { EquipmentCategory } from "@/types/database";

const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  chitarra: "Chitarra",
  basso: "Basso",
  batteria: "Batteria",
  ampli: "Ampli",
  microfoni: "Microfoni",
  cavi: "Cavi",
  altro: "Altro",
};

export default async function AttrezzaturaPage() {
  await requireSessionProfile();
  const supabase = await createClient();

  const [{ data: equipment }, { data: members }] = await Promise.all([
    supabase.from("equipment").select("*").order("category").order("name"),
    supabase.from("profiles").select("id,full_name").order("full_name"),
  ]);

  const nameById = new Map((members ?? []).map((m) => [m.id, m.full_name]));

  const byCategory = new Map<EquipmentCategory, typeof equipment>();
  for (const item of equipment ?? []) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category)!.push(item);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Attrezzatura" description="Inventario degli strumenti e dell'equipaggiamento della band" />

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900">Nuova attrezzatura</h2>
        <AddEquipmentForm members={members ?? []} />
      </Card>

      <div className="space-y-6">
        {Array.from(byCategory.entries()).map(([category, items]) => (
          <div key={category}>
            <h2 className="mb-2 text-sm font-semibold text-zinc-700">{CATEGORY_LABEL[category]}</h2>
            <Card className="divide-y divide-zinc-100 p-0">
              {items?.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      <Badge variant={item.owner_type === "band" ? "indigo" : "neutral"} className="align-middle">
                        {item.owner_type === "band" ? "Band" : (nameById.get(item.owner_id ?? "") ?? "Membro")}
                      </Badge>
                      {item.notes && ` · ${item.notes}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-zinc-400">Ultima manutenzione</p>
                      <UpdateMaintenanceForm equipmentId={item.id} value={item.last_maintenance_date} />
                    </div>
                    <DeleteEquipmentButton equipmentId={item.id} />
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}

        {(!equipment || equipment.length === 0) && (
          <p className="text-sm text-zinc-500">Nessuna attrezzatura censita ancora.</p>
        )}
      </div>
    </div>
  );
}
