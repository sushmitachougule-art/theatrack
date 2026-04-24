"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useVaccinationRecords } from "@/hooks/useVaccinations";
import { getVaccinationStatus } from "@/lib/utils/dateUtils";

export default function PWAHeader() {
  const pathname = usePathname();
  const { records } = useVaccinationRecords();

  // Count upcoming (≤7 days) or overdue vaccinations for the badge
  const alertCount = records.filter((r) => {
    if (r.status !== "completed") return false;
    const { daysUntilDue } = getVaccinationStatus(r.nextDueDate);
    return daysUntilDue <= 7;
  }).length;

  const isRemindersActive = pathname === "/reminders";

  return (
    <header
      className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-end justify-between px-4 pb-3"
      style={{
        background: "rgba(10,15,30,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border-color)",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
        minHeight: "56px",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <Image
          src="/icons/icon-192.png"
          alt="PawShield"
          width={30}
          height={30}
          className="rounded-xl"
        />
        <span className="font-bold text-sm text-gradient">PawShield</span>
      </div>

      {/* Bell / Reminders */}
      <Link
        href="/reminders"
        className="relative p-2.5 rounded-xl transition-all"
        style={{
          background: isRemindersActive
            ? "rgba(245,158,11,0.12)"
            : "transparent",
          color: isRemindersActive
            ? "var(--color-primary)"
            : "var(--text-muted)",
        }}
        aria-label="Reminders"
      >
        <Bell size={22} strokeWidth={isRemindersActive ? 2.5 : 1.8} />
        {alertCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold px-1 leading-none"
            style={{ background: "#ef4444", color: "white" }}
          >
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </Link>
    </header>
  );
}
