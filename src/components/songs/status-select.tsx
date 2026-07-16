"use client";

import { useRef, useState } from "react";
import { updateSongStatus } from "@/app/(dashboard)/brani/actions";
import { Select } from "@/components/ui/input";
import type { SongStatus } from "@/types/database";

const STATUS_OPTIONS: { value: SongStatus; label: string }[] = [
  { value: "proposto", label: "Proposto" },
  { value: "in_prova", label: "In prova" },
  { value: "pronto_live", label: "Pronto live" },
  { value: "scartato", label: "Scartato" },
];

export function StatusSelect({ songId, status }: { songId: string; status: SongStatus }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState(status);

  return (
    <form ref={formRef} action={updateSongStatus}>
      <input type="hidden" name="song_id" value={songId} />
      <Select
        name="status"
        value={value}
        className="py-1 text-xs"
        onChange={(e) => {
          setValue(e.target.value as SongStatus);
          formRef.current?.requestSubmit();
        }}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </form>
  );
}
