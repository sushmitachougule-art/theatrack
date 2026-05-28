"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { MoodSelector } from "./MoodSelector";
import {
  JournalMood,
  JournalEnergy,
  JournalAppetite,
  JournalPoop,
  DailyJournal,
} from "@/types";

interface QuickLogCardProps {
  todayEntry: DailyJournal | null;
  saving: boolean;
  onSave: (data: {
    mood: JournalMood;
    energy: JournalEnergy;
    appetite: JournalAppetite;
    poop: JournalPoop;
    notes: string;
  }) => void;
}

const ENERGY_OPTIONS: { value: JournalEnergy; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const APPETITE_OPTIONS: { value: JournalAppetite; label: string }[] = [
  { value: "poor", label: "Poor" },
  { value: "normal", label: "Normal" },
  { value: "excessive", label: "Excessive" },
];

const POOP_OPTIONS: { value: JournalPoop; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "soft", label: "Soft" },
  { value: "concerning", label: "Concerning" },
];

export function QuickLogCard({
  todayEntry,
  saving,
  onSave,
}: QuickLogCardProps) {
  const [editing, setEditing] = useState(!todayEntry);
  const [mood, setMood] = useState<JournalMood | null>(
    todayEntry?.mood ?? null,
  );
  const [energy, setEnergy] = useState<JournalEnergy>(
    todayEntry?.energy ?? "medium",
  );
  const [appetite, setAppetite] = useState<JournalAppetite>(
    todayEntry?.appetite ?? "normal",
  );
  const [poop, setPoop] = useState<JournalPoop>(todayEntry?.poop ?? "normal");
  const [notes, setNotes] = useState(todayEntry?.notes ?? "");

  // If todayEntry changes (e.g. after save), sync state
  const isLogged = !!todayEntry && !editing;

  if (isLogged) {
    return (
      <div className="quick-log-card quick-log-card--done">
        <div className="quick-log-card__check">
          <Check size={24} aria-hidden="true" />
          <span>Today&apos;s check-in complete!</span>
        </div>
        <button
          className="quick-log-card__edit-btn"
          onClick={() => setEditing(true)}
        >
          Edit entry
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood) return;
    onSave({ mood, energy, appetite, poop, notes });
    setEditing(false);
  };

  return (
    <form className="quick-log-card" onSubmit={handleSubmit}>
      <MoodSelector value={mood} onChange={setMood} />

      <div className="quick-log-card__field">
        <label className="quick-log-card__label">Energy Level</label>
        <div
          className="pill-selector"
          role="radiogroup"
          aria-label="Energy level"
        >
          {ENERGY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`pill-selector__pill ${energy === opt.value ? "pill-selector__pill--active" : ""}`}
            >
              <input
                type="radio"
                name="energy"
                value={opt.value}
                checked={energy === opt.value}
                onChange={() => setEnergy(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="quick-log-card__field">
        <label className="quick-log-card__label">Appetite</label>
        <div className="pill-selector" role="radiogroup" aria-label="Appetite">
          {APPETITE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`pill-selector__pill ${appetite === opt.value ? "pill-selector__pill--active" : ""}`}
            >
              <input
                type="radio"
                name="appetite"
                value={opt.value}
                checked={appetite === opt.value}
                onChange={() => setAppetite(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="quick-log-card__field">
        <label className="quick-log-card__label">Poop</label>
        <div
          className="pill-selector"
          role="radiogroup"
          aria-label="Poop quality"
        >
          {POOP_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`pill-selector__pill ${poop === opt.value ? "pill-selector__pill--active" : ""}`}
            >
              <input
                type="radio"
                name="poop"
                value={opt.value}
                checked={poop === opt.value}
                onChange={() => setPoop(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="quick-log-card__field">
        <label className="quick-log-card__label" htmlFor="journal-notes">
          Notes{" "}
          <span className="quick-log-card__char-count">
            ({notes.length}/200)
          </span>
        </label>
        <textarea
          id="journal-notes"
          className="quick-log-card__textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 200))}
          placeholder="Anything notable today..."
          maxLength={200}
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="quick-log-card__submit"
        disabled={!mood || saving}
      >
        {saving
          ? "Saving..."
          : todayEntry
            ? "Update Check-in"
            : "Save Check-in"}
      </button>
    </form>
  );
}
