"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAnalytics } from "@/hooks/useAnalytics";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PWAHeader from "@/components/layout/PWAHeader";
import FeedbackOverlay from "@/components/layout/FeedbackOverlay";
import GlobalNotification from "@/components/layout/GlobalNotification";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import { AlertTriangle } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const flags = useFeatureFlags();
  const router = useRouter();

  // Initialize analytics tracking (auto-tracks page views and sessions)
  useAnalytics();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading PawShield...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Desktop-only sidebar — hidden on mobile via wrapper */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Mobile-only top header — hidden on desktop inside the component */}
      <PWAHeader onFeedbackOpen={() => window.__openFeedback?.()} />
      <main className="flex-1 md:ml-[250px] pt-14 md:pt-0 pb-20 md:pb-0">
        <GlobalNotification />
        {flags.maintenanceMode && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
            style={{
              background: "rgba(217, 119, 6, 0.1)",
              color: "var(--color-warning)",
              borderBottom: "1px solid rgba(217, 119, 6, 0.2)",
            }}
          >
            <AlertTriangle size={16} />
            {flags.maintenanceMessage ||
              "We're performing scheduled maintenance. Some features may be temporarily unavailable."}
          </div>
        )}
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto md:pt-0">
          {children}
        </div>
      </main>
      <BottomNav />
      <PWAInstallBanner />
      <FeedbackOverlay />
    </div>
  );
}
