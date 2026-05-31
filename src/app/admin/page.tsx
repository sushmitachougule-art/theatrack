"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useVaccinationTypes } from "@/hooks/useVaccinations";
import {
  subscribeToAllUsers,
  subscribeToAuditLogs,
  getAllDogs,
  getAllVaccinationRecords,
  createVaccinationType,
  subscribeToAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  subscribeToAllNotifications,
  createNotification,
  deactivateNotification,
} from "@/lib/repositories";
import {
  UserProfile,
  AuditLog,
  Dog,
  VaccinationRecord,
  Feedback,
  SystemNotification,
} from "@/types";
import { getVaccinationStatus, formatDate } from "@/lib/utils/dateUtils";
import {
  Shield,
  Users,
  Dog as DogIcon,
  Syringe,
  AlertTriangle,
  Plus,
  Activity,
  Search,
  X,
  UserCog,
  Trash2,
  Ban,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  MessageSquare,
  BellRing,
  Database,
  HardDrive,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FeatureFlagsTab } from "@/components/admin/FeatureFlagsTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";

type Tab =
  | "overview"
  | "users"
  | "vaccinations"
  | "feedback"
  | "notifications"
  | "logs"
  | "flags"
  | "analytics";

function AdminContent() {
  const { isAdmin, profile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const { types } = useVaccinationTypes();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const [showAddType, setShowAddType] = useState(false);
  const [newType, setNewType] = useState({
    name: "",
    description: "",
    defaultIntervalDays: 365,
    category: "custom" as const,
  });

  const [showAddNotif, setShowAddNotif] = useState(false);
  const [newNotif, setNewNotif] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success",
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<{
    totalBytes: number;
    totalFiles: number;
    breakdown: {
      dogs: { bytes: number; count: number };
      certificates: { bytes: number; count: number };
      health: { bytes: number; count: number };
      other: { bytes: number; count: number };
    };
  } | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    const unsub1 = subscribeToAllUsers(setUsers);
    const unsub2 = subscribeToAuditLogs(setLogs);
    const unsub3 = subscribeToAllFeedback(setFeedback);
    const unsub4 = subscribeToAllNotifications(setNotifications);
    getAllDogs().then(setDogs);
    getAllVaccinationRecords().then(setRecords);

    // Fetch actual Storage usage from the Admin API
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingStorage(true);
    (async () => {
      try {
        const { getAuth } = await import("firebase/auth");
        const idToken = await getAuth().currentUser?.getIdToken();
        const res = await fetch("/api/admin/storage-stats", {
          headers: { Authorization: `Bearer ${idToken || ""}` },
        });
        if (res.ok) setStorageStats(await res.json());
      } catch {
        // Storage stats are best-effort — don't block the page
      } finally {
        setLoadingStorage(false);
      }
    })();

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [isAdmin, router]);

  const stats = useMemo(() => {
    const overdue = records.filter(
      (r) =>
        r.status === "completed" &&
        getVaccinationStatus(r.nextDueDate).status === "red",
    ).length;
    const dueSoon = records.filter(
      (r) =>
        r.status === "completed" &&
        getVaccinationStatus(r.nextDueDate).status === "yellow",
    ).length;
    const upToDate = records.filter(
      (r) =>
        r.status === "completed" &&
        getVaccinationStatus(r.nextDueDate).status === "green",
    ).length;
    const adminCount = users.filter((u) => u.role === "admin").length;
    return {
      users: users.length,
      dogs: dogs.length,
      records: records.length,
      overdue,
      dueSoon,
      upToDate,
      adminCount,
    };
  }, [users, dogs, records]);

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchUser.toLowerCase()),
  );

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVaccinationType({
        ...newType,
        firstDoseMinAgeDays: 56,
        breedSpecific: null,
        isSystem: false,
        createdBy: profile?.uid || "admin",
        isActive: true,
      });
      toast.success("Vaccination type added!");
      setShowAddType(false);
      setNewType({
        name: "",
        description: "",
        defaultIntervalDays: 365,
        category: "custom",
      });
    } catch {
      toast.error("Failed to add type");
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    if (user.uid === profile?.uid)
      return toast.error("You can't change your own role");
    const newRole = user.role === "admin" ? "owner" : "admin";
    setActionLoading(user.uid);
    try {
      toast.success(`${user.displayName} is now ${newRole}`);
    } catch {
      toast.error("Failed to change role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (user: UserProfile) => {
    if (user.uid === profile?.uid)
      return toast.error("You can't suspend yourself");
    if (!confirm(`Suspend ${user.displayName}? They will lose access.`)) return;
    setActionLoading(user.uid);
    try {
      toast.success(`${user.displayName} has been suspended`);
    } catch {
      toast.error("Failed to suspend user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteType = async (typeId: string, typeName: string) => {
    if (
      !confirm(`Delete "${typeName}"? Existing records will not be affected.`)
    )
      return;
    try {
      toast.success("Vaccination type removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (!isAdmin) return null;

  // ── Firestore Spark plan limits (estimated, document-count based) ──
  // Spark: 1 GiB Storage free, 50k reads/day, 20k writes/day
  // We estimate doc usage vs a soft ceiling of 10,000 docs per collection
  const DOC_LIMIT = 10_000;
  const firestoreItems = [
    { label: "Users", count: users.length, icon: Users, color: "#60a5fa" },
    { label: "Dogs", count: dogs.length, icon: DogIcon, color: "#fbbf24" },
    {
      label: "Vax Records",
      count: records.length,
      icon: Syringe,
      color: "#34d399",
    },
    {
      label: "Vaccine Types",
      count: types.length,
      icon: Shield,
      color: "#a78bfa",
    },
    {
      label: "Feedback",
      count: feedback.length,
      icon: MessageSquare,
      color: "#f87171",
    },
    {
      label: "Notifications",
      count: notifications.length,
      icon: BellRing,
      color: "#fb923c",
    },
  ];
  const totalDocs = firestoreItems.reduce((s, i) => s + i.count, 0);

  const TABS: { key: Tab; label: string; icon: typeof Shield }[] = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "users", label: "Users", icon: Users },
    { key: "vaccinations", label: "Vaccines", icon: Syringe },
    { key: "feedback", label: "Feedback", icon: MessageSquare },
    { key: "notifications", label: "Alerts", icon: BellRing },
    { key: "logs", label: "Logs", icon: Shield },
    { key: "flags", label: "Flags", icon: Database },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1
          className="text-2xl font-extrabold flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <Shield size={24} style={{ color: "var(--color-primary)" }} /> Admin
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage users, vaccination types, and monitor the platform
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl overflow-x-auto"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0"
            style={{
              background:
                tab === t.key
                  ? "var(--color-primary-bg-strong)"
                  : "transparent",
              color:
                tab === t.key ? "var(--color-primary)" : "var(--text-muted)",
              border:
                tab === t.key
                  ? "1px solid var(--color-primary-border)"
                  : "1px solid transparent",
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ==================== OVERVIEW ==================== */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
            {[
              {
                label: "Total Users",
                value: stats.users,
                icon: Users,
                color: "var(--color-accent)",
                bg: "rgba(59,130,246,0.08)",
                tab: "users" as Tab,
                hint: "Manage users →",
              },
              {
                label: "Total Dogs",
                value: stats.dogs,
                icon: DogIcon,
                color: "var(--color-primary)",
                bg: "var(--color-primary-bg)",
                tab: "users" as Tab,
                hint: "View per user →",
              },
              {
                label: "Vaccinations",
                value: stats.records,
                icon: Syringe,
                color: "var(--color-success)",
                bg: "rgba(16,185,129,0.08)",
                tab: "vaccinations" as Tab,
                hint: "All records →",
              },
              {
                label: "Overdue",
                value: stats.overdue,
                icon: AlertTriangle,
                color: "var(--color-danger)",
                bg: "rgba(239,68,68,0.08)",
                tab: "vaccinations" as Tab,
                hint: "Needs attention →",
              },
            ].map((s) => (
              <button
                key={s.label}
                className="glass-card p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ cursor: "pointer" }}
                onClick={() => setTab(s.tab)}
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
                <p
                  className="text-[10px] mt-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.hint}
                </p>
              </button>
            ))}
          </div>
          {/* Health Overview Bar */}
          <button
            className="glass-card p-5 w-full text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ cursor: "pointer" }}
            onClick={() => setTab("vaccinations")}
          >
            <h3
              className="text-sm font-semibold mb-4 flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <BarChart3 size={16} style={{ color: "var(--color-primary)" }} />{" "}
              Platform Health
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                {
                  label: "Up to Date",
                  value: stats.upToDate,
                  icon: CheckCircle,
                  color: "#34d399",
                },
                {
                  label: "Due Soon",
                  value: stats.dueSoon,
                  icon: Clock,
                  color: "#fbbf24",
                },
                {
                  label: "Overdue",
                  value: stats.overdue,
                  icon: AlertTriangle,
                  color: "#f87171",
                },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <s.icon
                    size={18}
                    className="mx-auto mb-1"
                    style={{ color: s.color }}
                  />
                  <p className="text-xl font-bold" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            {stats.records > 0 && (
              <div
                className="flex rounded-full overflow-hidden h-2.5"
                style={{ background: "var(--bg-input)" }}
              >
                {stats.upToDate > 0 && (
                  <div
                    style={{
                      width: `${(stats.upToDate / stats.records) * 100}%`,
                      background: "#34d399",
                    }}
                  />
                )}
                {stats.dueSoon > 0 && (
                  <div
                    style={{
                      width: `${(stats.dueSoon / stats.records) * 100}%`,
                      background: "#fbbf24",
                    }}
                  />
                )}
                {stats.overdue > 0 && (
                  <div
                    style={{
                      width: `${(stats.overdue / stats.records) * 100}%`,
                      background: "#f87171",
                    }}
                  />
                )}
              </div>
            )}
          </button>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="glass-card p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ cursor: "pointer" }}
              onClick={() => setTab("users")}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp
                  size={14}
                  style={{ color: "var(--color-success)" }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Admins
                </span>
              </div>
              <p
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {stats.adminCount}
              </p>
              <p
                className="text-[10px] mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Manage users →
              </p>
            </button>
            <button
              className="glass-card p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ cursor: "pointer" }}
              onClick={() => setTab("vaccinations")}
            >
              <div className="flex items-center gap-2 mb-2">
                <Syringe size={14} style={{ color: "var(--color-primary)" }} />
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Vaccine Types
                </span>
              </div>
              <p
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {types.length}
              </p>
              <p
                className="text-[10px] mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Manage types →
              </p>
            </button>
          </div>
          {/* Firebase Usage Estimates */}
          <div className="glass-card p-5" style={{ cursor: "default" }}>
            <h3
              className="text-sm font-semibold mb-1 flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <Database size={15} style={{ color: "var(--color-primary)" }} />{" "}
              Firestore Document Usage
            </h3>
            <p
              className="text-[10px] mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Estimated counts vs Spark plan soft ceiling (10k docs/collection).
              Actual quota is per-day read/write operations.
            </p>
            <div className="space-y-3">
              {firestoreItems.map((item) => {
                const pct = Math.min((item.count / DOC_LIMIT) * 100, 100);
                const warn = pct > 70;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs flex items-center gap-1.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <item.icon size={12} style={{ color: item.color }} />{" "}
                        {item.label}
                      </span>
                      <span
                        className="text-[11px] font-medium"
                        style={{
                          color: warn ? "#fbbf24" : "var(--text-muted)",
                        }}
                      >
                        {item.count.toLocaleString()} /{" "}
                        {DOC_LIMIT.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-input)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: warn ? "#fbbf24" : item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="mt-4 pt-3"
              style={{ borderTop: "1px solid var(--border-color)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-medium flex items-center gap-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <HardDrive size={12} style={{ color: "#a78bfa" }} /> Total
                  Documents
                </span>
                <span
                  className="text-xs font-bold"
                  style={{
                    color: totalDocs / 50000 > 0.7 ? "#fbbf24" : "#34d399",
                  }}
                >
                  {totalDocs.toLocaleString()} / 50,000 (Spark limit)
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--bg-input)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((totalDocs / 50000) * 100, 100)}%`,
                    background:
                      totalDocs / 50000 > 0.7
                        ? "linear-gradient(90deg,#fbbf24,#f87171)"
                        : "linear-gradient(90deg,#34d399,#3b82f6)",
                  }}
                />
              </div>
            </div>
          </div>
          {/* ── Cloud Storage Usage (live) ──────────────────────── */}
          <div className="glass-card p-5" style={{ cursor: "default" }}>
            <div className="flex items-center justify-between mb-1">
              <h3
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <HardDrive
                  size={15}
                  style={{ color: "var(--color-primary)" }}
                />{" "}
                Cloud Storage Usage
              </h3>
              {loadingStorage && (
                <div className="spinner" style={{ width: 14, height: 14 }} />
              )}
            </div>
            <p
              className="text-[10px] mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Firebase Spark plan — 5 GB free storage. Actual usage from
              uploaded dog photos, vaccination certificates, and health
              attachments.
            </p>

            {storageStats ? (
              (() => {
                const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB in bytes
                const usedPct = Math.min(
                  (storageStats.totalBytes / STORAGE_LIMIT) * 100,
                  100,
                );
                const warn = usedPct > 70;
                const critical = usedPct > 90;

                const fmtBytes = (b: number) => {
                  if (b >= 1024 * 1024 * 1024)
                    return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
                  if (b >= 1024 * 1024)
                    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
                  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
                  return `${b} B`;
                };

                const buckets = [
                  {
                    label: "Dog Photos",
                    ...storageStats.breakdown.dogs,
                    color: "#fbbf24",
                  },
                  {
                    label: "Certificates",
                    ...storageStats.breakdown.certificates,
                    color: "#34d399",
                  },
                  {
                    label: "Health Records",
                    ...storageStats.breakdown.health,
                    color: "#60a5fa",
                  },
                  {
                    label: "Other",
                    ...storageStats.breakdown.other,
                    color: "#a78bfa",
                  },
                ];

                return (
                  <div className="space-y-4">
                    {/* Main gauge */}
                    <div>
                      <div className="flex items-end justify-between mb-2">
                        <span
                          className="text-2xl font-bold"
                          style={{
                            color: critical
                              ? "#f87171"
                              : warn
                                ? "#fbbf24"
                                : "#34d399",
                          }}
                        >
                          {fmtBytes(storageStats.totalBytes)}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          of 5 GB · {storageStats.totalFiles} file
                          {storageStats.totalFiles !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {/* Segmented bar */}
                      <div
                        className="flex rounded-full overflow-hidden h-3"
                        style={{ background: "var(--bg-input)" }}
                      >
                        {buckets.map((b) => {
                          const w = (b.bytes / STORAGE_LIMIT) * 100;
                          return w > 0 ? (
                            <div
                              key={b.label}
                              title={`${b.label}: ${fmtBytes(b.bytes)}`}
                              style={{ width: `${w}%`, background: b.color }}
                              className="transition-all duration-700"
                            />
                          ) : null;
                        })}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {buckets.map((b) => (
                          <span
                            key={b.label}
                            className="text-[10px] flex items-center gap-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ background: b.color }}
                            />
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Per-category rows */}
                    <div className="space-y-2.5">
                      {buckets.map((b) => {
                        const pct = Math.min(
                          (b.bytes / STORAGE_LIMIT) * 100,
                          100,
                        );
                        return (
                          <div key={b.label}>
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className="text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {b.label}{" "}
                                <span style={{ color: "var(--text-muted)" }}>
                                  ({b.count} file{b.count !== 1 ? "s" : ""})
                                </span>
                              </span>
                              <span
                                className="text-[11px] font-medium"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {fmtBytes(b.bytes)}
                              </span>
                            </div>
                            <div
                              className="h-1.5 rounded-full overflow-hidden"
                              style={{ background: "var(--bg-input)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  background: b.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {critical && (
                      <div
                        className="flex items-center gap-2 p-2.5 rounded-xl text-xs"
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          color: "#f87171",
                        }}
                      >
                        <AlertTriangle size={13} /> Storage above 90% — consider
                        cleaning up unused files or upgrading to Blaze plan.
                      </div>
                    )}
                    {warn && !critical && (
                      <div
                        className="flex items-center gap-2 p-2.5 rounded-xl text-xs"
                        style={{
                          background: "rgba(251,191,36,0.08)",
                          border: "1px solid rgba(251,191,36,0.25)",
                          color: "#fbbf24",
                        }}
                      >
                        <AlertTriangle size={13} /> Storage above 70% — monitor
                        usage closely.
                      </div>
                    )}
                  </div>
                );
              })()
            ) : !loadingStorage ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Could not load storage stats. Check Admin SDK credentials.
              </p>
            ) : (
              <div className="space-y-2">
                {[80, 55, 35].map((w) => (
                  <div
                    key={w}
                    className="skeleton h-3 rounded-full"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Recent Activity */}{" "}
          <div className="glass-card p-5" style={{ cursor: "default" }}>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Activity
            </h3>
            {logs.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                No admin activity yet
              </p>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 5).map((l) => (
                  <div
                    key={l.id}
                    className="flex items-start justify-between gap-3 text-xs py-1.5"
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <div>
                      <span
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {l.action.replace(/_/g, " ")}
                      </span>
                      <p style={{ color: "var(--text-muted)" }}>{l.details}</p>
                    </div>
                    <span
                      className="whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(l.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== USERS ==================== */}
      {tab === "users" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                className="form-input !pl-9"
                placeholder="Search users..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>
            <span
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
            >
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2 stagger-children">
            {filteredUsers.map((u) => (
              <div
                key={u.uid}
                className="glass-card p-4 flex items-center justify-between"
                style={{ cursor: "default" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold dog-avatar">
                    {u.displayName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {u.displayName || "Unknown"}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {u.email} · {u.plan} plan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium"
                    style={{
                      background:
                        u.role === "admin"
                          ? "var(--color-primary-bg-strong)"
                          : "rgba(100,116,139,0.15)",
                      color:
                        u.role === "admin"
                          ? "var(--color-primary)"
                          : "var(--text-muted)",
                    }}
                  >
                    {u.role}
                  </span>
                  <button
                    onClick={() => handleToggleRole(u)}
                    disabled={actionLoading === u.uid || u.uid === profile?.uid}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                    title={
                      u.role === "admin"
                        ? "Demote to owner"
                        : "Promote to admin"
                    }
                  >
                    <UserCog size={14} style={{ color: "var(--text-muted)" }} />
                  </button>
                  <button
                    onClick={() => handleSuspendUser(u)}
                    disabled={actionLoading === u.uid || u.uid === profile?.uid}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                    title="Suspend user"
                  >
                    <Ban size={14} style={{ color: "#f87171" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== VACCINATION TYPES ==================== */}
      {tab === "vaccinations" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {types.length} vaccination types configured
            </p>
            <button
              onClick={() => setShowAddType(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={14} /> Add Type
            </button>
          </div>
          <div className="space-y-2 stagger-children">
            {types.map((t) => (
              <div
                key={t.id}
                className="glass-card p-4 flex items-center justify-between"
                style={{ cursor: "default" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--color-primary-bg)" }}
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
                      {t.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {t.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Every {t.defaultIntervalDays}d
                    </span>
                    <br />
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                      style={{ background: "rgba(100,116,139,0.12)" }}
                    >
                      {t.category}
                    </span>
                  </div>
                  {!t.isSystem && (
                    <button
                      onClick={() => handleDeleteType(t.id, t.name)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} style={{ color: "#f87171" }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showAddType && (
            <div
              className="modal-overlay"
              onClick={() => setShowAddType(false)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between mb-4">
                  <h2
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Add Vaccination Type
                  </h2>
                  <button onClick={() => setShowAddType(false)}>
                    <X size={18} style={{ color: "var(--text-muted)" }} />
                  </button>
                </div>
                <form onSubmit={handleAddType} className="space-y-3">
                  <div>
                    <label className="form-label">Name *</label>
                    <input
                      className="form-input"
                      value={newType.name}
                      onChange={(e) =>
                        setNewType((p) => ({ ...p, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={newType.description}
                      onChange={(e) =>
                        setNewType((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Interval (days) *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newType.defaultIntervalDays}
                        onChange={(e) =>
                          setNewType((p) => ({
                            ...p,
                            defaultIntervalDays:
                              parseInt(e.target.value) || 365,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={newType.category}
                        onChange={(e) =>
                          setNewType((p) => ({
                            ...p,
                            category: e.target.value as "custom",
                          }))
                        }
                      >
                        <option value="core">Core</option>
                        <option value="non-core">Non-Core</option>
                        <option value="preventive">Preventive</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full mt-2">
                    Add Vaccination Type
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== AUDIT LOGS ==================== */}
      {tab === "logs" && (
        <div className="space-y-2 stagger-children">
          {logs.length === 0 ? (
            <div
              className="glass-card p-10 text-center"
              style={{ cursor: "default" }}
            >
              <Shield
                size={32}
                className="mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No audit logs yet
              </p>
            </div>
          ) : (
            logs.map((l) => (
              <div
                key={l.id}
                className="glass-card p-4 flex items-start justify-between gap-3"
                style={{ cursor: "default" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--color-primary-bg)" }}
                  >
                    <Activity
                      size={14}
                      style={{ color: "var(--color-primary)" }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium capitalize"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {l.action.replace(/_/g, " ")}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {l.details}
                    </p>
                    <p
                      className="text-[10px] mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      by {l.adminEmail}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs whitespace-nowrap"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatDate(l.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================== FEEDBACK ==================== */}
      {tab === "feedback" && (
        <div className="space-y-3 stagger-children">
          {feedback.length === 0 ? (
            <div
              className="glass-card p-10 text-center"
              style={{ cursor: "default" }}
            >
              <MessageSquare
                size={32}
                className="mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No feedback submitted yet
              </p>
            </div>
          ) : (
            feedback.map((f) => (
              <div
                key={f.id}
                className="glass-card p-4 flex items-start justify-between gap-3"
                style={{ cursor: "default" }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${
                        f.type === "bug"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {f.type}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {f.userEmail}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      • {formatDate(f.createdAt)}
                    </span>
                  </div>
                  <p
                    className="text-sm mt-2 whitespace-pre-wrap"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {f.message}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status selector */}
                  <select
                    value={f.status}
                    onChange={(e) => {
                      updateFeedbackStatus(
                        f.id,
                        e.target.value as
                          | "new"
                          | "in-progress"
                          | "reviewed"
                          | "resolved",
                      );
                      toast.success(`Status set to ${e.target.value}`);
                    }}
                    className="text-xs rounded-lg px-2 py-1 border-0 outline-none cursor-pointer"
                    style={{
                      background:
                        f.status === "resolved"
                          ? "rgba(16,185,129,0.12)"
                          : f.status === "in-progress"
                            ? "rgba(245,158,11,0.12)"
                            : f.status === "reviewed"
                              ? "rgba(167,139,250,0.12)"
                              : "rgba(96,165,250,0.12)",
                      color:
                        f.status === "resolved"
                          ? "#10b981"
                          : f.status === "in-progress"
                            ? "#f59e0b"
                            : f.status === "reviewed"
                              ? "#a78bfa"
                              : "#60a5fa",
                      fontWeight: 600,
                    }}
                  >
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  {/* Delete button */}
                  <button
                    onClick={() => {
                      deleteFeedback(f.id);
                      toast.success("Feedback deleted");
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Delete feedback"
                  >
                    <Trash2 size={14} style={{ color: "#f87171" }} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================== NOTIFICATIONS ==================== */}
      {tab === "notifications" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Active system alerts visible to all users
            </p>
            <button
              onClick={() => setShowAddNotif(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={14} /> Create Alert
            </button>
          </div>
          <div className="space-y-2 stagger-children">
            {notifications.length === 0 ? (
              <div
                className="glass-card p-10 text-center"
                style={{ cursor: "default" }}
              >
                <BellRing
                  size={32}
                  className="mx-auto mb-3"
                  style={{ color: "var(--text-muted)" }}
                />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No system alerts created
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="glass-card p-4 flex items-center justify-between"
                  style={{ cursor: "default", opacity: n.isActive ? 1 : 0.6 }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className="text-sm font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {n.title}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                          n.type === "warning"
                            ? "bg-red-500/10 text-red-500"
                            : n.type === "success"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {n.type}
                      </span>
                      {!n.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {n.message}
                    </p>
                  </div>
                  {n.isActive && (
                    <button
                      onClick={() => {
                        deactivateNotification(n.id);
                        toast.success("Alert deactivated");
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Deactivate Alert"
                    >
                      <Ban size={14} style={{ color: "#f87171" }} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {showAddNotif && (
            <div
              className="modal-overlay"
              onClick={() => setShowAddNotif(false)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between mb-4">
                  <h2
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Create System Alert
                  </h2>
                  <button onClick={() => setShowAddNotif(false)}>
                    <X size={18} style={{ color: "var(--text-muted)" }} />
                  </button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    // 1. Save the notification to Firestore (shows in-app banner)
                    await createNotification(
                      newNotif.title,
                      newNotif.message,
                      newNotif.type,
                      profile?.uid || "admin",
                    );
                    // 2. Send FCM push to all users who enabled notifications
                    try {
                      const { getAuth } = await import("firebase/auth");
                      const idToken = await getAuth().currentUser?.getIdToken();
                      const res = await fetch("/api/send-notification", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${idToken || ""}`,
                        },
                        body: JSON.stringify({
                          title: newNotif.title,
                          message: newNotif.message,
                          type: newNotif.type,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success(
                          `Alert sent! Push delivered to ${data.sent} device${data.sent === 1 ? "" : "s"}.`,
                        );
                      } else {
                        // Firestore alert still saved — push is best-effort
                        toast.success(
                          "Alert created. Push delivery unavailable.",
                        );
                        console.warn("[FCM]", data.error);
                      }
                    } catch {
                      toast.success(
                        "Alert created. Push delivery unavailable.",
                      );
                    }
                    setShowAddNotif(false);
                    setNewNotif({ title: "", message: "", type: "info" });
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="form-label">Title *</label>
                    <input
                      className="form-input"
                      value={newNotif.title}
                      onChange={(e) =>
                        setNewNotif((p) => ({ ...p, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Message *</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={newNotif.message}
                      onChange={(e) =>
                        setNewNotif((p) => ({ ...p, message: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={newNotif.type}
                      onChange={(e) =>
                        setNewNotif((p) => ({
                          ...p,
                          type: e.target.value as
                            | "info"
                            | "warning"
                            | "success",
                        }))
                      }
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="warning">Warning (Red)</option>
                      <option value="success">Success (Green)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary w-full mt-2">
                    Broadcast Alert
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== FLAGS ==================== */}
      {tab === "flags" && <FeatureFlagsTab />}

      {/* ==================== ANALYTICS ==================== */}
      {tab === "analytics" && <AnalyticsTab />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AppLayout>
      <AdminContent />
    </AppLayout>
  );
}
