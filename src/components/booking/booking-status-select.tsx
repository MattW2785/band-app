"use client";

import { useTransition } from "react";
import { updateBookingStatus } from "@/app/(dashboard)/booking/actions";
import { Select } from "@/components/ui/input";
import type { BookingStatus } from "@/types/database";

const OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "contattato", label: "Contattato" },
  { value: "in_negoziazione", label: "In negoziazione" },
  { value: "confermato", label: "Confermato" },
  { value: "annullato", label: "Annullato" },
  { value: "pagato", label: "Pagato" },
];

export function BookingStatusSelect({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={status}
      disabled={pending}
      className="w-auto"
      onChange={(e) => startTransition(() => updateBookingStatus(bookingId, e.target.value as BookingStatus))}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
