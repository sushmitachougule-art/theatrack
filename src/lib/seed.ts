// ============================================
// PawShield — Seed Scripts
// ============================================

import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { seedVaccinationTypes } from "@/lib/repositories";
import { DEFAULT_VACCINATION_TYPES } from "@/lib/data/vaccinationTypes";

export async function seedDatabase() {
  try {
    await seedVaccinationTypes(DEFAULT_VACCINATION_TYPES);
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

// ============================================
// Demo Account — seed 2 dogs + sample records
// ============================================
export async function seedDemoAccount(uid: string): Promise<void> {
  // No-op if demo data already exists for this uid
  const existing = await getDocs(
    query(collection(db, "dogs"), where("ownerId", "==", uid)),
  );
  if (existing.size > 0) return;

  const now = new Date();
  const isoDate = (d: Date) => d.toISOString().split("T")[0];
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return isoDate(d);
  };
  const daysFromNow = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return isoDate(d);
  };
  const nowIso = now.toISOString();

  // --- Dog 1: Buddy ---
  const buddyRef = await addDoc(collection(db, "dogs"), {
    ownerId: uid,
    name: "Buddy",
    breed: "Golden Retriever",
    dateOfBirth: "2022-03-15",
    gender: "male",
    weight: 28,
    color: "Golden",
    microchipNumber: "DEMO123456789",
    insuranceProvider: "PetFirst Insurance",
    insurancePolicyNumber: "PF-2024-0099",
    insuranceExpiry: "2027-03-15",
    emergencyVetName: "Dr. Sarah Wilson",
    emergencyVetPhone: "+1 555 010 0100",
    photoUrl: null,
    isActive: true,
    sharedWith: [],
    notes: "Loves fetch and swimming. Friendly with other dogs.",
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  // --- Dog 2: Luna ---
  const lunaRef = await addDoc(collection(db, "dogs"), {
    ownerId: uid,
    name: "Luna",
    breed: "Labrador Retriever",
    dateOfBirth: "2023-07-22",
    gender: "female",
    weight: 22,
    color: "Black",
    microchipNumber: "DEMO987654321",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceExpiry: "",
    emergencyVetName: "Dr. Sarah Wilson",
    emergencyVetPhone: "+1 555 010 0100",
    photoUrl: null,
    isActive: true,
    sharedWith: [],
    notes: "Puppy. Loves cuddles and car rides.",
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  const buddyId = buddyRef.id;
  const lunaId = lunaRef.id;

  const makeRecord = (
    dogId: string,
    vaccinationTypeName: string,
    dateAdministered: string,
    nextDueDate: string,
    extra: Record<string, unknown> = {},
  ) => ({
    dogId,
    ownerId: uid,
    vaccinationTypeId: "system",
    vaccinationTypeName,
    dateAdministered,
    nextDueDate,
    customIntervalDays: null,
    status: "completed",
    vetName: "Dr. Sarah Wilson",
    clinicName: "Happy Paws Clinic",
    batchNumber: "",
    manufacturer: "",
    certificateUrl: null,
    sideEffectsNoted: false,
    sideEffectsNotes: "",
    cost: null,
    reminderSent: false,
    createdBy: uid,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...extra,
  });

  const records = [
    // Buddy — Rabies: OVERDUE (due 30 days ago)
    makeRecord(buddyId, "Rabies", daysAgo(395), daysAgo(30), {
      batchNumber: "RAB2025-001",
      manufacturer: "Merck Animal Health",
      cost: 45,
    }),
    // Buddy — DHPP: DUE SOON (due in 20 days)
    makeRecord(
      buddyId,
      "DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)",
      daysAgo(345),
      daysFromNow(20),
      { batchNumber: "DHPP2025-A12", manufacturer: "Zoetis", cost: 55 },
    ),
    // Buddy — Bordetella: UP TO DATE (due in 60 days)
    makeRecord(
      buddyId,
      "Bordetella (Kennel Cough)",
      daysAgo(120),
      daysFromNow(60),
      { cost: 30 },
    ),
    // Buddy — Deworming: DUE SOON (due in 8 days)
    makeRecord(buddyId, "Deworming", daysAgo(82), daysFromNow(8), { cost: 20 }),
    // Buddy — Anti-Tick: UP TO DATE (due in 15 days)
    makeRecord(
      buddyId,
      "Anti-Tick & Flea Treatment",
      daysAgo(15),
      daysFromNow(15),
      { cost: 35 },
    ),

    // Luna — Rabies: UP TO DATE (due in 305 days)
    makeRecord(lunaId, "Rabies", daysAgo(60), daysFromNow(305), {
      batchNumber: "RAB2026-008",
      manufacturer: "Merck Animal Health",
      cost: 45,
    }),
    // Luna — DHPP: UP TO DATE (due in 305 days)
    makeRecord(
      lunaId,
      "DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)",
      daysAgo(60),
      daysFromNow(305),
      { batchNumber: "DHPP2026-B05", manufacturer: "Zoetis", cost: 55 },
    ),
    // Luna — Leptospirosis: OVERDUE (due 35 days ago)
    makeRecord(lunaId, "Leptospirosis", daysAgo(400), daysAgo(35), {
      cost: 40,
    }),
    // Luna — Deworming: UP TO DATE (due in 45 days)
    makeRecord(lunaId, "Deworming", daysAgo(45), daysFromNow(45), { cost: 20 }),
  ];

  for (const record of records) {
    await addDoc(collection(db, "vaccinationRecords"), record);
  }
}
