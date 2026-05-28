"use client";

import { JournalMood } from "@/types";

const MOODS: { value: JournalMood; emoji: string; label: string }[] = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "sad", emoji: "😢", label: "Sad" },
  { value: "sleepy", emoji: "😴", label: "Sleepy" },
  { value: "sick", emoji: "🤒", label: "Sick" },
];

interface MoodSelectorProps {
  value: JournalMood | null;
  onChange: (mood: JournalMood) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <fieldset className="mood-selector" role="radiogroup" aria-label="Mood">
      <legend className="mood-selector__legend">How is your pup today?</legend>
      <div className="mood-selector__options">
        {MOODS.map((mood) => (
          <label
            key={mood.value}
            className={`mood-selector__option ${value === mood.value ? "mood-selector__option--selected" : ""}`}
          >
            <input
              type="radio"
              name="mood"
              value={mood.value}
              checked={value === mood.value}
              onChange={() => onChange(mood.value)}
              className="sr-only"
              aria-label={mood.label}
            />
            <span className="mood-selector__emoji" aria-hidden="true">
              {mood.emoji}
            </span>
            <span className="mood-selector__label">{mood.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
