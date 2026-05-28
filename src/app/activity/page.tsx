"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import ActivityTabs, { ActivityTab } from "@/components/activity/ActivityTabs";
import { JournalTab } from "@/components/activity/journal/JournalTab";
import { WalksTab } from "@/components/activity/walks/WalksTab";
import { CommunityTab } from "@/components/activity/community/CommunityTab";
import { PlaydatesTab } from "@/components/activity/playdates/PlaydatesTab";
import { Activity } from "lucide-react";

const STORAGE_KEY = "pawshield_activity_tab";

export default function ActivityPage() {
  return (
    <Suspense fallback={null}>
      <ActivityContent />
    </Suspense>
  );
}

function ActivityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActivityTab>(() => {
    const param = searchParams.get("tab");
    if (
      param === "journal" ||
      param === "walks" ||
      param === "community" ||
      param === "playdates"
    ) {
      return param;
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (
        stored === "journal" ||
        stored === "walks" ||
        stored === "community" ||
        stored === "playdates"
      ) {
        return stored;
      }
    }
    return "journal";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: ActivityTab) => {
    setActiveTab(tab);
    router.replace(`/activity?tab=${tab}`, { scroll: false });
  };

  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-primary-bg)" }}
          >
            <Activity size={20} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Activity
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Journal, walks, and community
            </p>
          </div>
        </div>

        {/* Tabs */}
        <ActivityTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab Content */}
        {activeTab === "journal" && <JournalTab />}
        {activeTab === "walks" && <WalksTab />}
        {activeTab === "community" && <CommunityTab />}
        {activeTab === "playdates" && <PlaydatesTab />}
      </div>
    </AppLayout>
  );
}
