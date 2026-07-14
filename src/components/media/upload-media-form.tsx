"use client";

import { useActionState, useRef } from "react";
import { uploadMediaItem } from "@/app/(dashboard)/media/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

const TYPE_LABEL: Record<string, string> = {
  audio: "Audio",
  video: "Video",
  immagine: "Immagine",
  documento: "Documento",
};

export function UploadMediaForm({
  songs,
  events,
}: {
  songs: { id: string; title: string }[];
  events: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(uploadMediaItem, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    await formAction(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="title">Titolo</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue="audio">
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="related_song_id">Brano collegato (opzionale)</Label>
        <Select id="related_song_id" name="related_song_id" defaultValue="">
          <option value="">Nessuno</option>
          {songs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="related_event_id">Evento collegato (opzionale)</Label>
        <Select id="related_event_id" name="related_event_id" defaultValue="">
          <option value="">Nessuno</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="file">File (max 50MB)</Label>
        <Input id="file" name="file" type="file" required />
      </div>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Caricamento…" : "Carica file"}
        </Button>
      </div>
    </form>
  );
}
