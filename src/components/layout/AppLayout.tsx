"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PWAHeader from "@/components/layout/PWAHeader";
import FeedbackOverlay from "@/components/layout/FeedbackOverlay";
import GlobalNotification from "@/components/layout/GlobalNotification";
import PWAInstallBanner from "@/components/PWAInstallBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

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
      <PWAHeader />
      <main className="flex-1 md:ml-[250px] pt-14 md:pt-0 pb-20 md:pb-0">
        <GlobalNotification />
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
