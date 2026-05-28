"use client";

import { useState } from "react";
import { Dog, WalkMood } from "@/types";
import { useGPSTracker } from "@/hooks/useGPSTracker";
import { MapPin, Play, Square, AlertTriangle } from "lucide-react";

const MOOD_OPTIONS: { value: WalkMood; emoji: string; label: string }[] = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "hyper", emoji: "🤪", label: "Hyper" },
  { value: "same", emoji: "😐", label: "Same" },
];

interface GPSWalkTrackerProps {
  dogs: Dog[];
  saving: boolean;
  onComplete: (data: {
    dogId: string;
    durationMinutes: number;
    distanceKm: number | null;
    moodAfter: WalkMood;
    notes: string;
    gpsPoints: {
      lat: number;
      lng: number;
      timestamp: number;
      accuracy: number;
    }[];
    gpsDistanceMeters: number;
  }) => void;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function GPSWalkTracker({
  dogs,
  saving,
  onComplete,
  onCancel,
}: GPSWalkTrackerProps) {
  const {
    isTracking,
    isSupported,
    points,
    distanceMeters,
    currentPosition,
    error,
    elapsedSeconds,
    startTracking,
    stopTracking,
  } = useGPSTracker();

  const [dogId, setDogId] = useState(dogs[0]?.id ?? "");
  const [moodAfter, setMoodAfter] = useState<WalkMood>("happy");
  const [notes, setNotes] = useState("");
  const [showFinish, setShowFinish] = useState(false);

  if (!isSupported) {
    return (
      <div className="gps-tracker gps-tracker--unsupported">
        <AlertTriangle size={24} />
        <p>GPS is not supported in this browser.</p>
        <p>Use the manual &quot;Log Walk&quot; option instead.</p>
        <button className="gps-tracker__cancel" onClick={onCancel}>
          Close
        </button>
      </div>
    );
  }

  const handleStop = () => {
    stopTracking();
    setShowFinish(true);
  };

  const handleFinish = () => {
    const durationMinutes = Math.round(elapsedSeconds / 60);
    onComplete({
      dogId,
      durationMinutes: Math.max(1, durationMinutes),
      distanceKm: distanceMeters > 0 ? Math.round(distanceMeters) / 1000 : null,
      moodAfter,
      notes,
      gpsPoints: points,
      gpsDistanceMeters: distanceMeters,
    });
  };

  // Finish screen — select mood + notes after stopping
  if (showFinish) {
    return (
      <div className="gps-tracker gps-tracker--finish">
        <h3>Walk Complete! 🎉</h3>
        <div className="gps-tracker__stats-row">
          <div className="gps-tracker__stat">
            <span className="gps-tracker__stat-value">
              {formatTime(elapsedSeconds)}
            </span>
            <span className="gps-tracker__stat-label">Duration</span>
          </div>
          <div className="gps-tracker__stat">
            <span className="gps-tracker__stat-value">
              {(distanceMeters / 1000).toFixed(2)} km
            </span>
            <span className="gps-tracker__stat-label">Distance</span>
          </div>
          <div className="gps-tracker__stat">
            <span className="gps-tracker__stat-value">{points.length}</span>
            <span className="gps-tracker__stat-label">Points</span>
          </div>
        </div>

        {dogs.length > 1 && (
          <div className="gps-tracker__field">
            <label>Dog</label>
            <select value={dogId} onChange={(e) => setDogId(e.target.value)}>
              {dogs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="gps-tracker__field">
          <label>How was the walk?</label>
          <div className="gps-tracker__moods">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`gps-tracker__mood-btn ${moodAfter === opt.value ? "gps-tracker__mood-btn--active" : ""}`}
                onClick={() => setMoodAfter(opt.value)}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="gps-tracker__field">
          <label>Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Saw a squirrel 🐿️"
            maxLength={200}
            className="gps-tracker__input"
          />
        </div>

        <button
          className="gps-tracker__save-btn"
          onClick={handleFinish}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Walk"}
        </button>
      </div>
    );
  }

  // Active tracking screen
  if (isTracking) {
    return (
      <div className="gps-tracker gps-tracker--active">
        <div className="gps-tracker__live-dot" />
        <h3>Tracking Walk...</h3>
        <p className="gps-tracker__keep-open">
          Keep this screen open for GPS tracking
        </p>

        <div className="gps-tracker__stats-row">
          <div className="gps-tracker__stat">
            <span className="gps-tracker__stat-value">
              {formatTime(elapsedSeconds)}
            </span>
            <span className="gps-tracker__stat-label">Time</span>
          </div>
          <div className="gps-tracker__stat">
            <span className="gps-tracker__stat-value">
              {(distanceMeters / 1000).toFixed(2)} km
            </span>
            <span className="gps-tracker__stat-label">Distance</span>
          </div>
          <div className="gps-tracker__stat">
            <span className="gps-tracker__stat-value">
              {currentPosition
                ? `±${Math.round(currentPosition.accuracy)}m`
                : "—"}
            </span>
            <span className="gps-tracker__stat-label">Accuracy</span>
          </div>
        </div>

        {error && <p className="gps-tracker__error">{error}</p>}

        <button className="gps-tracker__stop-btn" onClick={handleStop}>
          <Square size={16} />
          Stop Walk
        </button>
      </div>
    );
  }

  // Start screen
  return (
    <div className="gps-tracker gps-tracker--start">
      <MapPin size={32} className="gps-tracker__icon" />
      <h3>GPS Walk Tracker</h3>
      <p className="gps-tracker__desc">
        Track your walk route, distance, and duration using GPS. Keep the screen
        on for best results.
      </p>

      {dogs.length > 1 && (
        <div className="gps-tracker__field">
          <label>Which dog?</label>
          <select value={dogId} onChange={(e) => setDogId(e.target.value)}>
            {dogs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="gps-tracker__actions">
        <button className="gps-tracker__start-btn" onClick={startTracking}>
          <Play size={16} />
          Start Tracking
        </button>
        <button className="gps-tracker__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
