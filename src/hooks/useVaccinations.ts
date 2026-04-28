// ============================================
// PawShield — Vaccinations Hook (Real-time)
// ============================================

"use client";

import { useState, useEffect } from "react";
import { VaccinationRecord, VaccinationType } from "@/types";
import {
  subscribeToVaccinationRecords,
  subscribeToAllUserVaccinationRecords,
  subscribeToVaccinationTypes,
} from "@/lib/repositories";
import { useAuth } from "./useAuth";

export function useVaccinationRecords(dogId?: string) {
  const { user } = useAuth();
  const [records, setRecords] = useState<VaccinationRecord[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let unsubscribe: () => void;

    if (dogId) {
      unsubscribe = subscribeToVaccinationRecords(dogId, user.uid, (updated) =>
        setRecords(updated),
      );
    } else {
      unsubscribe = subscribeToAllUserVaccinationRecords(user.uid, (updated) =>
        setRecords(updated),
      );
    }

    return () => {
      unsubscribe();
      setRecords(null);
    };
  }, [user, dogId]);

  return {
    records: records ?? [],
    loading: user ? records === null : false,
  };
}

export function useVaccinationTypes() {
  const { user } = useAuth();
  const [types, setTypes] = useState<VaccinationType[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToVaccinationTypes((updated) =>
      setTypes(updated),
    );
    return () => {
      unsubscribe();
      setTypes(null);
    };
  }, [user]);

  return {
    types: types ?? [],
    loading: user ? types === null : false,
  };
}
