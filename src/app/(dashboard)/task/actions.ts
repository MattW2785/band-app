"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyTaskAssigned } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";
import type { TaskStatus } from "@/types/database";

const AddTaskSchema = z.object({
  title: z.string().trim().min(1, { message: "Inserisci un titolo." }),
  description: z.string().trim().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  related_event_id: z.string().optional(),
});

export type AddTaskState = { error?: string } | undefined;

export async function addTask(_prevState: AddTaskState, formData: FormData): Promise<AddTaskState> {
  const { userId } = await requireSessionProfile();

  const parsed = AddTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    assigned_to: formData.get("assigned_to") || undefined,
    due_date: formData.get("due_date") || undefined,
    related_event_id: formData.get("related_event_id") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    assigned_to: parsed.data.assigned_to || null,
    due_date: parsed.data.due_date || null,
    related_event_id: parsed.data.related_event_id || null,
    created_by: userId,
    updated_by: userId,
  });

  if (error) {
    console.error("addTask insert error:", error);
    return { error: "Impossibile creare il task. Riprova." };
  }

  if (parsed.data.assigned_to) {
    await notifyTaskAssigned(supabase, parsed.data.title, parsed.data.assigned_to);
  }
  await logActivity(supabase, userId, "created", "task", parsed.data.title);

  revalidatePath("/task");
  return undefined;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const { userId } = await requireSessionProfile();
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ status, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  const { data: task } = await supabase.from("tasks").select("title").eq("id", taskId).single();
  await logActivity(supabase, userId, "status_changed", "task", task?.title, status);

  revalidatePath("/task");
}

export async function deleteTask(taskId: string) {
  const { userId } = await requireSessionProfile();
  const supabase = await createClient();

  const { data: task } = await supabase.from("tasks").select("*").eq("id", taskId).single();
  await supabase.from("tasks").delete().eq("id", taskId);
  await logActivity(supabase, userId, "deleted", "task", task?.title, null, task ? { row: task } : null);

  revalidatePath("/task");
}
