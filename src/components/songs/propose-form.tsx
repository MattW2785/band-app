"use client";

import { useActionState } from "react";
import { proposeSong } from "@/app/(dashboard)/brani/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function ProposeSongForm() {
  const [state, formAction, pending] = useActionState(proposeSong, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="title">Titolo</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="artist">Artista (o &quot;originale&quot;)</Label>
        <Input id="artist" name="artist" />
      </div>
      <div>
        <Label htmlFor="duration">Durata (mm:ss)</Label>
        <Input id="duration" name="duration" placeholder="3:45" required />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="reference_links">Link di riferimento (uno per riga)</Label>
        <Textarea
          id="reference_links"
          name="reference_links"
          rows={2}
          placeholder={"https://…\nhttps://…"}
          required
        />
      </div>
      <div>
        <Label htmlFor="key">Tonalità</Label>
        <Input id="key" name="key" />
      </div>
      <div>
        <Label htmlFor="bpm">BPM</Label>
        <Input id="bpm" name="bpm" type="number" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="is_original" value="true" />
          Brano proprio (composizione originale) — comparirà in SIAE / SOUNDREEF
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : "Proponi brano"}
        </Button>
      </div>
    </form>
  );
}
