"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dog,
  Activity,
  MessageCircle,
  Settings,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Mobile bottom nav — Reminders lives in the top bell icon on mobile
const BASE_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/messages", label: "Chat", icon: MessageCircle },
  { href: "/dogs", label: "Dogs", icon: Dog },
  { href: "/settings", label: "More", icon: Settings },
];
const ADMIN_TAB = { href: "/admin", label: "Admin", icon: Shield };

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  // Admin gets admin tab inserted before Settings
  const navItems = isAdmin
    ? [...BASE_ITEMS.slice(0, -1), ADMIN_TAB, BASE_ITEMS[BASE_ITEMS.length - 1]]
    : BASE_ITEMS;

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
