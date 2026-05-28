"use client";

import { Flame } from "lucide-react";

interface StreakBadgeProps {
  count: number;
  longestStreak: number;
}

export function StreakBadge({ count, longestStreak }: StreakBadgeProps) {
  if (count === 0) return null;

  const isRecord = count >= longestStreak && count > 1;

  return (
    <div
      className="streak-badge"
      role="status"
      aria-live="polite"
      aria-label={`${count} day streak`}
    >
      <Flame size={20} className="streak-badge__icon" aria-hidden="true" />
      <span className="streak-badge__count">{count}</span>
      <span className="streak-badge__label">
        day streak{isRecord ? " 🏆" : ""}
      </span>
    </div>
  );
}
