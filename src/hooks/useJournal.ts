"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { useDogs } from "./useDogs";
import {
  saveDailyJournal,
  getJournalsByMonth,
  subscribeToRecentJournals,
} from "@/lib/repositories";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  DailyJournal,
  JournalMood,
  JournalEnergy,
  JournalAppetite,
  JournalPoop,
} from "@/types";
import toast from "react-hot-toast";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function useJournal() {
  const { user, profile } = useAuth();
  const { dogs } = useDogs();

  const [manualDogId, setManualDogId] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<DailyJournal[] | null>(
    null,
  );
  const [monthEntries, setMonthEntries] = useState<DailyJournal[]>([]);
  const [saving, setSaving] = useState(false);

  // Streak data from profile
  const streakCount = profile?.streakCount ?? 0;
  const streakLastDate = profile?.streakLastDate ?? "";
  const longestStreak = profile?.longestStreak ?? 0;

  // Derived selected dog — defaults to first dog, overridden by manual selection
  const selectedDogId = useMemo(() => {
    if (manualDogId && dogs.some((d) => d.id === manualDogId))
      return manualDogId;
    return dogs.length > 0 ? dogs[0].id : null;
  }, [manualDogId, dogs]);

  const setSelectedDogId = setManualDogId;

  // Derive today's entry from recent entries (first in list if date matches today)
  const today = getTodayDate();
  const todayEntry = useMemo(() => {
    if (!recentEntries) return null;
    return recentEntries.find((e) => e.date === today) ?? null;
  }, [recentEntries, today]);

  // Loading = no subscription data yet
  const loading = user && selectedDogId ? recentEntries === null : false;

  // Subscribe to recent entries (includes today if exists)
  useEffect(() => {
    if (!user || !selectedDogId) return;
    const unsub = subscribeToRecentJournals(
      user.uid,
      selectedDogId,
      (journals) => {
        setRecentEntries(journals);
      },
      () => {
        // On error (e.g. index not ready), show empty state instead of infinite loading
        setRecentEntries([]);
      },
    );
    return () => {
      unsub();
      setRecentEntries(null);
    };
  }, [user, selectedDogId]);

  // Load month entries for calendar
  const loadMonth = useCallback(
    async (year: number, month: number) => {
      if (!user || !selectedDogId) return;
      const entries = await getJournalsByMonth(
        user.uid,
        selectedDogId,
        year,
        month,
      );
      setMonthEntries(entries);
    },
    [user, selectedDogId],
  );

  // Load current month when dog/user changes
  useEffect(() => {
    if (!user || !selectedDogId) return;
    const now = new Date();
    getJournalsByMonth(
      user.uid,
      selectedDogId,
      now.getFullYear(),
      now.getMonth() + 1,
    ).then(setMonthEntries);
  }, [user, selectedDogId]);

  // Save check-in
  const saveCheckin = useCallback(
    async (data: {
      mood: JournalMood;
      energy: JournalEnergy;
      appetite: JournalAppetite;
      poop: JournalPoop;
      notes: string;
    }) => {
      if (!user || !selectedDogId) return;

      setSaving(true);
      try {
        const today = getTodayDate();
        await saveDailyJournal({
          dogId: selectedDogId,
          ownerId: user.uid,
          date: today,
          ...data,
        });

        // Update streak
        const yesterday = getYesterdayDate();
        let newStreak = 1;
        if (streakLastDate === today) {
          // Already logged today — streak stays
          newStreak = streakCount;
        } else if (streakLastDate === yesterday) {
          // Consecutive day — increment
          newStreak = streakCount + 1;
        }
        // else: streak resets to 1

        const newLongest = Math.max(longestStreak, newStreak);

        await updateDoc(doc(db, "users", user.uid), {
          streakCount: newStreak,
          streakLastDate: today,
          longestStreak: newLongest,
        });

        // Subscription will auto-update todayEntry via recentEntries
        // Refresh month entries for calendar
        const now = new Date();
        const entries = await getJournalsByMonth(
          user.uid,
          selectedDogId,
          now.getFullYear(),
          now.getMonth() + 1,
        );
        setMonthEntries(entries);

        toast.success(`Saved! 🔥${newStreak} day streak`);
      } catch (err) {
        console.error("Failed to save journal:", err);
        toast.error("Failed to save. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [user, selectedDogId, streakCount, streakLastDate, longestStreak],
  );

  return {
    dogs,
    selectedDogId,
    setSelectedDogId,
    todayEntry,
    recentEntries: recentEntries ?? [],
    monthEntries,
    loading,
    saving,
    saveCheckin,
    loadMonth,
    streakCount,
    longestStreak,
  };
}
