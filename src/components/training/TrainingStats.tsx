"use client";

interface TrainingStatsProps {
  started: number;
  completed: number;
  totalModules: number;
}

export function TrainingStats({
  started,
  completed,
  totalModules,
}: TrainingStatsProps) {
  return (
    <div className="training-stats">
      <div className="training-stats__item">
        <span className="training-stats__value">{completed}</span>
        <span className="training-stats__label">Completed</span>
      </div>
      <div className="training-stats__divider" />
      <div className="training-stats__item">
        <span className="training-stats__value">{started - completed}</span>
        <span className="training-stats__label">In Progress</span>
      </div>
      <div className="training-stats__divider" />
      <div className="training-stats__item">
        <span className="training-stats__value">{totalModules - started}</span>
        <span className="training-stats__label">Not Started</span>
      </div>
    </div>
  );
}
