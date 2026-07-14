import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { CompleteProfileForm } from "./form";

export default async function CompletaProfiloPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  if (profile?.full_name) redirect("/");

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">♪</span>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-zinc-900">Benvenuto in BandSpace</h1>
            <p className="text-xs text-zinc-500">Imposta nome e password per continuare</p>
          </div>
        </div>
        <CompleteProfileForm />
      </Card>
    </div>
  );
}
