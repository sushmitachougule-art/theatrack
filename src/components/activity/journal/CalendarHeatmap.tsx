"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DailyJournal, JournalMood } from "@/types";

const MOOD_COLORS: Record<JournalMood, string> = {
  happy: "var(--mood-happy)",
  neutral: "var(--mood-neutral)",
  sad: "var(--mood-sad)",
  sleepy: "var(--mood-sleepy)",
  sick: "var(--mood-sick)",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarHeatmapProps {
  entries: DailyJournal[];
  onMonthChange: (year: number, month: number) => void;
}

export function CalendarHeatmap({
  entries,
  onMonthChange,
}: CalendarHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Build lookup by date
  const entryMap = new Map<string, DailyJournal>();
  entries.forEach((e) => entryMap.set(e.date, e));

  // Calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const navigate = (dir: -1 | 1) => {
    const next = new Date(year, month + dir, 1);
    setCurrentDate(next);
    onMonthChange(next.getFullYear(), next.getMonth() + 1);
  };

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="calendar-heatmap" aria-label="Journal calendar">
      <div className="calendar-heatmap__header">
        <button
          onClick={() => navigate(-1)}
          aria-label="Previous month"
          className="calendar-heatmap__nav"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="calendar-heatmap__month">{monthLabel}</span>
        <button
          onClick={() => navigate(1)}
          aria-label="Next month"
          className="calendar-heatmap__nav"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-heatmap__grid" role="grid">
        {DAYS.map((d) => (
          <div
            key={d}
            className="calendar-heatmap__day-label"
            role="columnheader"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="calendar-heatmap__cell calendar-heatmap__cell--empty"
              />
            );
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const entry = entryMap.get(dateStr);
          const color = entry ? MOOD_COLORS[entry.mood] : undefined;
          const today = new Date().toISOString().split("T")[0] === dateStr;

          return (
            <div
              key={dateStr}
              className={`calendar-heatmap__cell ${entry ? "calendar-heatmap__cell--filled" : ""} ${today ? "calendar-heatmap__cell--today" : ""}`}
              style={color ? { backgroundColor: color } : undefined}
              title={entry ? `${dateStr}: ${entry.mood}` : dateStr}
              aria-label={
                entry
                  ? `${dateStr}: feeling ${entry.mood}`
                  : `${dateStr}: no entry`
              }
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
