import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
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

// Equivalenti di requireSessionProfile()/requireAdmin() per i Route Handler (app/api/*):
// redirect() non è adatto lì, un client che si aspetta JSON riceverebbe una risposta di
// redirect invece di un errore strutturato.
// Uso: `const auth = await requireSessionApi(); if ("error" in auth) return auth.error;`
export async function requireSessionApi(): Promise<
  { session: NonNullable<Awaited<ReturnType<typeof getSessionProfile>>> } | { error: NextResponse }
> {
  const session = await getSessionProfile();
  if (!session) return { error: NextResponse.json({ error: "Non autenticato" }, { status: 401 }) };
  return { session };
}

export async function requireAdminApi(): Promise<
  { session: NonNullable<Awaited<ReturnType<typeof getSessionProfile>>> } | { error: NextResponse }
> {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth;
  if (auth.session.profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Non autorizzato" }, { status: 403 }) };
  }
  return auth;
}
