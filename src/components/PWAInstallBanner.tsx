"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X, Share } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const DISMISSED_KEY = "pwa_install_dismissed_v1";

// Detect iOS Safari (no beforeinstallprompt — needs manual Add to Home Screen)
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      !!(window.navigator as unknown as { standalone: boolean }).standalone)
  );
}

export default function PWAInstallBanner() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return; // Already installed — never show
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const iosDevice = isIOS();
    setIos(iosDevice);

    if (iosDevice) {
      // Show iOS instructions after a short delay
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  // Show Android/Chrome banner when prompt is available
  useEffect(() => {
    if (
      isInstallable &&
      !localStorage.getItem(DISMISSED_KEY) &&
      !isInStandaloneMode()
    ) {
      const t = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, [isInstallable]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleInstall = async () => {
    await promptInstall();
    dismiss();
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-slide-up"
      role="dialog"
      aria-label="Install PawShield app"
    >
      <div
        className="rounded-2xl p-4 shadow-2xl"
        style={{
          background: "rgba(17,24,39,0.97)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(245,158,11,0.3)",
          boxShadow:
            "0 0 30px rgba(245,158,11,0.12), 0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 rounded-lg transition-colors hover:bg-white/10"
          aria-label="Dismiss"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <Image
            src="/icons/icon-192.png"
            alt="PawShield"
            width={44}
            height={44}
            className="rounded-xl flex-shrink-0"
          />
          <div>
            <p
              className="font-bold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Install PawShield
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {ios
                ? "Add to your home screen for the full app experience"
                : "Get instant access — works offline too!"}
            </p>
          </div>
        </div>

        {ios ? (
          <div
            className="rounded-xl p-3 text-xs space-y-1.5"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.15)",
            }}
          >
            <p style={{ color: "var(--text-secondary)" }}>
              <Share
                size={12}
                className="inline mr-1.5 mb-0.5"
                style={{ color: "var(--color-primary)" }}
              />
              Tap the{" "}
              <strong style={{ color: "var(--color-primary)" }}>Share</strong>{" "}
              button in Safari
            </p>
            <p style={{ color: "var(--text-secondary)" }}>
              <span
                className="inline-block w-4 h-4 text-center rounded mr-1.5 text-[10px] font-bold"
                style={{ background: "var(--color-primary)", color: "black" }}
              >
                +
              </span>
              Then tap{" "}
              <strong style={{ color: "var(--color-primary)" }}>
                Add to Home Screen
              </strong>
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ background: "var(--gradient-primary)", color: "black" }}
          >
            <Download size={15} /> Install App — It&apos;s Free
          </button>
        )}
      </div>
    </div>
  );
}
