import { addSongToSetlist } from "@/app/(dashboard)/scalette/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

export function AddSongForm({
  setlistId,
  availableSongs,
}: {
  setlistId: string;
  availableSongs: { id: string; title: string; artist: string | null }[];
}) {
  if (availableSongs.length === 0) return null;

  return (
    <form action={addSongToSetlist} className="flex items-end gap-2">
      <input type="hidden" name="setlist_id" value={setlistId} />
      <div className="flex-1">
        <Select name="song_id" defaultValue="" required>
          <option value="" disabled>
            Aggiungi un brano…
          </option>
          {availableSongs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} {s.artist && `— ${s.artist}`}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="secondary">
        Aggiungi
      </Button>
    </form>
  );
}
