"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { useDogs } from "./useDogs";
import { TrainingProgress, ChallengeEntry } from "@/types";
import { trainingModules } from "@/lib/data/trainingModules";
import { getCurrentWeekChallenge } from "@/lib/data/weeklyChallenges";
import {
  subscribeToTrainingProgress,
  startModule,
  completeTrainingStep,
  resetModuleProgress,
  getChallengeEntry,
  joinChallenge,
  incrementChallengeProgress,
} from "@/lib/repositories";
import toast from "react-hot-toast";

export function useTraining() {
  const { user } = useAuth();
  const { dogs } = useDogs();

  const [progress, setProgress] = useState<TrainingProgress[] | null>(null);
  const [challengeEntry, setChallengeEntry] = useState<ChallengeEntry | null>(
    null,
  );
  const [loadingChallenge, setLoadingChallenge] = useState(true);

  // Selected dog (first dog by default)
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);

  const activeDogId = useMemo(() => {
    if (selectedDogId && dogs?.find((d) => d.id === selectedDogId))
      return selectedDogId;
    return dogs?.[0]?.id ?? null;
  }, [selectedDogId, dogs]);

  const loading = user ? progress === null : false;

  // Get current week's challenge
  const weeklyChallenge = useMemo(() => getCurrentWeekChallenge(), []);
  const challengeId = useMemo(
    () =>
      `${weeklyChallenge.startDate}_${weeklyChallenge.title.toLowerCase().replace(/\s+/g, "-")}`,
    [weeklyChallenge],
  );

  // Subscribe to training progress for selected dog
  useEffect(() => {
    if (!user || !activeDogId) return;
    const unsub = subscribeToTrainingProgress(
      user.uid,
      activeDogId,
      setProgress,
    );
    return () => {
      unsub();
      setProgress(null);
    };
  }, [user, activeDogId]);

  // Fetch challenge entry
  useEffect(() => {
    if (!user || !activeDogId) return;
    let cancelled = false;
    getChallengeEntry(user.uid, activeDogId, challengeId)
      .then((entry) => {
        if (!cancelled) setChallengeEntry(entry);
      })
      .catch(() => {
        if (!cancelled) setChallengeEntry(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingChallenge(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, activeDogId, challengeId]);

  // Get progress for a specific module
  const getModuleProgress = useCallback(
    (moduleId: string): TrainingProgress | undefined => {
      return progress?.find((p) => p.moduleId === moduleId);
    },
    [progress],
  );

  // Start a module
  const beginModule = useCallback(
    async (moduleId: string) => {
      if (!user || !activeDogId) return;
      try {
        await startModule(user.uid, activeDogId, moduleId);
        toast.success("Module started! 🎯");
      } catch (err) {
        console.error("Failed to start module:", err);
        toast.error("Failed to start module.");
      }
    },
    [user, activeDogId],
  );

  // Complete a step
  const markStepComplete = useCallback(
    async (progressId: string, stepId: string, totalSteps: number) => {
      try {
        await completeTrainingStep(progressId, stepId, totalSteps);
        toast.success("Step complete! ✅");
      } catch (err) {
        console.error("Failed to complete step:", err);
        toast.error("Failed to save progress.");
      }
    },
    [],
  );

  // Reset module
  const resetModule = useCallback(async (progressId: string) => {
    try {
      await resetModuleProgress(progressId);
      toast.success("Progress reset");
    } catch (err) {
      console.error("Failed to reset:", err);
      toast.error("Failed to reset.");
    }
  }, []);

  // Join weekly challenge
  const joinWeeklyChallenge = useCallback(async () => {
    if (!user || !activeDogId) return;
    try {
      const entryId = await joinChallenge(user.uid, activeDogId, challengeId);
      setChallengeEntry({
        id: entryId,
        ownerId: user.uid,
        dogId: activeDogId,
        challengeId,
        progress: 0,
        joinedAt: new Date().toISOString(),
        completedAt: null,
      });
      toast.success("Challenge joined! 💪");
    } catch (err) {
      console.error("Failed to join challenge:", err);
      toast.error("Failed to join challenge.");
    }
  }, [user, activeDogId, challengeId]);

  // Log challenge progress
  const logChallengeProgress = useCallback(async () => {
    if (!challengeEntry) return;
    try {
      await incrementChallengeProgress(
        challengeEntry.id,
        weeklyChallenge.targetCount,
      );
      setChallengeEntry((prev) =>
        prev
          ? {
              ...prev,
              progress: Math.min(
                prev.progress + 1,
                weeklyChallenge.targetCount,
              ),
              completedAt:
                prev.progress + 1 >= weeklyChallenge.targetCount
                  ? new Date().toISOString()
                  : null,
            }
          : null,
      );
      toast.success("+1 logged! 🎉");
    } catch (err) {
      console.error("Failed to log progress:", err);
      toast.error("Failed to log progress.");
    }
  }, [challengeEntry, weeklyChallenge.targetCount]);

  // Stats
  const stats = useMemo(() => {
    if (!progress)
      return { started: 0, completed: 0, totalModules: trainingModules.length };
    const completed = progress.filter((p) => p.completedAt !== null).length;
    return {
      started: progress.length,
      completed,
      totalModules: trainingModules.length,
    };
  }, [progress]);

  return {
    dogs,
    activeDogId,
    setSelectedDogId,
    loading,
    modules: trainingModules,
    progress: progress ?? [],
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
  };
}
