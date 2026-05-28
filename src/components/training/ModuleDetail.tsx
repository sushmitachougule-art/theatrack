"use client";

import { TrainingModule, TrainingProgress } from "@/types";
import { CheckCircle2, ArrowLeft, RotateCcw } from "lucide-react";

interface ModuleDetailProps {
  module: TrainingModule;
  progress: TrainingProgress;
  onCompleteStep: (
    progressId: string,
    stepId: string,
    totalSteps: number,
  ) => void;
  onReset: (progressId: string) => void;
  onBack: () => void;
}

export function ModuleDetail({
  module,
  progress,
  onCompleteStep,
  onReset,
  onBack,
}: ModuleDetailProps) {
  const isModuleComplete = progress.completedAt !== null;

  return (
    <div className="module-detail">
      <div className="module-detail__header">
        <button className="module-detail__back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="module-detail__title-wrap">
          <span className="module-detail__icon">{module.icon}</span>
          <h3 className="module-detail__title">{module.title}</h3>
        </div>
        {isModuleComplete && (
          <button
            className="module-detail__reset"
            onClick={() => {
              if (confirm("Reset progress for this module?")) {
                onReset(progress.id);
                onBack();
              }
            }}
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {isModuleComplete && (
        <div className="module-detail__complete-banner">
          🎉 Module Complete! Great work training your dog.
        </div>
      )}

      <div className="module-detail__steps">
        {module.steps.map((step, idx) => {
          const isCompleted = progress.completedStepIds.includes(step.id);
          return (
            <div
              key={step.id}
              className={`module-detail__step ${isCompleted ? "module-detail__step--done" : ""}`}
            >
              <div className="module-detail__step-marker">
                {isCompleted ? (
                  <CheckCircle2 size={22} className="module-detail__check" />
                ) : (
                  <div className="module-detail__step-number">{idx + 1}</div>
                )}
              </div>
              <div className="module-detail__step-content">
                <h4 className="module-detail__step-title">{step.title}</h4>
                <p className="module-detail__step-desc">{step.description}</p>
                <div className="module-detail__step-tip">
                  💡 <span>{step.tipText}</span>
                </div>
                {!isCompleted && (
                  <button
                    className="module-detail__step-btn"
                    onClick={() =>
                      onCompleteStep(progress.id, step.id, module.steps.length)
                    }
                  >
                    <CheckCircle2 size={14} />
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
