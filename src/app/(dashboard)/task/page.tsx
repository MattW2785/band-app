import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AddTaskForm } from "@/components/tasks/add-task-form";
import { KanbanBoard, type KanbanTask } from "@/components/tasks/kanban-board";
import type { CommentWithAuthor } from "@/components/comments/comments-section";
import { getHiddenUserIds } from "@/lib/visibility";

export default async function TaskPage() {
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const hiddenIds = await getHiddenUserIds(supabase, userId, profile.role === "admin");

  const [{ data: tasks }, { data: members }, { data: events }, { data: rawComments }] = await Promise.all([
    supabase.from("tasks").select("*, profiles(full_name)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,full_name").order("full_name"),
    supabase.from("events").select("id,title").order("date"),
    supabase.from("comments").select("*").eq("parent_type", "task").order("created_at"),
  ]);

  const visibleMembers = (members ?? []).filter((m) => !hiddenIds.has(m.id));
  const nameById = new Map(visibleMembers.map((m) => [m.id, m.full_name]));

  const commentsByTask = new Map<string, CommentWithAuthor[]>();
  for (const c of rawComments ?? []) {
    if (c.user_id && hiddenIds.has(c.user_id)) continue;
    if (!commentsByTask.has(c.parent_id)) commentsByTask.set(c.parent_id, []);
    commentsByTask.get(c.parent_id)!.push({
      id: c.id,
      text: c.text,
      created_at: c.created_at,
      authorName: c.user_id ? (nameById.get(c.user_id) ?? null) : null,
    });
  }

  const kanbanTasks: KanbanTask[] = (tasks ?? [])
    .filter((t) => !t.created_by || !hiddenIds.has(t.created_by))
    .map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      due_date: t.due_date,
      status: t.status,
      assigned_to: t.assigned_to,
      assigneeName:
        t.assigned_to && !hiddenIds.has(t.assigned_to)
          ? ((t.profiles as unknown as { full_name: string | null } | null)?.full_name ?? null)
          : null,
      updatedByName: t.updated_by ? (nameById.get(t.updated_by) ?? null) : null,
      updatedAt: t.updated_at,
      comments: commentsByTask.get(t.id) ?? [],
    }));

  return (
    <div className="max-w-4xl">
      <PageHeader title="Task" description="Organizza il lavoro sporco della band" />

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900">Nuovo task</h2>
        <AddTaskForm members={visibleMembers} events={events ?? []} />
      </Card>

      <KanbanBoard initialTasks={kanbanTasks} members={visibleMembers} />
    </div>
  );
}
