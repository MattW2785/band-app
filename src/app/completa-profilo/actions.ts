"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CompleteProfileSchema = z.object({
  full_name: z.string().trim().min(2, { message: "Inserisci nome e cognome." }),
  password: z.string().min(8, { message: "La password deve avere almeno 8 caratteri." }),
});

export type CompleteProfileState = { error?: string } | undefined;

export async function completeProfile(
  _prevState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const parsed = CompleteProfileSchema.safeParse({
    full_name: formData.get("full_name"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error: authError } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (authError) {
    return { error: "Impossibile impostare la password. Riprova." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Impossibile salvare il profilo. Riprova." };
  }

  redirect("/");
}
