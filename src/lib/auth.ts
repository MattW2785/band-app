import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getSessionProfile(): Promise<{ userId: string; email: string | null; profile: Profile } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) return null;

  return { userId: user.id, email: user.email ?? null, profile };
}

export async function requireSessionProfile() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (!session.profile.full_name) redirect("/completa-profilo");
  return session;
}

export async function requireAdmin() {
  const session = await requireSessionProfile();
  if (session.profile.role !== "admin") redirect("/");
  return session;
}
