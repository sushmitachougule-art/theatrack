import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = getAdminDb();

  // 1. Look up the token
  const tokenSnap = await db.collection("shareTokens").doc(token).get();
  if (!tokenSnap.exists) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const tokenData = tokenSnap.data()!;
  if (new Date(tokenData.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Link has expired" }, { status: 410 });
  }

  const { dogId } = tokenData;

  // 2. Fetch dog + vaccination records in parallel
  const [dogSnap, recsSnap] = await Promise.all([
    db.collection("dogs").doc(dogId).get(),
    db
      .collection("vaccinationRecords")
      .where("dogId", "==", dogId)
      .orderBy("dateAdministered", "desc")
      .get(),
  ]);

  if (!dogSnap.exists) {
    return NextResponse.json({ error: "Dog not found" }, { status: 404 });
  }

  const dog = { id: dogSnap.id, ...dogSnap.data() };
  const records = recsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Strip sensitive owner data from response
  const {
    ownerId: _o,
    sharedWith: _s,
    ...publicDog
  } = dog as Record<string, unknown>;
  void _o;
  void _s;

  return NextResponse.json({
    dog: publicDog,
    records,
    expiresAt: tokenData.expiresAt,
  });
}
