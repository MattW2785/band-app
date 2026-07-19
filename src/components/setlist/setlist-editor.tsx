"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderSetlist, removeSongFromSetlist } from "@/app/(dashboard)/scalette/actions";
import { Button } from "@/components/ui/button";

export interface SetlistSongItem {
  songId: string;
  title: string;
  artist: string | null;
  durationSeconds: number;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function SortableRow({ item, setlistId }: { item: SetlistSongItem; setlistId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.songId });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center justify-between gap-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 px-3 py-2 shadow-sm ${isDragging ? "opacity-60 shadow-md" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Trascina per riordinare"
        >
          ⠿
        </button>
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.title} {item.artist && <span className="font-normal text-zinc-500 dark:text-zinc-400">— {item.artist}</span>}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDuration(item.durationSeconds)}</p>
        </div>
      </div>
      <form action={removeSongFromSetlist}>
        <input type="hidden" name="setlist_id" value={setlistId} />
        <input type="hidden" name="song_id" value={item.songId} />
        <Button type="submit" variant="ghost" className="text-red-500 dark:text-red-400">
          Rimuovi
        </Button>
      </form>
    </li>
  );
}

export function SetlistEditor({
  setlistId,
  initialItems,
  targetMinutes,
}: {
  setlistId: string;
  initialItems: SetlistSongItem[];
  targetMinutes: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const totalSeconds = items.reduce((sum, i) => sum + i.durationSeconds, 0);
  const targetSeconds = targetMinutes * 60;
  const progressPct = targetSeconds > 0 ? Math.min(100, (totalSeconds / targetSeconds) * 100) : 0;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const oldIndex = current.findIndex((i) => i.songId === active.id);
      const newIndex = current.findIndex((i) => i.songId === over.id);
      const next = arrayMove(current, oldIndex, newIndex);
      startTransition(() => {
        reorderSetlist(setlistId, next.map((i) => i.songId));
      });
      return next;
    });
  }

  return (
    <div>
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            Durata totale <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatDuration(totalSeconds)}</span>
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">target {targetMinutes} min</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.songId)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((item) => (
              <SortableRow key={item.songId} item={item} setlistId={setlistId} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {items.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun brano in scaletta.</p>}
    </div>
  );
}
