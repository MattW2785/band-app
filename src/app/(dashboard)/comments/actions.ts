"use server";

import { revalidatePath } from "next/cache";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";
import type { CommentParentType } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getParentLabel(
  supabase: SupabaseServerClient,
  parentType: CommentParentType,
  parentId: string
): Promise<string | null> {
  switch (parentType) {
    case "song": {
      const { data } = await supabase.from("songs").select("title").eq("id", parentId).single();
      return data?.title ?? null;
    }
    case "event": {
      const { data } = await supabase.from("events").select("title").eq("id", parentId).single();
      return data?.title ?? null;
    }
    case "task": {
      const { data } = await supabase.from("tasks").select("title").eq("id", parentId).single();
      return data?.title ?? null;
    }
    case "booking_lead": {
      const { data } = await supabase.from("booking_leads").select("venues(name)").eq("id", parentId).single();
      return (data?.venues as unknown as { name: string } | null)?.name ?? null;
    }
    default:
      return null;
  }
}

export async function addComment(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const parentType = String(formData.get("parent_type")) as CommentParentType;
  const parentId = String(formData.get("parent_id"));
  const text = String(formData.get("text") ?? "").trim();
  const revalidatePathValue = String(formData.get("revalidate_path") ?? "");

  if (!text) return;

  const supabase = await createClient();
  await supabase.from("comments").insert({ parent_type: parentType, parent_id: parentId, user_id: userId, text });

  const parentLabel = await getParentLabel(supabase, parentType, parentId);
  await logActivity(supabase, userId, "created", "comment", parentLabel, text.slice(0, 80));

  if (revalidatePathValue) revalidatePath(revalidatePathValue);
}

export async function deleteComment(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const commentId = String(formData.get("comment_id"));
  const revalidatePathValue = String(formData.get("revalidate_path") ?? "");

  const supabase = await createClient();
  const { data: comment } = await supabase.from("comments").select("*").eq("id", commentId).single();
  if (!comment) return;

  await supabase.from("comments").delete().eq("id", commentId);

  const parentLabel = await getParentLabel(supabase, comment.parent_type, comment.parent_id);
  await logActivity(supabase, userId, "deleted", "comment", parentLabel, null, { row: comment });

  if (revalidatePathValue) revalidatePath(revalidatePathValue);
}
