"use client";

import { Trash2 } from "lucide-react";
import { WalkLog, WalkMood } from "@/types";

const MOOD_EMOJI: Record<WalkMood, string> = {
  happy: "😊",
  tired: "😴",
  hyper: "🤪",
  same: "😐",
};

interface WalkCardProps {
  walk: WalkLog;
  dogName: string;
  onDelete: (id: string) => void;
}

export function WalkCard({ walk, dogName, onDelete }: WalkCardProps) {
  const time = new Date(walk.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="walk-card">
      <div className="walk-card__header">
        <span className="walk-card__dog">🐕 {dogName}</span>
        <span className="walk-card__time">
          {formatDate(walk.date)} {time}
        </span>
      </div>
      <div className="walk-card__stats">
        <span>⏱️ {walk.durationMinutes} min</span>
        {walk.distanceKm && <span>📏 {walk.distanceKm} km</span>}
        <span>
          {MOOD_EMOJI[walk.moodAfter]} {walk.moodAfter}
        </span>
      </div>
      {walk.notes && (
        <p className="walk-card__notes">📝 &ldquo;{walk.notes}&rdquo;</p>
      )}
      <button
        className="walk-card__delete"
        onClick={() => onDelete(walk.id)}
        aria-label="Delete walk"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
