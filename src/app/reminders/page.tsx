"use client";

import React, { useMemo, useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useDogs } from "@/hooks/useDogs";
import { useVaccinationRecords } from "@/hooks/useVaccinations";
import { getVaccinationStatus, formatDate } from "@/lib/utils/dateUtils";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  Syringe,
  BellRing,
  List,
  CalendarDays,
  Info,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { subscribeToActiveNotifications } from "@/lib/repositories";
import { SystemNotification } from "@/types";
import { format, parseISO, formatDistanceToNow } from "date-fns";

// ── Notification type config ─────────────────────────────────────────────────
const NOTIF_CONFIG = {
  info: {
    icon: Info,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.20)",
  },
  warning: {
    icon: AlertTriangle,
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.20)",
  },
  success: {
    icon: ShieldCheck,
    color: "#34d399",
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.20)",
  },
};

function RemindersContent() {
  const { dogs } = useDogs();
  const { records, loading } = useVaccinationRecords();
  const [sysNotifs, setSysNotifs] = useState<SystemNotification[]>([]);
  const [view, setView] = useState<"list" | "timeline">("list");
  const [activeTab, setActiveTab] = useState<"reminders" | "notifications">(
    "reminders",
  );

  useEffect(() => {
    const unsub = subscribeToActiveNotifications(setSysNotifs);
    return () => unsub();
  }, []);

  const enriched = useMemo(
    () =>
      records
        .filter((r) => r.status === "completed")
        .map((r) => ({
          ...r,
          dogName: dogs.find((d) => d.id === r.dogId)?.name || "Unknown",
          statusInfo: getVaccinationStatus(r.nextDueDate),
        }))
        .sort(
          (a, b) =>
            new Date(a.nextDueDate).getTime() -
            new Date(b.nextDueDate).getTime(),
        ),
    [records, dogs],
  );

  const grouped = useMemo(() => {
    const overdue = enriched.filter((r) => r.statusInfo.status === "red");
    const dueSoon = enriched.filter((r) => r.statusInfo.status === "yellow");
    const upcoming = enriched.filter((r) => r.statusInfo.status === "green");
    return { overdue, dueSoon, upcoming };
  }, [enriched]);

  // Timeline: group all records by "MMMM yyyy" (month)
  const timelineMonths = useMemo(() => {
    const map = new Map<string, typeof enriched>();
    enriched.forEach((r) => {
      const key = format(parseISO(r.nextDueDate), "MMMM yyyy");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries());
  }, [enriched]);

  // Badge counts
  const urgentCount = grouped.overdue.length + grouped.dueSoon.length;

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );

  const ReminderCard = ({ r }: { r: (typeof enriched)[0] }) => (
    <Link
      href={`/dogs/${r.dogId}`}
      className="glass-card p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-primary-bg-strong)" }}
        >
          <Syringe size={16} style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {r.vaccinationTypeName}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {r.dogName} · Due {formatDate(r.nextDueDate)}
          </p>
        </div>
      </div>
      <span
        className={`status-${r.statusInfo.status} px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 flex-shrink-0`}
      >
        {r.statusInfo.status === "green" && <CheckCircle size={11} />}
        {r.statusInfo.status === "yellow" && <Clock size={11} />}
        {r.statusInfo.status === "red" && <AlertTriangle size={11} />}
        {r.statusInfo.label}
      </span>
    </Link>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Reminders
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Vaccination schedule &amp; platform notifications
        </p>
      </div>

      {/* Tab switcher */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        {(["reminders", "notifications"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const badge =
            tab === "reminders" && urgentCount > 0
              ? urgentCount
              : tab === "notifications" && sysNotifs.length > 0
                ? sysNotifs.length
                : 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all relative"
              style={{
                background: isActive
                  ? "var(--color-primary-bg-strong)"
                  : "transparent",
                color: isActive ? "var(--color-primary)" : "var(--text-muted)",
                border: isActive
                  ? "1px solid var(--color-primary-border)"
                  : "1px solid transparent",
              }}
            >
              {tab === "reminders" ? (
                <Bell size={15} />
              ) : (
                <BellRing size={15} />
              )}
              {tab === "reminders" ? "Reminders" : "Notifications"}
              {badge > 0 && (
                <span
                  className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                  style={{
                    background:
                      tab === "reminders"
                        ? "rgba(239,68,68,0.85)"
                        : "rgba(96,165,250,0.85)",
                    color: "white",
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── REMINDERS TAB ──────────────────────────────────────────────── */}
      {activeTab === "reminders" && (
        <>
          {/* View toggle */}
          {records.length > 0 && (
            <div className="flex justify-end">
              <div
                className="flex items-center gap-1 p-1 rounded-xl"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {(["list", "timeline"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background:
                        view === v
                          ? "var(--color-primary-bg-strong)"
                          : "transparent",
                      color:
                        view === v
                          ? "var(--color-primary)"
                          : "var(--text-muted)",
                      border:
                        view === v
                          ? "1px solid var(--color-primary-border)"
                          : "1px solid transparent",
                    }}
                  >
                    {v === "list" ? (
                      <List size={13} />
                    ) : (
                      <CalendarDays size={13} />
                    )}
                    {v === "list" ? "List" : "Timeline"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {records.length === 0 ? (
            <div
              className="glass-card p-12 text-center"
              style={{ cursor: "default" }}
            >
              <Bell
                size={36}
                className="mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                No reminders yet
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Add vaccination records to your dogs to see reminders here.
              </p>
            </div>
          ) : view === "list" ? (
            <div className="space-y-5">
              {grouped.overdue.length > 0 && (
                <div>
                  <h2
                    className="text-sm font-semibold mb-2 flex items-center gap-2"
                    style={{ color: "#f87171" }}
                  >
                    <AlertTriangle size={15} /> Overdue (
                    {grouped.overdue.length})
                  </h2>
                  <div className="space-y-2">
                    {grouped.overdue.map((r) => (
                      <ReminderCard key={r.id} r={r} />
                    ))}
                  </div>
                </div>
              )}
              {grouped.dueSoon.length > 0 && (
                <div>
                  <h2
                    className="text-sm font-semibold mb-2 flex items-center gap-2"
                    style={{ color: "#fbbf24" }}
                  >
                    <Clock size={15} /> Due Soon ({grouped.dueSoon.length})
                  </h2>
                  <div className="space-y-2">
                    {grouped.dueSoon.map((r) => (
                      <ReminderCard key={r.id} r={r} />
                    ))}
                  </div>
                </div>
              )}
              {grouped.upcoming.length > 0 && (
                <div>
                  <h2
                    className="text-sm font-semibold mb-2 flex items-center gap-2"
                    style={{ color: "#34d399" }}
                  >
                    <CheckCircle size={15} /> Up to Date (
                    {grouped.upcoming.length})
                  </h2>
                  <div className="space-y-2">
                    {grouped.upcoming.slice(0, 15).map((r) => (
                      <ReminderCard key={r.id} r={r} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {timelineMonths.map(([month, monthRecords]) => {
                const now = new Date();
                const [monthName, year] = month.split(" ");
                const monthDate = new Date(`${monthName} 1, ${year}`);
                const isPast =
                  monthDate < new Date(now.getFullYear(), now.getMonth(), 1);
                const isCurrent =
                  monthDate.getMonth() === now.getMonth() &&
                  monthDate.getFullYear() === now.getFullYear();

                return (
                  <div key={month}>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="flex-shrink-0 w-2 h-2 rounded-full"
                        style={{
                          background: isCurrent
                            ? "var(--color-primary)"
                            : isPast
                              ? "#f87171"
                              : "var(--border-color)",
                        }}
                      />
                      <h3
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{
                          color: isCurrent
                            ? "var(--color-primary)"
                            : isPast
                              ? "#f87171"
                              : "var(--text-muted)",
                        }}
                      >
                        {month}
                        {isCurrent && (
                          <span
                            className="ml-2 normal-case text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: "var(--color-primary-bg-strong)",
                              color: "var(--color-primary)",
                            }}
                          >
                            This month
                          </span>
                        )}
                      </h3>
                      <div
                        className="flex-1 h-px"
                        style={{ background: "var(--border-color)" }}
                      />
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {monthRecords.length} vaccine
                        {monthRecords.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-2 pl-5">
                      {monthRecords.map((r) => (
                        <Link
                          key={r.id}
                          href={`/dogs/${r.dogId}`}
                          className="flex items-center gap-3 p-3 rounded-xl transition-all"
                          style={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center"
                            style={{
                              background:
                                r.statusInfo.status === "red"
                                  ? "rgba(239,68,68,0.12)"
                                  : r.statusInfo.status === "yellow"
                                    ? "rgba(245,158,11,0.12)"
                                    : "rgba(16,185,129,0.12)",
                            }}
                          >
                            <span
                              className="text-sm font-extrabold leading-none"
                              style={{
                                color:
                                  r.statusInfo.status === "red"
                                    ? "#f87171"
                                    : r.statusInfo.status === "yellow"
                                      ? "#fbbf24"
                                      : "#34d399",
                              }}
                            >
                              {format(parseISO(r.nextDueDate), "d")}
                            </span>
                            <span
                              className="text-[9px] uppercase font-semibold leading-none mt-0.5"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {format(parseISO(r.nextDueDate), "EEE")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {r.vaccinationTypeName}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {r.dogName}
                            </p>
                          </div>
                          <span
                            className={`status-${r.statusInfo.status} px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 flex-shrink-0`}
                          >
                            {r.statusInfo.status === "green" && (
                              <CheckCircle size={11} />
                            )}
                            {r.statusInfo.status === "yellow" && (
                              <Clock size={11} />
                            )}
                            {r.statusInfo.status === "red" && (
                              <AlertTriangle size={11} />
                            )}
                            {r.statusInfo.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── NOTIFICATIONS TAB ──────────────────────────────────────────── */}
      {activeTab === "notifications" && (
        <div className="space-y-3">
          {sysNotifs.length === 0 ? (
            <div
              className="glass-card p-12 text-center"
              style={{ cursor: "default" }}
            >
              <BellRing
                size={36}
                className="mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                No active notifications
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Platform alerts from PawShield will appear here.
              </p>
            </div>
          ) : (
            sysNotifs.map((n) => {
              const cfg =
                NOTIF_CONFIG[n.type as keyof typeof NOTIF_CONFIG] ||
                NOTIF_CONFIG.info;
              const IconComp = cfg.icon;
              return (
                <div
                  key={n.id}
                  className="glass-card p-4 flex items-start gap-3"
                  style={{ cursor: "default" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    <IconComp size={17} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {n.title}
                    </p>
                    <p
                      className="text-xs mt-0.5 leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {n.message}
                    </p>
                    <p
                      className="text-[11px] mt-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDistanceToNow(parseISO(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <p
            className="text-[11px] text-center pt-2"
            style={{ color: "var(--text-muted)" }}
          >
            Showing active platform announcements only.
          </p>
        </div>
      )}
    </div>
  );
}

export default function RemindersPage() {
  return (
    <AppLayout>
      <RemindersContent />
    </AppLayout>
  );
}
