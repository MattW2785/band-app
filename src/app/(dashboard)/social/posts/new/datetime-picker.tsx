"use client";

import { useEffect, useRef, useState } from "react";

const WEEKDAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = Array.from({ length: 60 }, (_, m) => m);

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

function formatTriggerLabel(year: number, month: number, day: number, hour: number, minute: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dateLabel = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
  return `${dateLabel} ${pad2(hour)}:${pad2(minute)}`;
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DateTimePicker({
  value,
  onChange,
  timezone,
}: {
  value: string;
  onChange: (value: string) => void;
  timezone: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggleOpen() {
    if (!open) {
      setViewYear(year);
      setViewMonth(month);
    }
    setOpen((o) => !o);
  }

  function commit(newYear: number, newMonth: number, newDay: number, newHour: number, newMinute: number) {
    onChange(`${newYear}-${pad2(newMonth)}-${pad2(newDay)}T${pad2(newHour)}:${pad2(newMinute)}`);
  }

  function goPrevMonth() {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const total = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = firstWeekdayMondayFirst(viewYear, viewMonth);
  const cells: Array<number | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <CalendarIcon />
        {formatTriggerLabel(year, month, day, hour, minute)}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-center gap-2">
            <select
              value={hour}
              onChange={(e) => commit(year, month, day, Number(e.target.value), minute)}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:border-violet-500"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {pad2(h)}
                </option>
              ))}
            </select>
            <span className="text-zinc-400 dark:text-zinc-500">:</span>
            <select
              value={minute}
              onChange={(e) => commit(year, month, day, hour, Number(e.target.value))}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:border-violet-500"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {pad2(m)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3 flex items-center justify-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <ClockIcon /> {timezone}
          </div>

          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Mese precedente"
              className="rounded px-2 py-1 text-zinc-400 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{monthLabel(viewYear, viewMonth)}</span>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Mese successivo"
              className="rounded px-2 py-1 text-zinc-400 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((d, idx) => {
              if (d == null) return <div key={idx} />;
              const isSelected = viewYear === year && viewMonth === month && d === day;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => commit(viewYear, viewMonth, d, hour, minute)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected ? "bg-violet-600 font-semibold text-white" : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
