"use client";

import { useActionState } from "react";
import { updateSong } from "@/app/(dashboard)/brani/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { Song } from "@/types/database";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type EditableSong = Pick<
  Song,
  "id" | "title" | "artist" | "duration_seconds" | "reference_links" | "key" | "bpm" | "notes"
>;

export function EditSongForm({ song }: { song: EditableSong }) {
  const [state, formAction, pending] = useActionState(updateSong, undefined);

  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer list-none text-xs text-zinc-400 hover:text-zinc-600">Modifica</summary>
      <form action={formAction} className="mt-2 grid grid-cols-1 gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-2">
        <input type="hidden" name="song_id" value={song.id} />
        <div>
          <Label htmlFor={`title_${song.id}`}>Titolo</Label>
          <Input id={`title_${song.id}`} name="title" defaultValue={song.title} required />
        </div>
        <div>
          <Label htmlFor={`artist_${song.id}`}>Artista (o &quot;originale&quot;)</Label>
          <Input id={`artist_${song.id}`} name="artist" defaultValue={song.artist ?? ""} />
        </div>
        <div>
          <Label htmlFor={`duration_${song.id}`}>Durata (mm:ss)</Label>
          <Input
            id={`duration_${song.id}`}
            name="duration"
            defaultValue={formatDuration(song.duration_seconds)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`reference_links_${song.id}`}>Link di riferimento (uno per riga)</Label>
          <Textarea
            id={`reference_links_${song.id}`}
            name="reference_links"
            rows={2}
            defaultValue={song.reference_links.join("\n")}
            required
          />
        </div>
        <div>
          <Label htmlFor={`key_${song.id}`}>Tonalità</Label>
          <Input id={`key_${song.id}`} name="key" defaultValue={song.key ?? ""} />
        </div>
        <div>
          <Label htmlFor={`bpm_${song.id}`}>BPM</Label>
          <Input id={`bpm_${song.id}`} name="bpm" type="number" defaultValue={song.bpm ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`notes_${song.id}`}>Note</Label>
          <Textarea id={`notes_${song.id}`} name="notes" rows={2} defaultValue={song.notes ?? ""} />
        </div>
        {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
        <div className="sm:col-span-2">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Salvataggio…" : "Salva modifiche"}
          </Button>
        </div>
      </form>
    </details>
  );
}
