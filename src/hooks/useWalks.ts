"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { useDogs } from "./useDogs";
import {
  createWalkLog,
  deleteWalkLog,
  subscribeToWalkLogs,
  getWalkLogsByDateRange,
} from "@/lib/repositories";
import { WalkLog, WalkMood } from "@/types";
import toast from "react-hot-toast";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekDates(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export function useWalks() {
  const { user } = useAuth();
  const { dogs } = useDogs();

  const [recentWalks, setRecentWalks] = useState<WalkLog[] | null>(null);
  const [weekWalks, setWeekWalks] = useState<WalkLog[]>([]);
  const [saving, setSaving] = useState(false);

  const loading = user ? recentWalks === null : false;

  // Subscribe to recent walks
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToWalkLogs(
      user.uid,
      (walks) => {
        setRecentWalks(walks);
      },
      20,
    );
    return () => {
      unsub();
      setRecentWalks(null);
    };
  }, [user]);

  // Load this week's walks for bar chart
  useEffect(() => {
    if (!user) return;
    const { start, end } = getWeekDates();
    getWalkLogsByDateRange(user.uid, start, end)
      .then(setWeekWalks)
      .catch(() => setWeekWalks([]));
  }, [user]);

  // Today's stats
  const today = getTodayDate();
  const todayStats = useMemo(() => {
    const todayWalks = (recentWalks ?? []).filter((w) => w.date === today);
    return {
      count: todayWalks.length,
      totalMinutes: todayWalks.reduce((sum, w) => sum + w.durationMinutes, 0),
      totalKm: todayWalks.reduce((sum, w) => sum + (w.distanceKm ?? 0), 0),
    };
  }, [recentWalks, today]);

  // Log a walk
  const logWalk = useCallback(
    async (data: {
      dogId: string;
      durationMinutes: number;
      distanceKm: number | null;
      moodAfter: WalkMood;
      notes: string;
    }): Promise<string | undefined> => {
      if (!user) return undefined;
      setSaving(true);
      try {
        const now = new Date();
        const walkId = await createWalkLog({
          dogId: data.dogId,
          ownerId: user.uid,
          date: getTodayDate(),
          startTime: now.toISOString(),
          durationMinutes: data.durationMinutes,
          distanceKm: data.distanceKm,
          moodAfter: data.moodAfter,
          notes: data.notes,
        });

        // Refresh week walks
        const { start, end } = getWeekDates();
        const updated = await getWalkLogsByDateRange(user.uid, start, end);
        setWeekWalks(updated);

        toast.success("Walk logged! 🐾");
        return walkId;
      } catch (err) {
        console.error("Failed to log walk:", err);
        toast.error("Failed to log walk. Try again.");
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  // Delete a walk
  const removeWalk = useCallback(async (walkId: string) => {
    try {
      await deleteWalkLog(walkId);
      toast.success("Walk removed");
    } catch (err) {
      console.error("Failed to delete walk:", err);
      toast.error("Failed to delete walk.");
    }
  }, []);

  return {
    dogs,
    recentWalks: recentWalks ?? [],
    weekWalks,
    todayStats,
    loading,
    saving,
    logWalk,
    removeWalk,
  };
}
