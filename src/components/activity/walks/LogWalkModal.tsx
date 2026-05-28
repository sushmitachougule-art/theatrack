"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dog, WalkMood } from "@/types";

const DURATION_PRESETS = [10, 15, 20, 30, 45, 60];

const MOOD_OPTIONS: { value: WalkMood; emoji: string; label: string }[] = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "hyper", emoji: "🤪", label: "Hyper" },
  { value: "same", emoji: "😐", label: "Same" },
];

interface LogWalkModalProps {
  dogs: Dog[];
  saving: boolean;
  onSave: (data: {
    dogId: string;
    durationMinutes: number;
    distanceKm: number | null;
    moodAfter: WalkMood;
    notes: string;
  }) => void;
  onClose: () => void;
}

export function LogWalkModal({
  dogs,
  saving,
  onSave,
  onClose,
}: LogWalkModalProps) {
  const [dogId, setDogId] = useState(dogs[0]?.id ?? "");
  const [duration, setDuration] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [distance, setDistance] = useState("");
  const [moodAfter, setMoodAfter] = useState<WalkMood>("happy");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = useCustom ? parseInt(customDuration) || 0 : duration;
    if (mins <= 0) return;
    onSave({
      dogId,
      durationMinutes: mins,
      distanceKm: distance ? parseFloat(distance) : null,
      moodAfter,
      notes,
    });
  };

  return (
    <div className="walk-modal-overlay" onClick={onClose}>
      <div className="walk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="walk-modal__header">
          <h3>Log a Walk</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="walk-modal__close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="walk-modal__form">
          {/* Dog selector */}
          {dogs.length > 1 && (
            <div className="walk-modal__field">
              <label className="walk-modal__label">Dog</label>
              <select
                value={dogId}
                onChange={(e) => setDogId(e.target.value)}
                className="walk-modal__select"
              >
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Duration */}
          <div className="walk-modal__field">
            <label className="walk-modal__label">Duration</label>
            <div className="walk-modal__presets">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`walk-modal__preset ${!useCustom && duration === preset ? "walk-modal__preset--active" : ""}`}
                  onClick={() => {
                    setDuration(preset);
                    setUseCustom(false);
                  }}
                >
                  {preset}m
                </button>
              ))}
            </div>
            <div className="walk-modal__custom">
              <span>or custom:</span>
              <input
                type="number"
                min="1"
                max="300"
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  setUseCustom(true);
                }}
                className="walk-modal__input-sm"
                placeholder="min"
              />
              <span>min</span>
            </div>
          </div>

          {/* Distance */}
          <div className="walk-modal__field">
            <label className="walk-modal__label">Distance (optional)</label>
            <div className="walk-modal__custom">
              <input
                type="number"
                min="0"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="walk-modal__input-sm"
                placeholder="0.0"
              />
              <span>km</span>
            </div>
          </div>

          {/* Mood after walk */}
          <div className="walk-modal__field">
            <label className="walk-modal__label">
              Dog&apos;s mood after walk
            </label>
            <div className="walk-modal__moods">
              {MOOD_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`walk-modal__mood ${moodAfter === opt.value ? "walk-modal__mood--active" : ""}`}
                >
                  <input
                    type="radio"
                    name="moodAfter"
                    value={opt.value}
                    checked={moodAfter === opt.value}
                    onChange={() => setMoodAfter(opt.value)}
                    className="sr-only"
                  />
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="walk-modal__field">
            <label className="walk-modal__label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              className="walk-modal__textarea"
              placeholder="Anything notable..."
              maxLength={200}
              rows={2}
            />
          </div>

          <button
            type="submit"
            className="walk-modal__submit"
            disabled={
              saving ||
              (!useCustom && !duration) ||
              (useCustom && !customDuration)
            }
          >
            {saving ? "Saving..." : "Save Walk"}
          </button>
        </form>
      </div>
    </div>
  );
}
