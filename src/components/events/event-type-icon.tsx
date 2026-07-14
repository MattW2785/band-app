import { Mic2, Guitar } from "lucide-react";
import type { EventType } from "@/types/database";

export function EventTypeIcon({ type, className }: { type: EventType; className?: string }) {
  const Icon = type === "concerto" ? Mic2 : Guitar;
  return <Icon className={className} strokeWidth={2} />;
}
