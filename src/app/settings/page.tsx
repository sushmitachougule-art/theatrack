"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, THEMES } from "@/hooks/useTheme";
import {
  Settings,
  User,
  Bell,
  PlusCircle,
  Pencil,
  Check,
  BellOff,
  LogOut,
  Palette,
} from "lucide-react";
import { submitFeedback } from "@/lib/repositories";
import { updateDisplayName } from "@/lib/firebase/auth";
import { useFCM } from "@/hooks/useFCM";
import toast from "react-hot-toast";

function SettingsContent() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const { notificationPermissionStatus, requestPermission } = useFCM();
  const { theme, setTheme } = useTheme();
  const [reqType, setReqType] = useState<"breed" | "vaccine">("breed");
  const [reqText, setReqText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Display name edit
  const [editingName, setEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(
    profile?.displayName || "",
  );
  const [savingName, setSavingName] = useState(false);

  // Sync input when profile loads
  React.useEffect(() => {
    if (profile?.displayName && !editingName) {
      setDisplayNameInput(profile.displayName);
    }
  }, [profile?.displayName, editingName]);

  const handleSaveName = async () => {
    if (!user || !displayNameInput.trim()) return;
    try {
      setSavingName(true);
      await updateDisplayName(user.uid, displayNameInput.trim());
      await refreshProfile();
      setEditingName(false);
      toast.success("Display name updated!");
    } catch {
      toast.error("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqText.trim() || !user) return;
    try {
      setSubmitting(true);
      const label = reqType === "breed" ? "Dog Breed" : "Vaccination Type";
      await submitFeedback(
        user.uid,
        profile?.email,
        "feature",
        `[${label} Request] ${reqText.trim()}`,
      );
      toast.success("Request submitted! We'll review it shortly.");
      setReqText("");
    } catch {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage your account preferences
        </p>
      </div>

      {/* Appearance */}
      <div className="glass-card p-5" style={{ cursor: "default" }}>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={18} style={{ color: "var(--color-primary)" }} />
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Appearance
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className="relative flex flex-col items-center gap-2.5 p-3.5 rounded-2xl transition-all duration-200"
                style={{
                  background: isActive
                    ? "var(--color-primary-50, rgba(var(--color-primary),0.08))"
                    : "var(--bg-input)",
                  border: `2px solid ${
                    isActive ? "var(--color-primary)" : "var(--border-color)"
                  }`,
                  transform: isActive ? "scale(1.02)" : "scale(1)",
                  boxShadow: isActive ? "var(--shadow-glow)" : "none",
                }}
              >
                {/* Color preview */}
                <div
                  className="w-full h-12 rounded-xl overflow-hidden flex gap-1 p-1.5"
                  style={{ background: t.preview.bg }}
                >
                  <div
                    className="flex-1 rounded-lg"
                    style={{ background: t.preview.card }}
                  />
                  <div
                    className="w-4 rounded-lg"
                    style={{ background: t.preview.primary }}
                  />
                </div>

                {/* Label */}
                <div className="text-center">
                  <p
                    className="text-xs font-bold flex items-center justify-center gap-1"
                    style={{
                      color: isActive
                        ? "var(--color-primary)"
                        : "var(--text-primary)",
                    }}
                  >
                    <span>{t.icon}</span> {t.label}
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t.description}
                  </p>
                </div>

                {/* Active checkmark */}
                {isActive && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--color-primary)" }}
                  >
                    <Check size={11} color="white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile */}
      <div className="glass-card p-5" style={{ cursor: "default" }}>
        <div className="flex items-center gap-2 mb-4">
          <User size={18} style={{ color: "var(--color-primary)" }} />
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Profile
          </h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="form-label">Display Name</label>
            <div className="flex items-center gap-2">
              {editingName ? (
                <>
                  <input
                    className="form-input flex-1"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    maxLength={40}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || !displayNameInput.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: "rgba(245,158,11,0.15)",
                      color: "var(--color-primary)",
                      border: "1px solid rgba(245,158,11,0.3)",
                    }}
                  >
                    {savingName ? (
                      "…"
                    ) : (
                      <>
                        <Check size={13} /> Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setDisplayNameInput(profile?.displayName || "");
                    }}
                    className="px-3 py-2 rounded-lg text-xs transition-all"
                    style={{
                      background: "var(--bg-input)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <input
                    className="form-input flex-1"
                    value={profile?.displayName || ""}
                    readOnly
                  />
                  <button
                    onClick={() => setEditingName(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: "var(--bg-input)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-color)",
                    }}
                    title="Edit display name"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                </>
              )}
            </div>
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
              className="form-input"
              value={profile?.email || ""}
              readOnly
            />
          </div>
          <div>
            <label className="form-label">Role</label>
            <input
              className="form-input capitalize"
              value={profile?.role || "owner"}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="glass-card p-5" style={{ cursor: "default" }}>
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} style={{ color: "var(--color-primary)" }} />
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Push Notifications
          </h2>
        </div>

        {notificationPermissionStatus === "granted" ? (
          <div className="space-y-3">
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <Check size={16} style={{ color: "#34d399" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#34d399" }}>
                  Push notifications are enabled
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  You'll be notified 7, 3, and 1 day before vaccinations are
                  due.
                </p>
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              To disable, go to your browser or OS notification settings for
              this site.
            </p>
          </div>
        ) : notificationPermissionStatus === "denied" ? (
          <div className="space-y-3">
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <BellOff size={16} style={{ color: "#f87171" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "#f87171" }}>
                  Notifications blocked
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  You&apos;ve blocked notifications. To re-enable, click the
                  lock icon in your browser&apos;s address bar and allow
                  notifications.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Enable push notifications to get reminders when your dog&apos;s
              vaccinations are coming up — even when the app is closed.
            </p>
            <ul
              className="text-xs space-y-1 pl-4"
              style={{ color: "var(--text-muted)", listStyleType: "disc" }}
            >
              <li>7 days before due</li>
              <li>3 days before due</li>
              <li>1 day before due</li>
              <li>When overdue</li>
            </ul>
            <button
              onClick={requestPermission}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              <Bell size={15} /> Enable Push Notifications
            </button>
            {!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY && (
              <p
                className="text-[11px] px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(245,158,11,0.08)",
                  color: "#fbbf24",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                ⚠️ VAPID key not configured — add{" "}
                <code>NEXT_PUBLIC_FIREBASE_VAPID_KEY</code> to your environment
                variables.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Request a breed / vaccination type */}
      <div className="glass-card p-5" style={{ cursor: "default" }}>
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle size={18} style={{ color: "var(--color-primary)" }} />
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Request a Breed or Vaccine Type
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Can&apos;t find your dog&apos;s breed or a vaccination type? Submit a
          request and we&apos;ll add it to the platform.
        </p>
        <form onSubmit={handleRequest} className="space-y-3">
          <div className="flex gap-2">
            {(["breed", "vaccine"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setReqType(t)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background:
                    reqType === t ? "rgba(245,158,11,0.15)" : "var(--bg-input)",
                  color:
                    reqType === t
                      ? "var(--color-primary)"
                      : "var(--text-muted)",
                  border: `1px solid ${reqType === t ? "rgba(245,158,11,0.3)" : "var(--border-color)"}`,
                }}
              >
                {t === "breed" ? "🐕 Dog Breed" : "💉 Vaccine Type"}
              </button>
            ))}
          </div>
          <div>
            <label className="form-label">
              {reqType === "breed"
                ? "Breed name (e.g. Shih Tzu, Samoyed)"
                : "Vaccine name (e.g. Giardia, Lyme Disease)"}
            </label>
            <input
              className="form-input"
              value={reqText}
              onChange={(e) => setReqText(e.target.value)}
              placeholder={
                reqType === "breed"
                  ? "Enter breed name…"
                  : "Enter vaccine name…"
              }
              maxLength={120}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !reqText.trim()}
            className="btn-primary w-full text-sm"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </div>

      {/* Sign Out */}
      <div className="glass-card p-5" style={{ cursor: "default" }}>
        <div className="flex items-center gap-2 mb-4">
          <LogOut size={18} style={{ color: "#f87171" }} />
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Account
          </h2>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "rgba(239,68,68,0.08)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* App info */}
      <div className="glass-card p-5" style={{ cursor: "default" }}>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} style={{ color: "var(--color-primary)" }} />
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            About
          </h2>
        </div>
        <div
          className="space-y-1 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <p>PawShield v1.0.0</p>
          <p>Built with Next.js + Firebase</p>
          <p>© {new Date().getFullYear()} PawShield</p>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppLayout>
      <SettingsContent />
    </AppLayout>
  );
}
