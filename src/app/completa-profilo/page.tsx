import { redirect } from "next/navigation";
import Image from "next/image";
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
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-800 p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <Image src="/logo.png" alt="BandSpace" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <h1 className="text-lg font-semibold leading-tight text-zinc-900 dark:text-zinc-100">Benvenuto in BandSpace</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Imposta nome e password per continuare</p>
          </div>
        </div>
        <CompleteProfileForm />
      </Card>
    </div>
  );
}
