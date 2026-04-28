"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useDogs } from "@/hooks/useDogs";
import { useVaccinationRecords } from "@/hooks/useVaccinations";
import {
  getVaccinationStatus,
  formatDate,
  getDogAge,
} from "@/lib/utils/dateUtils";
import { seedDatabase } from "@/lib/seed";
import {
  Dog,
  Syringe,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  ChevronDown,
  ChevronRight,
  PawPrint,
  X,
} from "lucide-react";
import { VaccinationRecord } from "@/types";
import OnboardingWizard from "@/components/dashboard/OnboardingWizard";

type FilterType = "all" | "upToDate" | "dueSoon" | "overdue";

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`status-${status} inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold`}
    >
      {status === "green" && <CheckCircle size={10} />}
      {status === "yellow" && <Clock size={10} />}
      {status === "red" && <AlertTriangle size={10} />}
      {label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton skeleton-text w-40" />
          <div className="skeleton skeleton-text-sm w-64 mt-2" />
        </div>
        <div className="skeleton w-28 h-9 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 88 }} />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 68 }} />
        ))}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Expanded dog panel ───────────────────────────────────────────────────
function DogExpandedPanel({
  dog,
  records,
}: {
  dog: { id: string; name: string };
  records: VaccinationRecord[];
}) {
  const completed = records.filter((r) => r.status === "completed");
  const overdueRecs = completed.filter(
    (r) => getVaccinationStatus(r.nextDueDate).status === "red",
  );
  const dueSoonRecs = completed.filter(
    (r) => getVaccinationStatus(r.nextDueDate).status === "yellow",
  );
  const upToDateRecs = completed.filter(
    (r) => getVaccinationStatus(r.nextDueDate).status === "green",
  );
  const total = completed.length;
  const score =
    total === 0
      ? 0
      : Math.round(
          ((total - overdueRecs.length - dueSoonRecs.length) / total) * 100,
        );
  const scoreColor =
    score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  const displayRecs = [...overdueRecs, ...dueSoonRecs, ...upToDateRecs].slice(
    0,
    5,
  );

  return (
    <div
      className="animate-slide-down"
      style={{
        borderTop: "1px solid var(--border-color)",
        background: "var(--bg-card-hover)",
        padding: "14px 16px 16px",
      }}
    >
      {total === 0 ? (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            No vaccination records yet.
          </p>
          <Link
            href={`/dogs/${dog.id}`}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <Plus size={12} /> Add First Record
          </Link>
        </div>
      ) : (
        <>
          {/* Score bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] mb-1.5">
              <span style={{ color: "var(--text-muted)" }}>
                Protection Level
              </span>
              <span className="font-bold" style={{ color: scoreColor }}>
                {score}% · {total} record{total !== 1 ? "s" : ""}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--bg-input)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, background: scoreColor }}
              />
            </div>
          </div>

          {/* Vaccination rows */}
          <div className="space-y-1.5 mb-3">
            {displayRecs.map((r) => {
              const info = getVaccinationStatus(r.nextDueDate);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Syringe
                      size={12}
                      style={{ color: "var(--color-primary)", flexShrink: 0 }}
                    />
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {r.vaccinationTypeName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Due {formatDate(r.nextDueDate)}
                    </span>
                    <StatusBadge status={info.status} label={info.label} />
                  </div>
                </div>
              );
            })}
            {total > 5 && (
              <p
                className="text-[10px] text-center pt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                +{total - 5} more records
              </p>
            )}
          </div>

          {/* Actions */}
          <Link
            href={`/dogs/${dog.id}`}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 w-full justify-center"
          >
            View Full Details <ChevronRight size={12} />
          </Link>
        </>
      )}
    </div>
  );
}

