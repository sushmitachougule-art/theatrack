"use client";

import { TrainingModule, TrainingProgress } from "@/types";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

interface ModuleCardProps {
  module: TrainingModule;
  progress?: TrainingProgress;
  onStart: (moduleId: string) => void;
  onOpen: (moduleId: string) => void;
}

export function ModuleCard({
  module,
  progress,
  onStart,
  onOpen,
}: ModuleCardProps) {
  const totalSteps = module.steps.length;
  const completedSteps = progress?.completedStepIds.length ?? 0;
  const isStarted = !!progress;
  const isComplete =
    progress?.completedAt !== null && progress?.completedAt !== undefined;
  const progressPercent = isStarted
    ? Math.round((completedSteps / totalSteps) * 100)
    : 0;

  return (
    <div
      className={`module-card ${isComplete ? "module-card--complete" : ""}`}
      onClick={() => (isStarted ? onOpen(module.id) : undefined)}
      role={isStarted ? "button" : undefined}
      tabIndex={isStarted ? 0 : undefined}
    >
      <div className="module-card__left">
        <span className="module-card__icon">{module.icon}</span>
      </div>
      <div className="module-card__body">
        <div className="module-card__header">
          <h4 className="module-card__title">{module.title}</h4>
          <span
            className={`module-card__badge module-card__badge--${module.difficulty}`}
          >
            {module.difficulty}
          </span>
        </div>
        <p className="module-card__desc">{module.description}</p>
        {isStarted ? (
          <div className="module-card__progress">
            <div className="module-card__bar-bg">
              <div
                className="module-card__bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="module-card__steps">
              {isComplete ? (
                <>
                  <CheckCircle2 size={14} /> Complete
                </>
              ) : (
                <>
                  {completedSteps}/{totalSteps} steps
                </>
              )}
            </span>
          </div>
        ) : (
          <div className="module-card__meta">
            <Circle size={14} />
            <span>
              {totalSteps} steps · ~{module.estimatedMinutes} min
            </span>
          </div>
        )}
      </div>
      <div className="module-card__action">
        {isStarted ? (
          <button
            className="module-card__open-btn"
            onClick={() => onOpen(module.id)}
          >
            {isComplete ? "Review" : "Continue"}
          </button>
        ) : (
          <button
            className="module-card__start-btn"
            onClick={(e) => {
              e.stopPropagation();
              onStart(module.id);
            }}
          >
            <PlayCircle size={16} />
            Start
          </button>
        )}
      </div>
    </div>
  );
}
