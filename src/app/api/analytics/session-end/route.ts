// ============================================
// POST /api/analytics/session-end
// Called via navigator.sendBeacon when a user
// closes the tab or navigates away. Updates
// the session document with final stats.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, duration, pageViews, interactions } = body;

    if (!sessionId || typeof duration !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = getAdminDb();
    const sessionRef = db.collection("analytics_sessions").doc(sessionId);
    const snap = await sessionRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await sessionRef.update({
      endedAt: new Date().toISOString(),
      duration: Math.min(duration, 7200), // Cap at 2 hours to filter abandoned tabs
      pageViews: pageViews || 0,
      interactions: interactions || 0,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
