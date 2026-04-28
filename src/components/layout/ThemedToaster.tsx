"use client";

import { Toaster } from "react-hot-toast";
import { useTheme } from "@/hooks/useTheme";

export function ThemedToaster() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? "#1e293b" : "#ffffff",
          color: isDark ? "#f1f5f9" : "#0f172a",
          border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
          borderRadius: "12px",
          fontSize: "14px",
          fontFamily: "var(--font-sans)",
          boxShadow: isDark
            ? "0 4px 12px rgba(0,0,0,0.4)"
            : "0 4px 12px rgba(0,0,0,0.1)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: isDark ? "#1e293b" : "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: isDark ? "#1e293b" : "#ffffff",
          },
        },
      }}
    />
  );
}
