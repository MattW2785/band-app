"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const InviteSchema = z.object({
  email: z.string().email({ message: "Inserisci un'email valida." }),
});

export type InviteState = { error?: string; success?: string } | undefined;

export async function inviteMember(_prevState: InviteState, formData: FormData): Promise<InviteState> {
  const { userId } = await requireAdmin();

  const parsed = InviteSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback`,
  });

  if (error) {
    return { error: "Impossibile inviare l'invito. Controlla l'email e riprova." };
  }

  const supabase = await createClient();
  await logActivity(supabase, userId, "invited", "member", parsed.data.email);

  revalidatePath("/membri");
  return { success: `Invito inviato a ${parsed.data.email}.` };
}

export type DeleteMemberState = { error?: string } | undefined;

export async function deleteMember(_prevState: DeleteMemberState, formData: FormData): Promise<DeleteMemberState> {
  const { userId } = await requireAdmin();
  const memberId = String(formData.get("member_id"));

  if (memberId === userId) {
    return { error: "Non puoi eliminare il tuo stesso account da qui." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("role, full_name").eq("id", memberId).single();

  if (target?.role === "admin") {
    const { count: adminCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((adminCount ?? 0) <= 1) {
      return { error: "Non puoi eliminare l'unico admin rimasto." };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(memberId);

  if (error) {
    return { error: "Impossibile eliminare il membro. Riprova." };
  }

  await logActivity(supabase, userId, "deleted", "member", target?.full_name);

  revalidatePath("/membri");
  return undefined;
}
