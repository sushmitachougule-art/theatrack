"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/hooks/useAuth";
import { FeatureFlags } from "@/types";
import { ToggleLeft, ToggleRight, Save, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface FlagToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function FlagToggle({
  label,
  description,
  checked,
  onChange,
}: FlagToggleProps) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-[var(--bg-input)]">
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-medium block"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </span>
        {description && (
          <span
            className="text-xs block mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="shrink-0 transition-colors duration-200"
        style={{
          color: checked ? "var(--color-primary)" : "var(--text-muted)",
        }}
      >
        {checked ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
      </button>
    </label>
  );
}

export function FeatureFlagsTab() {
  const currentFlags = useFeatureFlags();
  const { profile } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(currentFlags);
  const [saving, setSaving] = useState(false);
  const [lastSyncedFlags, setLastSyncedFlags] = useState(currentFlags);

  // Sync local state when remote flags update (only if user hasn't made local changes)
  if (currentFlags !== lastSyncedFlags) {
    setLastSyncedFlags(currentFlags);
    if (!saving) {
      setFlags(currentFlags);
    }
  }

  const hasChanges = JSON.stringify(flags) !== JSON.stringify(currentFlags);

  const updateFlag = (key: keyof FeatureFlags, value: boolean | string) => {
    setFlags((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "appConfig", "featureFlags"), {
        ...flags,
        updatedAt: new Date().toISOString(),
        updatedBy: profile?.email || "admin",
      });
      toast.success("Feature flags updated!");
    } catch {
      toast.error("Failed to save flags");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Section Visibility */}
      <div className="glass-card p-5">
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Section Visibility
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Turn off sections to hide them from all users.
        </p>
        <div className="space-y-1">
          <FlagToggle
            label="Journal"
            description="Daily health journal in Activity tab"
            checked={flags.activityJournal}
            onChange={(v) => updateFlag("activityJournal", v)}
          />
          <FlagToggle
            label="Walks"
            description="Walk logging and GPS tracking"
            checked={flags.activityWalks}
            onChange={(v) => updateFlag("activityWalks", v)}
          />
          <FlagToggle
            label="Community"
            description="Social feed with posts and likes"
            checked={flags.activityCommunity}
            onChange={(v) => updateFlag("activityCommunity", v)}
          />
          <FlagToggle
            label="Playdates"
            description="Playdate requests between users"
            checked={flags.activityPlaydates}
            onChange={(v) => updateFlag("activityPlaydates", v)}
          />
          <FlagToggle
            label="Training"
            description="Training modules and weekly challenges"
            checked={flags.training}
            onChange={(v) => updateFlag("training", v)}
          />
          <FlagToggle
            label="Expenses"
            description="Dog expense tracking"
            checked={flags.expenses}
            onChange={(v) => updateFlag("expenses", v)}
          />
          <FlagToggle
            label="Messages"
            description="Direct messaging between users"
            checked={flags.messages}
            onChange={(v) => updateFlag("messages", v)}
          />
        </div>
      </div>

      {/* Auth Controls */}
      <div className="glass-card p-5">
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Auth Controls
        </h3>
        <div className="space-y-1">
          <FlagToggle
            label="Demo Login Button"
            description="Show 'Try Demo Mode' button on login page"
            checked={flags.demoLoginEnabled}
            onChange={(v) => updateFlag("demoLoginEnabled", v)}
          />
          <FlagToggle
            label="Email Registration"
            description="Allow new users to register with email"
            checked={flags.registrationEnabled}
            onChange={(v) => updateFlag("registrationEnabled", v)}
          />
        </div>
      </div>

      {/* Feature Controls */}
      <div className="glass-card p-5">
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Feature Controls
        </h3>
        <div className="space-y-1">
          <FlagToggle
            label="GPS Walk Tracking"
            description="Enable live GPS tracking for walks"
            checked={flags.gpsTracking}
            onChange={(v) => updateFlag("gpsTracking", v)}
          />
          <FlagToggle
            label="Community Photo Uploads"
            description="Allow photo uploads in community posts"
            checked={flags.communityPhotos}
            onChange={(v) => updateFlag("communityPhotos", v)}
          />
          <FlagToggle
            label="Push Notifications"
            description="Enable FCM push notifications"
            checked={flags.pushNotifications}
            onChange={(v) => updateFlag("pushNotifications", v)}
          />
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="glass-card p-5">
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <AlertTriangle size={14} />
          Maintenance Mode
        </h3>
        <div className="space-y-3">
          <FlagToggle
            label="Enable Maintenance Mode"
            description="Show maintenance banner to all users"
            checked={flags.maintenanceMode}
            onChange={(v) => updateFlag("maintenanceMode", v)}
          />
          {flags.maintenanceMode && (
            <div className="px-3">
              <label
                className="text-xs font-medium block mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Maintenance Message
              </label>
              <input
                type="text"
                maxLength={140}
                value={flags.maintenanceMessage}
                onChange={(e) =>
                  updateFlag("maintenanceMessage", e.target.value)
                }
                placeholder="We're performing scheduled maintenance..."
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-all"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-4 z-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-lg"
            style={{
              background: "var(--gradient-primary)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* Last Updated */}
      {currentFlags.updatedAt && (
        <p
          className="text-xs text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Last updated: {new Date(currentFlags.updatedAt).toLocaleString()} by{" "}
          {currentFlags.updatedBy || "unknown"}
        </p>
      )}
    </div>
  );
}
