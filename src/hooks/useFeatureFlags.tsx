"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from "@/types";

const FeatureFlagContext = createContext<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

export function FeatureFlagProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "appConfig", "featureFlags"),
      (snap) => {
        if (snap.exists()) {
          setFlags({
            ...DEFAULT_FEATURE_FLAGS,
            ...snap.data(),
          } as FeatureFlags);
        }
      },
      () => {
        // On error (e.g., offline or doc doesn't exist), use defaults
        setFlags(DEFAULT_FEATURE_FLAGS);
      },
    );
    return unsub;
  }, []);

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
