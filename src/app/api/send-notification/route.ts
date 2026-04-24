// ============================================
// POST /api/send-notification
// Called from the admin panel when an alert
// is broadcast. Sends FCM push to every user
// who has enabled push notifications.
//
// Body: { title: string, message: string, type: 'info' | 'warning' | 'success' }
// Auth: requires X-Admin-UID header verified against Firestore role
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getAdminMessaging, getAdminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check — verify caller is an admin ───────────────────────────
    const adminUid = req.headers.get("x-admin-uid");
    if (!adminUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const callerDoc = await db.collection("users").doc(adminUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 2. Parse body ───────────────────────────────────────────────────────
    const { title, message, type } = (await req.json()) as {
      title: string;
      message: string;
      type: "info" | "warning" | "success";
    };

    if (!title || !message) {
      return NextResponse.json(
        { error: "title and message are required" },
        { status: 400 },
      );
    }

    // ── 3. Collect all FCM tokens from users collection ─────────────────────
    const usersSnap = await db.collection("users").get();
    const tokens: string[] = [];
    usersSnap.forEach((doc) => {
      const fcmTokens: string[] = doc.data().fcmTokens || [];
      tokens.push(...fcmTokens);
    });

    if (tokens.length === 0) {
      return NextResponse.json({
        sent: 0,
        message: "No registered FCM tokens",
      });
    }

    // ── 4. Send FCM multicast (max 500 tokens per call) ─────────────────────
    const iconMap = {
      info: "/icons/icon-192.png",
      warning: "/icons/icon-192.png",
      success: "/icons/icon-192.png",
    };

    const CHUNK_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;
    const staleTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
      const chunk = tokens.slice(i, i + CHUNK_SIZE);
      const response = await getAdminMessaging().sendEachForMulticast({
        tokens: chunk,
        notification: {
          title,
          body: message,
          imageUrl: iconMap[type],
        },
        webpush: {
          notification: {
            title,
            body: message,
            icon: iconMap[type],
            badge: "/icons/icon-192.png",
            tag: `pawshield-alert-${Date.now()}`,
          },
          fcmOptions: {
            link: "/reminders",
          },
        },
      });

      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      // Collect invalid/stale tokens for cleanup
      response.responses.forEach((r, idx) => {
        if (
          !r.success &&
          (r.error?.code === "messaging/registration-token-not-registered" ||
            r.error?.code === "messaging/invalid-registration-token")
        ) {
          staleTokens.push(chunk[idx]);
        }
      });
    }

    // ── 5. Clean up stale tokens ─────────────────────────────────────────────
    if (staleTokens.length > 0) {
      const batch = db.batch();
      usersSnap.forEach((doc) => {
        const fcmTokens: string[] = doc.data().fcmTokens || [];
        const cleaned = fcmTokens.filter((t) => !staleTokens.includes(t));
        if (cleaned.length !== fcmTokens.length) {
          batch.update(doc.ref, { fcmTokens: cleaned });
        }
      });
      await batch.commit();
    }

    return NextResponse.json({
      sent: totalSuccess,
      failed: totalFailure,
      staleRemoved: staleTokens.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[send-notification]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
