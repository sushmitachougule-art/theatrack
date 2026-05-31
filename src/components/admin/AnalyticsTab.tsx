"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  BarChart3,
  Users,
  Clock,
  Layers,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
} from "lucide-react";

type TimeRange = "7d" | "30d";

interface SessionData {
  userId: string;
  startedAt: string;
  duration?: number;
  pageViews: number;
  interactions: number;
  deviceType: "mobile" | "tablet" | "desktop";
  isDemo: boolean;
  isPWA: boolean;
}

interface BatchData {
  userId: string;
  events: Array<{
    event: string;
    category: string;
    label?: string;
    page: string;
    timestamp: string;
  }>;
  flushedAt: string;
  isDemo: boolean;
}

export function AnalyticsTab() {
  const [range, setRange] = useState<TimeRange>("7d");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const daysAgo = range === "7d" ? 7 : 30;
      const since = new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000,
      ).toISOString();

      try {
        // Fetch sessions
        const sessionsQ = query(
          collection(db, "analytics_sessions"),
          where("startedAt", ">=", since),
          orderBy("startedAt", "desc"),
          limit(500),
        );
        const sessionsSnap = await getDocs(sessionsQ);
        const sessionsData = sessionsSnap.docs.map(
          (d) => d.data() as SessionData,
        );
        setSessions(sessionsData);

        // Fetch event batches
        const batchesQ = query(
          collection(db, "analytics_batches"),
          where("flushedAt", ">=", since),
          orderBy("flushedAt", "desc"),
          limit(200),
        );
        const batchesSnap = await getDocs(batchesQ);
        const batchesData = batchesSnap.docs.map((d) => d.data() as BatchData);
        setBatches(batchesData);
      } catch {
        // Collection might not exist yet
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [range]);

  const stats = useMemo(() => {
    const uniqueUsers = new Set(sessions.map((s) => s.userId));
    const realSessions = sessions.filter((s) => !s.isDemo);
    const totalDuration = realSessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0,
    );
    const avgDuration = realSessions.length
      ? Math.round(totalDuration / realSessions.length)
      : 0;
    const totalPageViews = realSessions.reduce(
      (sum, s) => sum + s.pageViews,
      0,
    );
    const avgPages = realSessions.length
      ? (totalPageViews / realSessions.length).toFixed(1)
      : "0";
    const pwaCount = realSessions.filter((s) => s.isPWA).length;
    const pwaPercent = realSessions.length
      ? Math.round((pwaCount / realSessions.length) * 100)
      : 0;

    // Device breakdown
    const mobile = realSessions.filter((s) => s.deviceType === "mobile").length;
    const desktop = realSessions.filter(
      (s) => s.deviceType === "desktop",
    ).length;
    const tablet = realSessions.filter((s) => s.deviceType === "tablet").length;
    const totalDevices = mobile + desktop + tablet || 1;

    return {
      dau: uniqueUsers.size,
      avgDuration,
      avgPages,
      totalSessions: realSessions.length,
      pwaPercent,
      mobile: Math.round((mobile / totalDevices) * 100),
      desktop: Math.round((desktop / totalDevices) * 100),
      tablet: Math.round((tablet / totalDevices) * 100),
    };
  }, [sessions]);

  const featureUsage = useMemo(() => {
    const allEvents = batches.flatMap((b) => b.events || []);
    const pageViews = allEvents.filter((e) => e.event === "page_view");

    const features: Record<string, number> = {
      Journal: 0,
      Walks: 0,
      Community: 0,
      Training: 0,
      Expenses: 0,
      Messages: 0,
    };

    pageViews.forEach((ev) => {
      const page = ev.page || ev.label || "";
      if (page.includes("journal") || page.includes("/activity"))
        features.Journal++;
      if (page.includes("walk")) features.Walks++;
      if (page.includes("community")) features.Community++;
      if (page.includes("training")) features.Training++;
      if (page.includes("expenses")) features.Expenses++;
      if (page.includes("messages")) features.Messages++;
    });

    const maxVal = Math.max(...Object.values(features), 1);
    return Object.entries(features)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / maxVal) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [batches]);

  const topActions = useMemo(() => {
    const allEvents = batches.flatMap((b) => b.events || []);
    const actionCounts: Record<string, number> = {};
    allEvents.forEach((ev) => {
      if (ev.event === "page_view") return;
      const key = `${ev.event}${ev.label ? ` (${ev.label})` : ""}`;
      actionCounts[key] = (actionCounts[key] || 0) + 1;
    });
    return Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [batches]);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 120 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Time Range Toggle */}
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Analytics Overview
        </h3>
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: "var(--bg-input)" }}
        >
          {(["7d", "30d"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
              style={{
                background: range === r ? "var(--bg-card)" : "transparent",
                color:
                  range === r ? "var(--color-primary)" : "var(--text-muted)",
                boxShadow: range === r ? "var(--shadow-sm)" : "none",
              }}
            >
              {r === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Unique Users",
            value: stats.dau.toString(),
            icon: Users,
            color: "var(--color-accent)",
          },
          {
            label: "Avg Session",
            value: formatDuration(stats.avgDuration),
            icon: Clock,
            color: "var(--color-primary)",
          },
          {
            label: "Pages/Session",
            value: stats.avgPages,
            icon: Layers,
            color: "var(--color-success)",
          },
          {
            label: "Total Sessions",
            value: stats.totalSessions.toString(),
            icon: TrendingUp,
            color: "var(--color-warning)",
          },
        ].map((metric) => (
          <div key={metric.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <metric.icon size={14} style={{ color: metric.color }} />
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                {metric.label}
              </span>
            </div>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      {/* Feature Usage */}
      <div className="glass-card p-5">
        <h4
          className="text-xs font-bold uppercase tracking-wider mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          <BarChart3
            size={12}
            className="inline mr-1.5"
            style={{ color: "var(--color-primary)" }}
          />
          Feature Usage
        </h4>
        <div className="space-y-3">
          {featureUsage.map((feature) => (
            <div key={feature.name} className="flex items-center gap-3">
              <span
                className="text-xs font-medium w-20 shrink-0"
                style={{ color: "var(--text-primary)" }}
              >
                {feature.name}
              </span>
              <div
                className="flex-1 h-5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-input)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${feature.percent}%`,
                    background: "var(--gradient-primary)",
                    minWidth: feature.count > 0 ? "8px" : "0",
                  }}
                />
              </div>
              <span
                className="text-xs font-mono w-10 text-right shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                {feature.count}
              </span>
            </div>
          ))}
        </div>
        {featureUsage.every((f) => f.count === 0) && (
          <p
            className="text-xs text-center mt-4"
            style={{ color: "var(--text-muted)" }}
          >
            No usage data yet. Data will appear as users interact.
          </p>
        )}
      </div>

      {/* Top Actions */}
      {topActions.length > 0 && (
        <div className="glass-card p-5">
          <h4
            className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Top Actions
          </h4>
          <div className="space-y-2">
            {topActions.map(([action, count], i) => (
              <div
                key={action}
                className="flex items-center justify-between py-1.5"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold w-5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {i + 1}.
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {action}
                  </span>
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device Breakdown */}
      <div className="glass-card p-5">
        <h4
          className="text-xs font-bold uppercase tracking-wider mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          Device & Platform
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone size={14} style={{ color: "var(--color-primary)" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Mobile: {stats.mobile}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor size={14} style={{ color: "var(--color-accent)" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Desktop: {stats.desktop}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tablet size={14} style={{ color: "var(--color-warning)" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Tablet: {stats.tablet}%
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                PWA: {stats.pwaPercent}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Browser: {100 - stats.pwaPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <div
          className="text-center py-12"
          style={{ color: "var(--text-muted)" }}
        >
          <BarChart3 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No analytics data yet</p>
          <p className="text-xs mt-1">
            Data will appear here as users interact with the app.
          </p>
        </div>
      )}
    </div>
  );
}
