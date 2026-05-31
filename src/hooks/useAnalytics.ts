"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { usePathname } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const DEMO_EMAIL = "demo@theatrack.app";
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

interface QueuedEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, string | number | boolean>;
  page: string;
  timestamp: string;
  deviceType: "mobile" | "tablet" | "desktop";
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("pawshield_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("pawshield_session_id", id);
  }
  return id;
}

export function useAnalytics() {
  const { user } = useAuth();
  const pathname = usePathname();
  const eventQueue = useRef<QueuedEvent[]>([]);
  const sessionDocId = useRef<string | null>(null);
  const pageViewCount = useRef(0);
  const interactionCount = useRef(0);
  const sessionStartTime = useRef(0);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Flush batched events to Firestore
  const flushEvents = useCallback(async () => {
    if (!user || eventQueue.current.length === 0) return;
    const events = eventQueue.current.splice(0);
    try {
      await addDoc(collection(db, "analytics_batches"), {
        userId: user.uid,
        sessionId: getSessionId(),
        events,
        isDemo: user.email === DEMO_EMAIL,
        flushedAt: new Date().toISOString(),
      });
    } catch {
      // Analytics should never break the app
    }
  }, [user]);

  // Start session on mount
  useEffect(() => {
    if (!user) return;
    sessionStartTime.current = Date.now();

    const startSession = async () => {
      try {
        const sessionDoc = await addDoc(collection(db, "analytics_sessions"), {
          userId: user.uid,
          sessionId: getSessionId(),
          startedAt: new Date().toISOString(),
          pageViews: 0,
          interactions: 0,
          pages: [pathname],
          deviceType: getDeviceType(),
          isDemo: user.email === DEMO_EMAIL,
          isPWA: window.matchMedia("(display-mode: standalone)").matches,
        });
        sessionDocId.current = sessionDoc.id;
      } catch {
        // Best-effort
      }
    };

    startSession();

    // Flush timer
    flushTimer.current = setInterval(flushEvents, FLUSH_INTERVAL);

    // End session on unload
    const endSession = () => {
      flushEvents();
      if (sessionDocId.current) {
        const duration = Math.round(
          (Date.now() - sessionStartTime.current) / 1000,
        );
        navigator.sendBeacon(
          "/api/analytics/session-end",
          JSON.stringify({
            sessionId: sessionDocId.current,
            duration,
            pageViews: pageViewCount.current,
            interactions: interactionCount.current,
          }),
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") endSession();
    };

    window.addEventListener("beforeunload", endSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", endSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (flushTimer.current) clearInterval(flushTimer.current);
      flushEvents();
    };
  }, [user, pathname, flushEvents]);

  // Track page views automatically
  useEffect(() => {
    if (!user) return;
    pageViewCount.current++;
    eventQueue.current.push({
      event: "page_view",
      category: "navigation",
      label: pathname,
      page: pathname,
      timestamp: new Date().toISOString(),
      deviceType: getDeviceType(),
    });

    // Flush if batch is full
    if (eventQueue.current.length >= BATCH_SIZE) {
      flushEvents();
    }
  }, [pathname, user, flushEvents]);

  const trackEvent = useCallback(
    (
      event: string,
      category: string,
      label?: string,
      value?: number,
      metadata?: Record<string, string | number | boolean>,
    ) => {
      if (!user) return;
      interactionCount.current++;

      eventQueue.current.push({
        event,
        category,
        label,
        value,
        metadata,
        page: pathname,
        timestamp: new Date().toISOString(),
        deviceType: getDeviceType(),
      });

      // Flush if batch is full
      if (eventQueue.current.length >= BATCH_SIZE) {
        flushEvents();
      }
    },
    [user, pathname, flushEvents],
  );

  return { trackEvent };
}
