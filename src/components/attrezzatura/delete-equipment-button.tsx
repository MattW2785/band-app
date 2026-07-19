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
      <button type="submit" className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400">
        Elimina
      </button>
    </form>
  );
}
