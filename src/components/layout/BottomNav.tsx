"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dog, Settings, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Mobile bottom nav — Reminders lives in the top bell icon on mobile
const BASE_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dogs", label: "Dogs", icon: Dog },
];
const ADMIN_TAB = { href: "/admin", label: "Admin", icon: Shield };
const SETTINGS_TAB = { href: "/settings", label: "Settings", icon: Settings };

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  // Admin gets 4 tabs: Dashboard · Dogs · Admin · Settings
  // Regular users get 3 tabs: Dashboard · Dogs · Settings
  const navItems = isAdmin
    ? [...BASE_ITEMS, ADMIN_TAB, SETTINGS_TAB]
    : [...BASE_ITEMS, SETTINGS_TAB];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "var(--nav-blur-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid var(--border-color)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-1.5 px-5 rounded-2xl transition-all duration-200 relative"
              style={{
                color: isActive ? "var(--color-primary)" : "var(--text-muted)",
              }}
            >
              {/* Active pill background */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: "var(--color-primary-bg)" }}
                />
              )}
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="relative z-10 transition-transform duration-200"
                style={{ transform: isActive ? "scale(1.1)" : "scale(1)" }}
              />
              <span
                className="text-[10px] font-semibold relative z-10 tracking-wide"
                style={{
                  color: isActive
                    ? "var(--color-primary)"
                    : "var(--text-muted)",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
