"use client";

import { useActionState, useState } from "react";
import { addEquipment } from "@/app/(dashboard)/attrezzatura/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

const CATEGORY_LABEL: Record<string, string> = {
  chitarra: "Chitarra",
  basso: "Basso",
  batteria: "Batteria",
  ampli: "Ampli",
  microfoni: "Microfoni",
  cavi: "Cavi",
  altro: "Altro",
};

export function AddEquipmentForm({ members }: { members: { id: string; full_name: string | null }[] }) {
  const [state, formAction, pending] = useActionState(addEquipment, undefined);
  const [ownerType, setOwnerType] = useState("band");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="category">Categoria</Label>
        <Select id="category" name="category" defaultValue="altro">
          {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="owner_type">Proprietario</Label>
        <Select
          id="owner_type"
          name="owner_type"
          value={ownerType}
          onChange={(e) => setOwnerType(e.target.value)}
        >
          <option value="band">Band</option>
          <option value="membro">Un membro</option>
        </Select>
      </div>
      {ownerType === "membro" && (
        <div>
          <Label htmlFor="owner_id">Membro</Label>
          <Select id="owner_id" name="owner_id" defaultValue="">
            <option value="" disabled>
              Seleziona…
            </option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="last_maintenance_date">Ultima manutenzione</Label>
        <Input id="last_maintenance_date" name="last_maintenance_date" type="date" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : "Aggiungi attrezzatura"}
        </Button>
      </div>
    </form>
  );
}
