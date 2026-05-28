"use client";

import { useJournal } from "@/hooks/useJournal";
import { StreakBadge } from "./StreakBadge";
import { QuickLogCard } from "./QuickLogCard";
import { CalendarHeatmap } from "./CalendarHeatmap";
import { JournalHistory } from "./JournalHistory";

export function JournalTab() {
  const {
    dogs,
    selectedDogId,
    setSelectedDogId,
    todayEntry,
    recentEntries,
    monthEntries,
    loading,
    saving,
    saveCheckin,
    loadMonth,
    streakCount,
    longestStreak,
  } = useJournal();

  if (loading) {
    return (
      <div className="journal-tab journal-tab--loading">
        <div className="spinner" aria-label="Loading journal..." />
      </div>
    );
  }

  if (dogs.length === 0) {
    return (
      <div className="journal-tab journal-tab--empty">
        <p>Add a dog first to start journaling!</p>
      </div>
    );
  }

  return (
    <div className="journal-tab">
      {/* Dog Selector (multi-dog) */}
      {dogs.length > 1 && (
        <div className="journal-tab__dog-selector">
          {dogs.map((dog) => (
            <button
              key={dog.id}
              className={`journal-tab__dog-pill ${selectedDogId === dog.id ? "journal-tab__dog-pill--active" : ""}`}
              onClick={() => setSelectedDogId(dog.id)}
              aria-pressed={selectedDogId === dog.id}
            >
              {dog.name}
            </button>
          ))}
        </div>
      )}

      {/* Streak Badge */}
      <StreakBadge count={streakCount} longestStreak={longestStreak} />

      {/* Quick Log Form / Completed State */}
      <QuickLogCard
        todayEntry={todayEntry}
        saving={saving}
        onSave={saveCheckin}
      />

      {/* Calendar Heatmap */}
      <CalendarHeatmap entries={monthEntries} onMonthChange={loadMonth} />

      {/* Recent History */}
      <JournalHistory entries={recentEntries} />
    </div>
  );
}
