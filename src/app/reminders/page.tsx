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
} from "lucide-react";
import Link from "next/link";
import { subscribeToActiveNotifications } from "@/lib/repositories";
import { SystemNotification } from "@/types";
import { format, parseISO } from "date-fns";

function RemindersContent() {
  const { dogs } = useDogs();
  const { records, loading } = useVaccinationRecords();
  const [sysNotifs, setSysNotifs] = useState<SystemNotification[]>([]);
  const [view, setView] = useState<"list" | "timeline">("list");

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
    return Array.from(map.entries()); // already sorted by nextDueDate
  }, [enriched]);

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
          style={{ background: "rgba(245,158,11,0.15)" }}
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
    <div className="space-y-5 animate-fade-in">
      {/* Admin broadcast alerts */}
      {sysNotifs.length > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.18)",
            color: "#fbbf24",
          }}
        >
          <BellRing size={14} />
          {sysNotifs.length} active platform alert
          {sysNotifs.length > 1 ? "s" : ""} — shown in the banner above
        </div>
      )}

      {/* Header + view toggle */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Reminders
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Stay on top of your pets&apos; vaccination schedule
          </p>
        </div>
        {records.length > 0 && (
          <div
            className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
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
                    view === v ? "rgba(245,158,11,0.15)" : "transparent",
                  color:
                    view === v ? "var(--color-primary)" : "var(--text-muted)",
                  border:
                    view === v
                      ? "1px solid rgba(245,158,11,0.2)"
                      : "1px solid transparent",
                }}
              >
                {v === "list" ? <List size={13} /> : <CalendarDays size={13} />}
                {v === "list" ? "List" : "Timeline"}
              </button>
            ))}
          </div>
        )}
      </div>

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
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Add vaccination records to your dogs to see reminders here.
          </p>
        </div>
      ) : view === "list" ? (
        // ── List view ──────────────────────────────────────────────────────
        <div className="space-y-5">
          {grouped.overdue.length > 0 && (
            <div>
              <h2
                className="text-sm font-semibold mb-2 flex items-center gap-2"
                style={{ color: "#f87171" }}
              >
                <AlertTriangle size={15} /> Overdue ({grouped.overdue.length})
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
                <CheckCircle size={15} /> Up to Date ({grouped.upcoming.length})
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
        // ── Timeline view ──────────────────────────────────────────────────
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
                {/* Month label */}
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
                          background: "rgba(245,158,11,0.15)",
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

                {/* Cards in this month */}
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
                      {/* Day badge */}
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
