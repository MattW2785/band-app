"use client";

import { useActionState } from "react";
import { updatePressKit } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { PressKit } from "@/types/database";

export function PressKitForm({ initial }: { initial: PressKit | null }) {
  const [state, formAction, pending] = useActionState(updatePressKit, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="band_name">Nome della band</Label>
        <Input id="band_name" name="band_name" defaultValue={initial?.band_name ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="bio_short">Bio breve</Label>
        <Textarea id="bio_short" name="bio_short" rows={2} defaultValue={initial?.bio_short ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="bio_long">Bio estesa</Label>
        <Textarea id="bio_long" name="bio_long" rows={5} defaultValue={initial?.bio_long ?? ""} />
      </div>
      <div>
        <Label htmlFor="contact_email">Email di contatto</Label>
        <Input id="contact_email" name="contact_email" type="email" defaultValue={initial?.contact_email ?? ""} />
      </div>
      <div>
        <Label htmlFor="stage_plot_url">Link stage plot</Label>
        <Input
          id="stage_plot_url"
          name="stage_plot_url"
          placeholder="https://…"
          defaultValue={initial?.stage_plot_url ?? ""}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="tech_rider_url">Link rider tecnico</Label>
        <Input
          id="tech_rider_url"
          name="tech_rider_url"
          placeholder="https://…"
          defaultValue={initial?.tech_rider_url ?? ""}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="photo_urls">Link foto (uno per riga)</Label>
        <Textarea id="photo_urls" name="photo_urls" rows={3} defaultValue={initial?.photo_urls?.join("\n") ?? ""} />
      </div>
      <div>
        <Label htmlFor="audio_links">Link audio (uno per riga)</Label>
        <Textarea id="audio_links" name="audio_links" rows={3} defaultValue={initial?.audio_links?.join("\n") ?? ""} />
      </div>
      <div>
        <Label htmlFor="video_links">Link video (uno per riga)</Label>
        <Textarea id="video_links" name="video_links" rows={3} defaultValue={initial?.video_links?.join("\n") ?? ""} />
      </div>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600 sm:col-span-2">{state.success}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : "Salva"}
        </Button>
      </div>
    </form>
  );
}
