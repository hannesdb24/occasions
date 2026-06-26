"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface CalEvent {
  id: string;
  contactId: string;
  contactName: string;
  title: string;
  dateStr: string; // "YYYY-MM-DD"
  daysUntil: number;
  eventType: string;
}

const DOT_COLOR: Record<string, string> = {
  BIRTHDAY: "#B85968",
  ANNIVERSARY: "#A8895C",
  HOLIDAY: "#6B8F6E",
  RELATIONSHIP_HOLIDAY: "#5B7FA6",
  CUSTOM: "#8B7B6B",
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function isoToKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function DashboardCalendar({ events, initialYear, initialMonth }: {
  events: CalEvent[];
  initialYear: number;
  initialMonth: number; // 0-based
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const eventMap = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const key = e.dateStr.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday = 0 offset
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const todayKey = isoToKey(new Date());

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedEvents = selectedDay ? (eventMap.get(selectedDay) ?? []) : [];

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-medium text-[var(--foreground)]">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[rgba(28,25,22,0.06)] transition-considered" aria-label="Vorheriger Monat">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[rgba(28,25,22,0.06)] transition-considered" aria-label="Nächster Monat">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold tracking-wider uppercase py-1" style={{ color: "var(--muted-foreground)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const key = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayEvents = eventMap.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          const hasBirthday = dayEvents.some((e) => e.eventType === "BIRTHDAY");
          const hasOther = dayEvents.some((e) => e.eventType !== "BIRTHDAY");

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(isSelected ? null : key)}
              className={`relative flex flex-col items-center py-1.5 rounded-lg text-sm transition-considered ${
                isSelected
                  ? "bg-[var(--foreground)] text-[var(--card)]"
                  : isToday
                  ? "bg-[#c4704a]/15 text-[#c4704a] font-semibold"
                  : "hover:bg-[rgba(28,25,22,0.05)]"
              }`}
            >
              <span className={isToday && !isSelected ? "font-semibold" : ""}>{day}</span>
              {dayEvents.length > 0 && (
                <span className="flex gap-0.5 mt-0.5">
                  {hasBirthday && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? "white" : "#B85968" }} />}
                  {hasOther && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? "white" : "#5B7FA6" }} />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="mt-4 pt-4 border-t border-[rgba(28,25,22,0.08)] space-y-2">
          {selectedEvents.length === 0 ? (
            <p className="text-xs italic" style={{ color: "var(--muted-foreground)" }}>Kein Anlass an diesem Tag.</p>
          ) : (
            selectedEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DOT_COLOR[e.eventType] ?? "#8B7B6B" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[var(--foreground)] truncate block">{e.title}</span>
                  {e.contactName && <span className="text-xs block truncate" style={{ color: "var(--muted-foreground)" }}>{e.contactName}</span>}
                </div>
                {e.contactId && (
                  <Link href={`/contacts/${e.contactId}`} className="text-xs text-[#c4704a] hover:text-[#a85c38] shrink-0">→</Link>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Dot legend */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-[rgba(28,25,22,0.06)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#B85968]" />
          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Geburtstag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5B7FA6]" />
          <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Anlass</span>
        </div>
      </div>
    </div>
  );
}
