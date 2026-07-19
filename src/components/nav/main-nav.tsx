"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Music,
  ListMusic,
  CheckSquare,
  Mic2,
  Handshake,
  MapPin,
  Wallet,
  Users,
  ScrollText,
  FileText,
  BarChart3,
  FolderOpen,
  Wrench,
  FileSignature,
  Map,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Home };
type NavGroup = { title: string | null; items: NavItem[] };

const groups: NavGroup[] = [
  { title: null, items: [{ href: "/", label: "Home", icon: Home }] },
  {
    title: "Repertorio",
    items: [
      { href: "/brani", label: "Brani", icon: Music },
      { href: "/scalette", label: "Scalette", icon: ListMusic },
    ],
  },
  {
    title: "Organizzazione",
    items: [
      { href: "/calendario", label: "Calendario", icon: Calendar },
      { href: "/task", label: "Task", icon: CheckSquare },
    ],
  },
  {
    title: "Eventi",
    items: [
      { href: "/eventi", label: "Eventi", icon: Mic2 },
      { href: "/booking", label: "Booking", icon: Handshake },
      { href: "/locali", label: "Locali", icon: MapPin },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/economia", label: "Economia", icon: Wallet },
      { href: "/statistiche", label: "Statistiche", icon: BarChart3 },
      { href: "/siae", label: "SIAE / SOUNDREEF", icon: FileSignature },
    ],
  },
  {
    title: "Risorse",
    items: [
      { href: "/press-kit", label: "Press kit", icon: FileText },
      { href: "/stage-plot", label: "Stage Plot", icon: Map },
      { href: "/rider-tecnico", label: "Rider tecnico", icon: ClipboardList },
      { href: "/media", label: "Archivio media", icon: FolderOpen },
      { href: "/attrezzatura", label: "Attrezzatura", icon: Wrench },
    ],
  },
];

const adminGroup: NavGroup = {
  title: "Amministrazione",
  items: [
    { href: "/membri", label: "Membri", icon: Users },
    { href: "/registro", label: "Registro", icon: ScrollText },
  ],
};

export function MainNav({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const allGroups = isAdmin ? [...groups, adminGroup] : groups;

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-3">
      {allGroups.map((group) => (
        <div key={group.title ?? "root"} className="contents">
          {group.title && (
            <p className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 first:mt-0">
              {group.title}
            </p>
          )}
          {group.items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-indigo-600 text-white" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
