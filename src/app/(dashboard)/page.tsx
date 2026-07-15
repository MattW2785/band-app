import Link from "next/link";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  Calendar,
  Music,
  ListMusic,
  CheckSquare,
  Mic2,
  Handshake,
  MapPin,
  Wallet,
  FileText,
  BarChart3,
  FolderOpen,
  Wrench,
  FileSignature,
} from "lucide-react";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

const modules = [
  { href: "/calendario", title: "Calendario", description: "Disponibilità per prove e concerti", icon: Calendar },
  { href: "/brani", title: "Brani", description: "Proponi e vota il repertorio", icon: Music },
  { href: "/scalette", title: "Scalette", description: "Genera e riordina la scaletta", icon: ListMusic },
  { href: "/task", title: "Task", description: "Cose da fare, assegnate ai membri", icon: CheckSquare },
  { href: "/eventi", title: "Eventi", description: "Prove e concerti in programma", icon: Mic2 },
  { href: "/booking", title: "Booking", description: "Pipeline trattative con i locali", icon: Handshake },
  { href: "/locali", title: "Locali", description: "Anagrafica locali e promoter", icon: MapPin },
  { href: "/economia", title: "Economia", description: "Entrate, uscite e margine", icon: Wallet },
  { href: "/press-kit", title: "Press kit", description: "EPK per locali e promoter", icon: FileText },
  { href: "/statistiche", title: "Statistiche", description: "Il cruscotto di business", icon: BarChart3 },
  { href: "/media", title: "Archivio media", description: "Registrazioni, basi, foto/video e spartiti", icon: FolderOpen },
  { href: "/attrezzatura", title: "Attrezzatura", description: "Inventario strumenti ed equipaggiamento", icon: Wrench },
  { href: "/siae", title: "SIAE", description: "Deposito e ripartizione diritti d'autore", icon: FileSignature },
];

export default async function HomePage() {
  const { profile } = await requireSessionProfile();
  const supabase = await createClient();

  const today = format(new Date(), "yyyy-MM-dd");
  const [{ data: nextEvent }, { count: openTasks }, { count: songCount }, { count: memberCount }] = await Promise.all([
    supabase.from("events").select("title,date").gte("date", today).order("date").limit(1).maybeSingle(),
    supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "fatto"),
    supabase.from("songs").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Prossimo evento",
      value: nextEvent ? format(parseISO(nextEvent.date), "d MMM", { locale: it }) : "—",
      hint: nextEvent?.title ?? "Nessuno in programma",
    },
    { label: "Task aperti", value: String(openTasks ?? 0), hint: "da fare o in corso" },
    { label: "Brani in repertorio", value: String(songCount ?? 0), hint: "proposti finora" },
    { label: "Membri", value: String(memberCount ?? 0), hint: "nella band" },
  ];

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {`Ciao ${profile.full_name}`}
            {profile.hidden && <Badge variant="warning">Modalità invisibile</Badge>}
          </span>
        }
        description="Cosa vuoi organizzare oggi?"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-zinc-400">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{s.value}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{s.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href}>
              <Card className="h-full hover:border-indigo-200 hover:shadow-md">
                <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h2 className="font-medium text-zinc-900">{m.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{m.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
