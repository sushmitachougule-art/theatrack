"use client";

import { DailyJournal, JournalMood } from "@/types";

const MOOD_EMOJI: Record<JournalMood, string> = {
  happy: "😊",
  neutral: "😐",
  sad: "😢",
  sleepy: "😴",
  sick: "🤒",
};

interface JournalHistoryProps {
  entries: DailyJournal[];
}

export function JournalHistory({ entries }: JournalHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="journal-history journal-history--empty">
        <p>No entries yet. Start your first check-in above!</p>
      </div>
    );
  }

  return (
    <div className="journal-history">
      <h3 className="journal-history__title">Recent Entries</h3>
      <ul className="journal-history__list">
        {entries.slice(0, 7).map((entry) => (
          <li key={entry.id} className="journal-history__item">
            <span className="journal-history__emoji" aria-hidden="true">
              {MOOD_EMOJI[entry.mood]}
            </span>
            <div className="journal-history__details">
              <span className="journal-history__date">
                {formatDate(entry.date)}
              </span>
              <span className="journal-history__meta">
                Energy: {entry.energy} · Appetite: {entry.appetite}
              </span>
              {entry.notes && (
                <span className="journal-history__notes">{entry.notes}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
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
