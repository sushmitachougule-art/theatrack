// ============================================
// GET /api/admin/storage-stats
// Returns actual Firebase Storage usage for the
// admin overview panel. Sums file sizes per folder.
//
// Auth: Bearer <Firebase ID token> — caller must
//       have role === "admin" in Firestore.
//
// Response:
// {
//   totalBytes: number,
//   totalFiles: number,
//   breakdown: {
//     dogs:         { bytes: number; count: number },
//     certificates: { bytes: number; count: number },
//     health:       { bytes: number; count: number },
//     other:        { bytes: number; count: number },
//   }
// }
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getAdminApp, getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";

export async function GET(req: NextRequest) {
  // ── 1. Verify Firebase ID token ─────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.split("Bearer ")[1];
  let callerUid: string;
  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ── 2. Verify caller is an admin ─────────────────────────────────────────
  const db = getAdminDb();
  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 3. List all Storage objects and sum sizes ────────────────────────────
  try {
    const bucket = getAdminStorage().bucket();
    const [files] = await bucket.getFiles();

    let totalBytes = 0;
    const breakdown = {
      dogs: { bytes: 0, count: 0 },
      certificates: { bytes: 0, count: 0 },
      health: { bytes: 0, count: 0 },
      other: { bytes: 0, count: 0 },
    };

    for (const file of files) {
      const size = parseInt(file.metadata.size as string, 10) || 0;
      totalBytes += size;

      if (file.name.startsWith("dogs/")) {
        breakdown.dogs.bytes += size;
        breakdown.dogs.count++;
      } else if (file.name.startsWith("certificates/")) {
        breakdown.certificates.bytes += size;
        breakdown.certificates.count++;
      } else if (file.name.startsWith("health/")) {
        breakdown.health.bytes += size;
        breakdown.health.count++;
      } else {
        breakdown.other.bytes += size;
        breakdown.other.count++;
      }
    }

    return NextResponse.json({
      totalBytes,
      totalFiles: files.length,
      breakdown,
    });
  } catch (err: unknown) {
    console.error("[storage-stats]", err);
    return NextResponse.json(
      { error: "Failed to retrieve storage stats" },
      { status: 500 },
    );
  }
}
