"use client";

import { WeeklyChallenge, ChallengeEntry } from "@/types";
import { Trophy } from "lucide-react";

interface WeeklyChallengeCardProps {
  challenge: Omit<WeeklyChallenge, "id">;
  entry: ChallengeEntry | null;
  loading: boolean;
  onJoin: () => void;
  onLogProgress: () => void;
}

export function WeeklyChallengeCard({
  challenge,
  entry,
  loading,
  onJoin,
  onLogProgress,
}: WeeklyChallengeCardProps) {
  if (loading) {
    return (
      <div className="challenge-card challenge-card--loading">
        Loading challenge...
      </div>
    );
  }

  const isJoined = !!entry;
  const isComplete =
    entry?.completedAt !== null && entry?.completedAt !== undefined;
  const progressPercent = entry
    ? Math.round((entry.progress / challenge.targetCount) * 100)
    : 0;

  return (
    <div
      className={`challenge-card ${isComplete ? "challenge-card--complete" : ""}`}
    >
      <div className="challenge-card__header">
        <div className="challenge-card__icon-wrap">
          <span className="challenge-card__icon">{challenge.icon}</span>
          <Trophy size={14} className="challenge-card__trophy" />
        </div>
        <div className="challenge-card__info">
          <span className="challenge-card__label">
            This Week&apos;s Challenge
          </span>
          <h4 className="challenge-card__title">{challenge.title}</h4>
        </div>
      </div>

      <p className="challenge-card__desc">{challenge.description}</p>
      <p className="challenge-card__goal">{challenge.goal}</p>

      {isJoined ? (
        <div className="challenge-card__progress-section">
          <div className="challenge-card__bar-bg">
            <div
              className="challenge-card__bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="challenge-card__count">
            {entry!.progress}/{challenge.targetCount}
            {isComplete && " ✅ Complete!"}
          </span>
          {!isComplete && (
            <button className="challenge-card__log-btn" onClick={onLogProgress}>
              +1 Done
            </button>
          )}
        </div>
      ) : (
        <button className="challenge-card__join-btn" onClick={onJoin}>
          Join Challenge
        </button>
      )}
    </div>
  );
}
