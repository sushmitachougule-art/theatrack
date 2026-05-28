"use client";

import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useTraining } from "@/hooks/useTraining";
import { DogSelector } from "@/components/training/DogSelector";
import { TrainingStats } from "@/components/training/TrainingStats";
import { WeeklyChallengeCard } from "@/components/training/WeeklyChallengeCard";
import { ModuleCard } from "@/components/training/ModuleCard";
import { ModuleDetail } from "@/components/training/ModuleDetail";
import { getModuleById } from "@/lib/data/trainingModules";
import { GraduationCap } from "lucide-react";
import { TrainingCategory } from "@/types";

const CATEGORIES: { key: TrainingCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "basics", label: "Basics" },
  { key: "manners", label: "Manners" },
  { key: "tricks", label: "Tricks" },
  { key: "safety", label: "Safety" },
  { key: "social", label: "Social" },
];

export default function TrainingPage() {
  const {
    dogs,
    activeDogId,
    setSelectedDogId,
    loading,
    modules,
    getModuleProgress,
    beginModule,
    markStepComplete,
    resetModule,
    weeklyChallenge,
    challengeEntry,
    loadingChallenge,
    joinWeeklyChallenge,
    logChallengeProgress,
    stats,
  } = useTraining();

  const [activeCategory, setActiveCategory] = useState<
    TrainingCategory | "all"
  >("all");
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);

  const filteredModules = useMemo(() => {
    if (activeCategory === "all") return modules;
    return modules.filter((m) => m.category === activeCategory);
  }, [modules, activeCategory]);

  // Module detail view
  if (openModuleId) {
    const openModule = getModuleById(openModuleId);
    const moduleProgress = getModuleProgress(openModuleId);
    if (openModule && moduleProgress) {
      return (
        <AppLayout>
          <ModuleDetail
            module={openModule}
            progress={moduleProgress}
            onCompleteStep={markStepComplete}
            onReset={resetModule}
            onBack={() => setOpenModuleId(null)}
          />
        </AppLayout>
      );
    }
    // If no progress yet (shouldn't happen), go back
    setOpenModuleId(null);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="training-page training-page--loading">
          Loading training...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="training-page">
        {/* Header */}
        <div className="training-page__header">
          <div
            className="training-page__icon-bg"
            style={{ background: "var(--color-primary-bg)" }}
          >
            <GraduationCap
              size={20}
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div>
            <h1 className="training-page__title">Training</h1>
            <p className="training-page__subtitle">
              Modules & weekly challenges
            </p>
          </div>
        </div>

        {/* Dog selector */}
        <DogSelector
          dogs={dogs ?? []}
          activeDogId={activeDogId}
          onSelect={setSelectedDogId}
        />

        {/* Stats */}
        <TrainingStats
          started={stats.started}
          completed={stats.completed}
          totalModules={stats.totalModules}
        />

        {/* Weekly Challenge */}
        <WeeklyChallengeCard
          challenge={weeklyChallenge}
          entry={challengeEntry}
          loading={loadingChallenge}
          onJoin={joinWeeklyChallenge}
          onLogProgress={logChallengeProgress}
        />

        {/* Category Filter */}
        <div className="training-page__categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`training-page__cat-btn ${activeCategory === cat.key ? "training-page__cat-btn--active" : ""}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Module List */}
        <div className="training-page__modules">
          {filteredModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              progress={getModuleProgress(module.id)}
              onStart={beginModule}
              onOpen={setOpenModuleId}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
