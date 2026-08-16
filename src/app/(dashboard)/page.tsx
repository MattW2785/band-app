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
  Map,
  ClipboardList,
  Users,
} from "lucide-react";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
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
  { href: "/stage-plot", title: "Stage Plot", description: "Disposizione sul palco", icon: Map },
  { href: "/rider-tecnico", title: "Rider tecnico", description: "Requisiti tecnici per il concerto", icon: ClipboardList },
  { href: "/statistiche", title: "Statistiche", description: "Il cruscotto di business", icon: BarChart3 },
  { href: "/media", title: "Archivio media", description: "Registrazioni, basi, foto/video e spartiti", icon: FolderOpen },
  { href: "/attrezzatura", title: "Attrezzatura", description: "Inventario strumenti ed equipaggiamento", icon: Wrench },
  {
    href: "/siae",
    title: "SIAE / SOUNDREEF",
    description: "Deposito e ripartizione diritti d'autore",
    icon: FileSignature,
  },
];

// Weighted to match the logo's own hue mix: mostly blue-violet, a strong
// cyan secondary, magenta as an accent, and a touch of orange.
const ICON_PALETTE = [
  "from-violet-500 to-indigo-600",
  "from-indigo-500 to-blue-600",
  "from-sky-500 to-cyan-500",
  "from-purple-500 to-violet-600",
  "from-fuchsia-500 to-pink-600",
  "from-orange-500 to-amber-600",
];

function iconGradientFor(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return ICON_PALETTE[Math.abs(hash) % ICON_PALETTE.length];
}

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
      icon: Calendar,
      gradient: "from-sky-500 to-blue-600",
    },
    {
      label: "Task aperti",
      value: String(openTasks ?? 0),
      hint: "da fare o in corso",
      icon: CheckSquare,
      gradient: "from-orange-500 to-amber-600",
    },
    {
      label: "Brani in repertorio",
      value: String(songCount ?? 0),
      hint: "proposti finora",
      icon: Music,
      gradient: "from-violet-500 to-indigo-600",
    },
    {
      label: "Membri",
      value: String(memberCount ?? 0),
      hint: "nella band",
      icon: Users,
      gradient: "from-fuchsia-500 to-pink-600",
    },
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
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className="animate-fade-in p-4"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span
                className={cn(
                  "mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                  s.gradient
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{s.label}</p>
              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">{s.value}</p>
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{s.hint}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href} className="group">
              <Card
                className="animate-fade-in h-full hover:-translate-y-0.5 hover:border-violet-200 dark:hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-600/10"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span
                  className={cn(
                    "mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm transition-transform duration-200 group-hover:scale-105",
                    iconGradientFor(m.title)
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h2 className="font-medium text-zinc-900 dark:text-zinc-100">{m.title}</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{m.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
