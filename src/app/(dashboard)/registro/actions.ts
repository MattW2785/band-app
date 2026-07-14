"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { restoreActivity } from "@/lib/activity-log";

export type RestoreState = { error?: string } | undefined;

export async function restoreFromLog(_prevState: RestoreState, formData: FormData): Promise<RestoreState> {
  const { userId } = await requireAdmin();
  const logId = String(formData.get("log_id"));

  const supabase = await createClient();
  const result = await restoreActivity(supabase, logId, userId);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/registro");
  revalidatePath("/brani");
  revalidatePath("/task");
  revalidatePath("/eventi");
  revalidatePath("/scalette");
  revalidatePath("/locali");
  revalidatePath("/booking");
  revalidatePath("/economia");
  revalidatePath("/calendario");
  return undefined;
}
