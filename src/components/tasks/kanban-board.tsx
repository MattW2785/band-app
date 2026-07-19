"use client";

import { useMemo, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { updateTaskStatus, deleteTask } from "@/app/(dashboard)/task/actions";
import { Select } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { LastEdited } from "@/components/ui/last-edited";
import { CollapsibleComments, type CommentWithAuthor } from "@/components/comments/comments-section";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/database";

export interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  assigneeName: string | null;
  updatedByName: string | null;
  updatedAt: string;
  comments: CommentWithAuthor[];
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "da_fare", label: "Da fare" },
  { status: "in_corso", label: "In corso" },
  { status: "fatto", label: "Fatto" },
];

function TaskCard({ task, onDelete }: { task: KanbanTask; onDelete: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      className={cn(
        "group relative cursor-grab touch-none rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (confirm("Eliminare questo task?")) onDelete(task.id);
        }}
        className="absolute right-2 top-2 hidden text-xs text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 group-hover:block"
        aria-label="Elimina task"
      >
        ✕
      </button>
      <p className="pr-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{task.title}</p>
      {task.description && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{task.description}</p>}
      <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
        {task.assigneeName ? (
          <span className="flex items-center gap-1.5">
            <Avatar name={task.assigneeName} className="h-5 w-5 text-[10px]" />
            {task.assigneeName}
          </span>
        ) : (
          <span>Non assegnato</span>
        )}
        {task.due_date && <span>{format(parseISO(task.due_date), "dd-MM-yyyy")}</span>}
      </div>
      <LastEdited name={task.updatedByName} at={task.updatedAt} className="mt-1.5 text-[11px] text-zinc-300 dark:text-zinc-600" />
      <div onPointerDown={(e) => e.stopPropagation()} className="cursor-auto">
        <CollapsibleComments
          comments={task.comments}
          parentType="task"
          parentId={task.id}
          revalidatePath="/task"
        />
      </div>
    </div>
  );
}

const DONE_PREVIEW_COUNT = 3;

function Column({
  status,
  label,
  tasks,
  onDelete,
}: {
  status: TaskStatus;
  label: string;
  tasks: KanbanTask[];
  onDelete: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const isDone = status === "fatto";
  const sorted = isDone
    ? [...tasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    : tasks;
  const visible = isDone ? sorted.slice(0, DONE_PREVIEW_COUNT) : sorted;
  const archived = isDone ? sorted.slice(DONE_PREVIEW_COUNT) : [];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-800/60 p-3 transition-colors",
        isOver && "border-indigo-200 bg-indigo-50/60"
      )}
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {label} <span className="font-normal text-zinc-400 dark:text-zinc-500">({tasks.length})</span>
      </h3>
      <div className="space-y-2">
        {visible.map((t) => (
          <TaskCard key={t.id} task={t} onDelete={onDelete} />
        ))}
      </div>
      {archived.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer list-none text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            📦 Archivio ({archived.length})
          </summary>
          <div className="mt-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-2">
            {archived.map((t) => (
              <TaskCard key={t.id} task={t} onDelete={onDelete} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export function KanbanBoard({
  initialTasks,
  members,
}: {
  initialTasks: KanbanTask[];
  members: { id: string; full_name: string | null }[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const filtered = useMemo(
    () => (assigneeFilter ? tasks.filter((t) => t.assigned_to === assigneeFilter) : tasks),
    [tasks, assigneeFilter]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    const taskId = active.id as string;

    setTasks((current) => current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    startTransition(() => {
      updateTaskStatus(taskId, newStatus);
    });
  }

  function handleDelete(taskId: string) {
    setTasks((current) => current.filter((t) => t.id !== taskId));
    startTransition(() => {
      deleteTask(taskId);
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">Filtra per assegnatario:</label>
        <Select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="w-auto"
        >
          <option value="">Tutti</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </Select>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-3 sm:flex-row">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={filtered.filter((t) => t.status === col.status)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
