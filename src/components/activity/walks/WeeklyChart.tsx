"use client";

import { WalkLog } from "@/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface WeeklyChartProps {
  walks: WalkLog[];
}

export function WeeklyChart({ walks }: WeeklyChartProps) {
  // Get Monday of current week
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));

  // Aggregate minutes per day of week
  const dailyMinutes: number[] = Array(7).fill(0);
  walks.forEach((w) => {
    const wDate = new Date(w.date + "T00:00:00");
    const diff = Math.floor(
      (wDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff >= 0 && diff < 7) {
      dailyMinutes[diff] += w.durationMinutes;
    }
  });

  const maxMinutes = Math.max(...dailyMinutes, 60); // min scale 60
  const todayIndex = (now.getDay() + 6) % 7;

  return (
    <div className="weekly-chart" aria-label="This week's walk minutes">
      <div className="weekly-chart__bars">
        {DAYS.map((label, i) => {
          const height =
            dailyMinutes[i] > 0
              ? Math.max(8, (dailyMinutes[i] / maxMinutes) * 100)
              : 0;
          const isToday = i === todayIndex;
          return (
            <div key={label} className="weekly-chart__col">
              <div className="weekly-chart__bar-container">
                <div
                  className={`weekly-chart__bar ${isToday ? "weekly-chart__bar--today" : ""}`}
                  style={{ height: `${height}%` }}
                  aria-label={`${label}: ${dailyMinutes[i]} minutes`}
                />
              </div>
              <span className="weekly-chart__minutes">
                {dailyMinutes[i] > 0 ? dailyMinutes[i] : "—"}
              </span>
              <span
                className={`weekly-chart__label ${isToday ? "weekly-chart__label--today" : ""}`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
