"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  ChevronRight,
  Send,
  CalendarClock,
  MessageCircle,
  TrendingUp,
  Link2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Home };
type NavGroup = { title: string | null; items: NavItem[] };

const groups: NavGroup[] = [
  { title: null, items: [{ href: "/", label: "Home", icon: Home }] },
  {
    title: "Eventi",
    items: [
      { href: "/eventi", label: "Eventi", icon: Mic2 },
      { href: "/booking", label: "Booking", icon: Handshake },
      { href: "/locali", label: "Locali", icon: MapPin },
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
    title: "Repertorio",
    items: [
      { href: "/brani", label: "Brani", icon: Music },
      { href: "/scalette", label: "Scalette", icon: ListMusic },
    ],
  },
  {
    title: "Social",
    items: [
      { href: "/social/posts", label: "Post", icon: Send },
      { href: "/social/calendar", label: "Calendario editoriale", icon: CalendarClock },
      { href: "/social/messages", label: "Messaggi", icon: MessageCircle },
      { href: "/social/analytics", label: "Statistiche social", icon: TrendingUp },
      { href: "/social/accounts", label: "Account collegati", icon: Link2 },
      { href: "/social/status", label: "Stato pubblicazioni", icon: Activity },
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

function isItemActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function getActiveGroupTitle(allGroups: NavGroup[], pathname: string) {
  return (
    allGroups.find(
      (group) => group.title && group.items.some((item) => isItemActive(item.href, pathname))
    )?.title ?? null
  );
}

export function MainNav({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const allGroups = isAdmin ? [...groups, adminGroup] : groups;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const activeTitle = getActiveGroupTitle(allGroups, pathname);
    return activeTitle ? { [activeTitle]: true } : {};
  });

  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-3">
      {allGroups.map((group) => {
        const isAdminGroup = group === adminGroup;
        if (!group.title) {
          return (
            <div key="root" className="contents">
              {group.items.map((item) => {
                const active = isItemActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        }

        const title = group.title;
        const isOpen = !!openGroups[title];

        return (
          <details
            key={title}
            open={isOpen}
            onToggle={(e) => {
              const next = e.currentTarget.open;
              setOpenGroups((prev) => (prev[title] === next ? prev : { ...prev, [title]: next }));
            }}
            className={cn(
              "mt-4 first:mt-0",
              isAdminGroup && "mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800"
            )}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
              {title}
              <ChevronRight
                className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-90")}
                strokeWidth={2}
              />
            </summary>
            <div className="mt-1 flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </details>
        );
      })}
    </nav>
  );
}