function DashboardContent() {
  const { profile } = useAuth();
  const { dogs, loading: dogsLoading } = useDogs();
  const { records, loading: recsLoading } = useVaccinationRecords();
  const seeded = useRef(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedDogId, setExpandedDogId] = useState<string | null>(null);

  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      seedDatabase();
    }
  }, []);

  // Per-dog stats — memoized
  const dogStats = useMemo(() => {
    const map = new Map<
      string,
      {
        overdueCount: number;
        dueSoonCount: number;
        total: number;
        protectionScore: number;
        scoreColor: string;
        nextDue: VaccinationRecord | null;
      }
    >();
    dogs.forEach((dog) => {
      const dogRecs = records.filter(
        (r) => r.dogId === dog.id && r.status === "completed",
      );
      const overdueCount = dogRecs.filter(
        (r) => getVaccinationStatus(r.nextDueDate).status === "red",
      ).length;
      const dueSoonCount = dogRecs.filter(
        (r) => getVaccinationStatus(r.nextDueDate).status === "yellow",
      ).length;
      const total = dogRecs.length;
      const protectionScore =
        total === 0
          ? 0
          : Math.round(((total - overdueCount - dueSoonCount) / total) * 100);
      const scoreColor =
        protectionScore >= 80
          ? "#10b981"
          : protectionScore >= 50
            ? "#f59e0b"
            : "#ef4444";
      const nextDue =
        [...dogRecs].sort(
          (a, b) =>
            new Date(a.nextDueDate).getTime() -
            new Date(b.nextDueDate).getTime(),
        )[0] || null;
      map.set(dog.id, {
        overdueCount,
        dueSoonCount,
        total,
        protectionScore,
        scoreColor,
        nextDue,
      });
    });
    return map;
  }, [dogs, records]);

  const globalStats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let upToDate = 0;
    records.forEach((r) => {
      if (r.status !== "completed") return;
      const info = getVaccinationStatus(r.nextDueDate);
      if (info.status === "red") overdue++;
      else if (info.status === "yellow") dueSoon++;
      else upToDate++;
    });
    return { overdue, dueSoon, upToDate };
  }, [records]);

  // Filter dogs by active filter
  const filteredDogs = useMemo(() => {
    if (activeFilter === "all") return dogs;
    return dogs.filter((dog) => {
      const s = dogStats.get(dog.id);
      if (!s) return false;
      if (activeFilter === "overdue") return s.overdueCount > 0;
      if (activeFilter === "dueSoon")
        return s.dueSoonCount > 0 && s.overdueCount === 0;
      if (activeFilter === "upToDate")
        return s.overdueCount === 0 && s.dueSoonCount === 0 && s.total > 0;
      return true;
    });
  }, [dogs, dogStats, activeFilter]);

  const loading = dogsLoading || recsLoading;
  if (loading) return <LoadingSkeleton />;
  if (dogs.length === 0) return <OnboardingWizard />;

  const toggleExpand = (dogId: string) => {
    setExpandedDogId((prev) => (prev === dogId ? null : dogId));
  };

  const handleFilterClick = (f: FilterType) => {
    setActiveFilter((prev) => (prev === f ? "all" : f));
    setExpandedDogId(null);
  };

  const statCards = [
    {
      id: "all" as FilterType,
      label: "Total Dogs",
      value: dogs.length,
      sub: `${dogs.length > 1 ? "dogs" : "dog"} registered`,
      icon: Dog,
      color: "var(--color-primary)",
      bg: "rgba(13,148,136,0.08)",
    },
    {
      id: "upToDate" as FilterType,
      label: "Up to Date",
      value: globalStats.upToDate,
      sub: "vaccines current",
      icon: CheckCircle,
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
    },
    {
      id: "dueSoon" as FilterType,
      label: "Due Soon",
      value: globalStats.dueSoon,
      sub: "within 30 days",
      icon: Clock,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
    },
    {
      id: "overdue" as FilterType,
      label: "Overdue",
      value: globalStats.overdue,
      sub: globalStats.overdue > 0 ? "needs vet visit" : "none — great!",
      icon: AlertTriangle,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-xl font-extrabold"
            style={{ color: "var(--text-primary)" }}
          >
            {getGreeting()}
            {profile?.displayName
              ? `, ${profile.displayName.split(" ")[0]}`
              : ""}{" "}
            👋
          </h1>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {globalStats.overdue > 0
              ? `${globalStats.overdue} vaccination${globalStats.overdue !== 1 ? "s" : ""} need your attention`
              : globalStats.dueSoon > 0
                ? `${globalStats.dueSoon} due soon — schedule a vet visit`
                : `All ${dogs.length} dog${dogs.length !== 1 ? "s" : ""} up to date 🎉`}
          </p>
        </div>
        <Link
          href="/dogs/new"
          className="btn-primary flex items-center gap-2 w-fit text-sm"
        >
          <Plus size={15} /> Add Dog
        </Link>
      </div>

      {/* Alert banner */}
      {globalStats.overdue > 0 && (
        <div
          className="flex items-center gap-3 p-3.5 rounded-xl animate-slide-down"
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.18)",
          }}
        >
          <AlertTriangle
            size={17}
            style={{ color: "#f87171", flexShrink: 0 }}
          />
          <p className="text-xs" style={{ color: "#f87171" }}>
            <span className="font-semibold">
              {globalStats.overdue} vaccination
              {globalStats.overdue !== 1 ? "s" : ""} overdue.
            </span>{" "}
            Schedule a vet appointment soon.
          </p>
        </div>
      )}

      {/* Stat cards — clickable filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const filterActive = activeFilter !== "all" && activeFilter === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleFilterClick(s.id)}
              className="glass-card p-4 text-left transition-all duration-200 w-full"
              style={{
                cursor: "pointer",
                border: filterActive
                  ? `2px solid ${s.color}`
                  : "1px solid var(--glass-border)",
                boxShadow: filterActive ? `0 0 0 3px ${s.color}20` : undefined,
                transform: filterActive ? "scale(1.02)" : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: s.bg }}
                >
                  <s.icon size={14} style={{ color: s.color }} />
                </div>
                {filterActive && (
                  <X size={12} style={{ color: "var(--text-muted)" }} />
                )}
              </div>
              <p
                className="text-2xl font-extrabold leading-none"
                style={{ color: s.color }}
              >
                {s.value}
              </p>
              <p
                className="text-[11px] font-semibold mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.label}
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {s.sub}
              </p>
            </button>
          );
        })}
      </div>

      {/* Dogs list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2
              className="text-base font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {activeFilter === "all"
                ? "My Dogs"
                : activeFilter === "upToDate"
                  ? "Up to Date Dogs"
                  : activeFilter === "dueSoon"
                    ? "Due Soon"
                    : "Overdue Vaccinations"}
            </h2>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium transition-all"
                style={{
                  background: "var(--bg-input)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <X size={9} /> Clear
              </button>
            )}
          </div>
          <Link
            href="/dogs"
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--color-primary)" }}
          >
            View all
          </Link>
        </div>

        {filteredDogs.length === 0 ? (
          <div
            className="glass-card p-6 text-center"
            style={{ cursor: "default" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No dogs match this filter.
            </p>
            <button
              onClick={() => setActiveFilter("all")}
              className="text-xs mt-2 font-medium hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDogs.map((dog) => {
              const s = dogStats.get(dog.id)!;
              const isExpanded = expandedDogId === dog.id;
              const dogRecords = records.filter((r) => r.dogId === dog.id);

              return (
                <div
                  key={dog.id}
                  className="glass-card overflow-hidden transition-all duration-200"
                  style={{ cursor: "default" }}
                >
                  {/* Compact row */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(dog.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 dog-avatar flex items-center justify-center">
                      {dog.photoUrl ? (
                        <Image
                          src={dog.photoUrl}
                          alt={dog.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PawPrint
                          size={18}
                          style={{ color: "var(--color-primary)" }}
                        />
                      )}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="text-sm font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {dog.name}
                        </p>
                        {s.overdueCount > 0 && (
                          <StatusBadge
                            status="red"
                            label={`${s.overdueCount} overdue`}
                          />
                        )}
                        {s.dueSoonCount > 0 && s.overdueCount === 0 && (
                          <StatusBadge
                            status="yellow"
                            label={`${s.dueSoonCount} due soon`}
                          />
                        )}
                        {s.overdueCount === 0 &&
                          s.dueSoonCount === 0 &&
                          s.total > 0 && (
                            <StatusBadge status="green" label="All clear" />
                          )}
                        {s.total === 0 && (
                          <StatusBadge status="gray" label="No records" />
                        )}
                      </div>
                      <p
                        className="text-[11px] truncate mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {dog.breed} · {getDogAge(dog.dateOfBirth)}
                        {s.nextDue
                          ? ` · Next: ${formatDate(s.nextDue.nextDueDate)}`
                          : ""}
                      </p>
                    </div>

                    {/* Score + chevron */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {s.total > 0 && (
                        <div className="text-right hidden sm:block">
                          <p
                            className="text-sm font-extrabold leading-none"
                            style={{ color: s.scoreColor }}
                          >
                            {s.protectionScore}%
                          </p>
                          <p
                            className="text-[9px] mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            protected
                          </p>
                        </div>
                      )}
                      <ChevronDown
                        size={16}
                        style={{
                          color: "var(--text-muted)",
                          transform: isExpanded
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.25s",
                        }}
                      />
                    </div>
                  </button>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <DogExpandedPanel dog={dog} records={dogRecords} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  );
}
