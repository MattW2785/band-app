"use client";

import { updateEquipmentMaintenance } from "@/app/(dashboard)/attrezzatura/actions";

export function UpdateMaintenanceForm({ equipmentId, value }: { equipmentId: string; value: string | null }) {
  return (
    <form action={updateEquipmentMaintenance} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={equipmentId} />
      <input
        type="date"
        name="last_maintenance_date"
        defaultValue={value ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600"
      />
    </form>
  );
}
