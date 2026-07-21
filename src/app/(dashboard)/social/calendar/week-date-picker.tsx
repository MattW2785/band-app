"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const WEEKDAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function firstWeekdayMondayFirst(year: number, month: number): number {
  const jsDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return (jsDay + 6) % 7;
}

function monthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1));
  const label = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function WeekDatePicker({
  selectedDateKey,
  rangeLabel,
}: {
  selectedDateKey: string;
  rangeLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(selectedDateKey.slice(0, 4)));
  const [month, setMonth] = useState(Number(selectedDateKey.slice(5, 7)));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggleOpen() {
    if (!open) {
      setYear(Number(selectedDateKey.slice(0, 4)));
      setMonth(Number(selectedDateKey.slice(5, 7)));
    }
    setOpen((o) => !o);
  }

  function goPrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function selectDay(day: number) {
    setOpen(false);
    router.push(`/social/calendar?date=${year}-${pad2(month)}-${pad2(day)}`);
  }

  const total = daysInMonth(year, month);
  const leadingBlanks = firstWeekdayMondayFirst(year, month);
  const cells: Array<number | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-2 rounded-lg border border-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-900"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
        {rangeLabel}
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-xl border border-neutral-800 bg-neutral-900 p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Mese precedente"
              className="rounded px-2 py-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-neutral-200">{monthLabel(year, month)}</span>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Mese successivo"
              className="rounded px-2 py-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-neutral-500">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, idx) => {
              if (day == null) return <div key={idx} />;
              const key = `${year}-${pad2(month)}-${pad2(day)}`;
              const isSelected = key === selectedDateKey;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected
                      ? "bg-indigo-600 font-semibold text-white"
                      : "text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
