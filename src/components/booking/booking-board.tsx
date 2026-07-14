"use client";

import { useState, useTransition } from "react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import Link from "next/link";
import { format, isPast, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { updateBookingStatus } from "@/app/(dashboard)/booking/actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/database";

export interface BookingCardData {
  id: string;
  venueName: string;
  venueCity: string | null;
  status: BookingStatus;
  proposedDate: string | null;
  feeProposed: number | null;
  followUpDate: string | null;
}

const COLUMNS: { status: BookingStatus; label: string }[] = [
  { status: "contattato", label: "Contattato" },
  { status: "in_negoziazione", label: "In negoziazione" },
  { status: "confermato", label: "Confermato" },
  { status: "annullato", label: "Annullato" },
  { status: "pagato", label: "Pagato" },
];

const TERMINAL_STATUSES: BookingStatus[] = ["confermato", "annullato", "pagato"];

function BookingCard({ lead }: { lead: BookingCardData }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const followUpOverdue =
    lead.followUpDate && !TERMINAL_STATUSES.includes(lead.status) && isPast(parseISO(lead.followUpDate));

  return (
    <Link
      href={`/booking/${lead.id}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      className={cn(
        "block cursor-grab touch-none rounded-lg border border-zinc-200/80 bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <p className="text-sm font-medium text-zinc-900">{lead.venueName}</p>
      {lead.venueCity && <p className="text-xs text-zinc-500">{lead.venueCity}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
        {lead.proposedDate && <span>{format(parseISO(lead.proposedDate), "d MMM", { locale: it })}</span>}
        {lead.feeProposed !== null && <span>· {lead.feeProposed}€</span>}
      </div>
      {followUpOverdue && (
        <Badge variant="danger" dot className="mt-2">
          follow-up scaduto
        </Badge>
      )}
    </Link>
  );
}

function Column({ status, label, leads }: { status: BookingStatus; label: string; leads: BookingCardData[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-64 shrink-0 rounded-xl border border-zinc-200/80 bg-zinc-100/60 p-3 transition-colors",
        isOver && "border-indigo-200 bg-indigo-50/60"
      )}
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">
        {label} <span className="font-normal text-zinc-400">({leads.length})</span>
      </h3>
      <div className="space-y-2">
        {leads.map((lead) => (
          <BookingCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

export function BookingBoard({ initialLeads }: { initialLeads: BookingCardData[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as BookingStatus;
    const leadId = active.id as string;

    setLeads((current) => current.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    startTransition(() => {
      updateBookingStatus(leadId, newStatus);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <Column key={col.status} status={col.status} label={col.label} leads={leads.filter((l) => l.status === col.status)} />
        ))}
      </div>
    </DndContext>
  );
}
