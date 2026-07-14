"use client";

import { deleteEquipment } from "@/app/(dashboard)/attrezzatura/actions";

export function DeleteEquipmentButton({ equipmentId }: { equipmentId: string }) {
  return (
    <form
      action={deleteEquipment}
      onSubmit={(e) => {
        if (!confirm("Eliminare questa attrezzatura?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={equipmentId} />
      <button type="submit" className="text-xs text-zinc-400 hover:text-red-500">
        Elimina
      </button>
    </form>
  );
}
