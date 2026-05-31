"use client";

import React from "react";
import { BookHeart, Footprints, Users, PawPrint } from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export type ActivityTab = "journal" | "walks" | "community" | "playdates";

interface ActivityTabsProps {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
}

const ALL_TABS: {
  id: ActivityTab;
  label: string;
  icon: React.ElementType;
  flag:
    | "activityJournal"
    | "activityWalks"
    | "activityCommunity"
    | "activityPlaydates";
}[] = [
  { id: "journal", label: "Journal", icon: BookHeart, flag: "activityJournal" },
  { id: "walks", label: "Walks", icon: Footprints, flag: "activityWalks" },
  {
    id: "community",
    label: "Community",
    icon: Users,
    flag: "activityCommunity",
  },
  {
    id: "playdates",
    label: "Playdates",
    icon: PawPrint,
    flag: "activityPlaydates",
  },
];

export default function ActivityTabs({
  activeTab,
  onTabChange,
}: ActivityTabsProps) {
  const flags = useFeatureFlags();
  const visibleTabs = ALL_TABS.filter((tab) => flags[tab.flag]);

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-2xl w-full"
      style={{ background: "var(--bg-input)" }}
      role="tablist"
      aria-label="Activity sections"
    >
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: isActive ? "var(--bg-card)" : "transparent",
              color: isActive ? "var(--color-primary)" : "var(--text-muted)",
              boxShadow: isActive ? "var(--shadow-sm)" : "none",
            }}
          >
            <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
