"use client";

import React, { useMemo, useEffect, useRef } from "react";
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
  ArrowRight,
  PawPrint,
} from "lucide-react";
import { VaccinationRecord } from "@/types";

import OnboardingWizard from "@/components/dashboard/OnboardingWizard";

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`status-${status} inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium`}
    >
      {status === "green" && <CheckCircle size={11} />}
      {status === "yellow" && <Clock size={11} />}
      {status === "red" && <AlertTriangle size={11} />}
      {label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <div className="skeleton skeleton-text w-40" />
          <div className="skeleton skeleton-text-sm w-64 mt-2" />
        </div>
        <div className="skeleton w-28 h-10 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 140 }} />
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

function DashboardContent() {
  const { profile } = useAuth();
  const { dogs, loading: dogsLoading } = useDogs();
  const { records, loading: recsLoading } = useVaccinationRecords();
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      seedDatabase();
    }
  }, []);

  const stats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let upToDate = 0;
    const upcoming: (VaccinationRecord & { dogName: string })[] = [];

    records.forEach((r) => {
      if (r.status !== "completed") return;
      const info = getVaccinationStatus(r.nextDueDate);
      if (info.status === "red") overdue++;
      else if (info.status === "yellow") dueSoon++;
      else upToDate++;

      if (info.status === "red" || info.status === "yellow") {
        const dog = dogs.find((d) => d.id === r.dogId);
        upcoming.push({ ...r, dogName: dog?.name || "Unknown" });
      }
    });

    upcoming.sort(
      (a, b) =>
        new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime(),
    );

    return { overdue, dueSoon, upToDate, total: records.length, upcoming };
  }, [records, dogs]);

  const loading = dogsLoading || recsLoading;

  if (loading) return <LoadingSkeleton />;

  if (dogs.length === 0) {
    return <OnboardingWizard />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-extrabold"
            style={{ color: "var(--text-primary)" }}
          >
            {getGreeting()}
            {profile?.displayName
              ? `, ${profile.displayName.split(" ")[0]}`
              : ""}{" "}
            👋
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {stats.overdue > 0
              ? `${stats.overdue} vaccination${stats.overdue !== 1 ? "s" : ""} need your attention`
              : stats.dueSoon > 0
                ? `${stats.dueSoon} vaccination${stats.dueSoon !== 1 ? "s" : ""} due soon`
                : `All ${dogs.length > 1 ? dogs.length + " dogs" : "dogs"} are up to date`}
          </p>
        </div>
        <Link
          href="/dogs/new"
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus size={16} /> Add Dog
        </Link>
      </div>

      {/* Alert banner */}
      {stats.overdue > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl animate-slide-down"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.15)" }}
          >
            <AlertTriangle size={20} style={{ color: "#f87171" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
              {stats.overdue} vaccination{stats.overdue !== 1 ? "s" : ""}{" "}
              overdue!
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Please schedule an appointment with your vet as soon as possible.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        {[
          {
            label: "Total Dogs",
            value: dogs.length,
            icon: Dog,
            color: "var(--color-primary)",
            bg: "rgba(245,158,11,0.08)",
          },
          {
            label: "Up to Date",
            value: stats.upToDate,
            icon: CheckCircle,
            color: "var(--color-success)",
            bg: "rgba(16,185,129,0.08)",
          },
          {
            label: "Due Soon",
            value: stats.dueSoon,
            icon: Clock,
            color: "var(--color-warning)",
            bg: "rgba(245,158,11,0.08)",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            icon: AlertTriangle,
            color: "var(--color-danger)",
            bg: "rgba(239,68,68,0.08)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-card p-5"
            style={{ cursor: "default" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                {s.label}
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: s.bg }}
              >
                <s.icon size={15} style={{ color: s.color }} />
              </div>
            </div>
            <p className="stat-value" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Dogs grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            My Dogs
          </h2>
          {dogs.length > 0 && (
            <Link
              href="/dogs"
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              View all <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {dogs.length === 0 ? (
          <div
            className="glass-card p-10 text-center"
            style={{ cursor: "default" }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 dog-avatar">
              <PawPrint size={28} style={{ color: "var(--color-primary)" }} />
            </div>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              No dogs added yet
            </p>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              Add your first dog to start tracking vaccinations and health
              records.
            </p>
            <Link
              href="/dogs/new"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={16} /> Add Your First Dog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
            {dogs.map((dog) => {
              const dogRecords = records.filter(
                (r) => r.dogId === dog.id && r.status === "completed",
              );
              const overdueCount = dogRecords.filter(
                (r) => getVaccinationStatus(r.nextDueDate).status === "red",
              ).length;
              const dueSoonCount = dogRecords.filter(
                (r) => getVaccinationStatus(r.nextDueDate).status === "yellow",
              ).length;

              const totalRecords = dogRecords.length;
              const protectionScore =
                totalRecords === 0
                  ? 0
                  : Math.round(
                      ((totalRecords - overdueCount - dueSoonCount) /
                        totalRecords) *
                        100,
                    );

              let scoreColor = "#10b981"; // Green
              if (protectionScore < 100 && protectionScore >= 50)
                scoreColor = "#f59e0b"; // Yellow
              if (protectionScore < 50) scoreColor = "#ef4444"; // Red

              // Next vaccination due
              const nextDue = dogRecords
                .filter(
                  (r) =>
                    getVaccinationStatus(r.nextDueDate).status !== "green" ||
                    true,
                )
                .sort(
                  (a, b) =>
                    new Date(a.nextDueDate).getTime() -
                    new Date(b.nextDueDate).getTime(),
                )[0];

              return (
                <Link
                  key={dog.id}
                  href={`/dogs/${dog.id}`}
                  className="glass-card overflow-hidden group hover:scale-[1.02] transition-transform duration-300 flex flex-col"
                >
                  {/* Banner/Image Area */}
                  <div className="h-32 w-full relative bg-slate-800/50 flex items-center justify-center overflow-hidden">
                    {dog.photoUrl ? (
                      <Image
                        src={dog.photoUrl}
                        alt={dog.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <PawPrint
                        size={40}
                        className="text-slate-600 opacity-50"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <h3 className="absolute bottom-3 left-4 font-extrabold text-xl text-white tracking-wide drop-shadow-md">
                      {dog.name}
                    </h3>
                  </div>

                  {/* Content Area */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-slate-400 mb-4 font-medium flex items-center gap-2">
                      <span className="truncate max-w-[120px]">
                        {dog.breed}
                      </span>{" "}
                      • {getDogAge(dog.dateOfBirth)}
                    </p>

                    {/* Protection Score Bar */}
                    <div className="mb-4 mt-auto">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold mb-1.5">
                        <span className="text-slate-500">Protection Level</span>
                        <span style={{ color: scoreColor }}>
                          {protectionScore}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-1000 ease-out rounded-full"
                          style={{
                            width: `${protectionScore}%`,
                            backgroundColor: scoreColor,
                          }}
                        />
                      </div>
                    </div>

                    {/* Next due */}
                    {nextDue && (
                      <p
                        className="text-[11px] mb-3 flex items-center gap-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Clock size={11} />
                        Next:{" "}
                        <span
                          style={{
                            color:
                              getVaccinationStatus(nextDue.nextDueDate)
                                .status === "red"
                                ? "#f87171"
                                : getVaccinationStatus(nextDue.nextDueDate)
                                      .status === "yellow"
                                  ? "#fbbf24"
                                  : "var(--text-secondary)",
                          }}
                        >
                          {nextDue.vaccinationTypeName} ·{" "}
                          {formatDate(nextDue.nextDueDate)}
                        </span>
                      </p>
                    )}

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {overdueCount > 0 && (
                        <StatusBadge
                          status="red"
                          label={`${overdueCount} overdue`}
                        />
                      )}
                      {dueSoonCount > 0 && (
                        <StatusBadge
                          status="yellow"
                          label={`${dueSoonCount} due soon`}
                        />
                      )}
                      {overdueCount === 0 &&
                        dueSoonCount === 0 &&
                        totalRecords > 0 && (
                          <StatusBadge status="green" label="All clear" />
                        )}
                      {totalRecords === 0 && (
                        <StatusBadge status="gray" label="Needs setup" />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming vaccinations */}
      {stats.upcoming.length > 0 && (
        <div>
          <h2
            className="text-lg font-bold mb-3 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <AlertTriangle
              size={18}
              style={{ color: "var(--color-warning)" }}
            />
            Upcoming & Overdue
          </h2>
          <div className="space-y-2 stagger-children">
            {stats.upcoming.slice(0, 10).map((r) => {
              const info = getVaccinationStatus(r.nextDueDate);
              return (
                <Link
                  key={r.id}
                  href={`/dogs/${r.dogId}`}
                  className="glass-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(245,158,11,0.1)" }}
                    >
                      <Syringe
                        size={15}
                        style={{ color: "var(--color-primary)" }}
                      />
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {r.vaccinationTypeName}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {r.dogName} · Due {formatDate(r.nextDueDate)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={info.status} label={info.label} />
                </Link>
              );
            })}
          </div>
        </div>
      )}
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
