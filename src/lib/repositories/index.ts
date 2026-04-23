// ============================================
// PawShield — Firestore Repository Layer
// ============================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  limit,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import {
  Dog,
  DogFormData,
  VaccinationType,
  VaccinationRecord,
  VaccinationFormData,
  HealthRecord,
  HealthRecordFormData,
  AuditLog,
  UserProfile,
  Feedback,
  SystemNotification,
} from "@/types";
import { v4 as uuidv4 } from "uuid";
import { calculateNextDueDate, toISOString } from "@/lib/utils/dateUtils";

// =====================
// Dog Repository
// =====================

export async function createDog(
  ownerId: string,
  data: DogFormData,
): Promise<string> {
  let photoUrl: string | null = null;

  if (data.photo) {
    const photoRef = ref(storage, `dogs/${ownerId}/${uuidv4()}`);
    await uploadBytes(photoRef, data.photo);
    photoUrl = await getDownloadURL(photoRef);
  }

  const dog: Omit<Dog, "id"> = {
    ownerId,
    name: data.name,
    breed: data.breed,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    weight: data.weight,
    color: data.color,
    microchipNumber: data.microchipNumber,
    insuranceProvider: data.insuranceProvider,
    insurancePolicyNumber: data.insurancePolicyNumber,
    insuranceExpiry: data.insuranceExpiry,
    emergencyVetName: data.emergencyVetName,
    emergencyVetPhone: data.emergencyVetPhone,
    photoUrl,
    isActive: true,
    sharedWith: [],
    notes: data.notes,
    createdAt: toISOString(),
    updatedAt: toISOString(),
  };

  const docRef = await addDoc(collection(db, "dogs"), dog);
  return docRef.id;
}

export async function updateDog(
  dogId: string,
  ownerId: string,
  data: Partial<DogFormData>,
): Promise<void> {
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: toISOString(),
  };

  // Handle photo upload if new photo provided
  if (data.photo) {
    const photoRef = ref(storage, `dogs/${ownerId}/${uuidv4()}`);
    await uploadBytes(photoRef, data.photo);
    updateData.photoUrl = await getDownloadURL(photoRef);
    delete updateData.photo;
  } else {
    delete updateData.photo;
  }

  await updateDoc(doc(db, "dogs", dogId), updateData);
}

export async function deleteDog(dogId: string): Promise<void> {
  await deleteDoc(doc(db, "dogs", dogId));
}

export async function getDog(dogId: string): Promise<Dog | null> {
  const snap = await getDoc(doc(db, "dogs", dogId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Dog;
}

export function subscribeToDogs(
  ownerId: string,
  callback: (dogs: Dog[]) => void,
): Unsubscribe {
  const q = query(collection(db, "dogs"), where("ownerId", "==", ownerId));
  return onSnapshot(q, (snap) => {
    const dogs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Dog)
      .filter((d) => d.isActive !== false)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    callback(dogs);
  });
}

// =====================
// Vaccination Type Repository
// =====================

export async function createVaccinationType(
  data: Omit<VaccinationType, "id">,
): Promise<string> {
  const docRef = await addDoc(collection(db, "vaccinationTypes"), data);
  return docRef.id;
}

export async function updateVaccinationType(
  typeId: string,
  data: Partial<VaccinationType>,
): Promise<void> {
  await updateDoc(
    doc(db, "vaccinationTypes", typeId),
    data as Record<string, unknown>,
  );
}

export function subscribeToVaccinationTypes(
  callback: (types: VaccinationType[]) => void,
): Unsubscribe {
  const q = query(collection(db, "vaccinationTypes"));
  return onSnapshot(q, (snap) => {
    const types = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as VaccinationType)
      .filter((t) => t.isActive !== false)
      .sort(
        (a, b) =>
          a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
      );
    callback(types);
  });
}

export async function seedVaccinationTypes(
  defaults: Omit<VaccinationType, "id">[],
): Promise<void> {
  const existingSnap = await getDocs(
    query(collection(db, "vaccinationTypes"), where("isSystem", "==", true)),
  );
  if (existingSnap.size > 0) return; // Already seeded

  for (const vType of defaults) {
    await addDoc(collection(db, "vaccinationTypes"), vType);
  }
}

// =====================
// Vaccination Record Repository
// =====================

export async function createVaccinationRecord(
  dogId: string,
  ownerId: string,
  data: VaccinationFormData,
  vaccinationTypeName: string,
  defaultIntervalDays: number,
): Promise<string> {
  let certificateUrl: string | null = null;

  if (data.certificate) {
    const certRef = ref(
      storage,
      `certificates/${ownerId}/${dogId}/${uuidv4()}`,
    );
    await uploadBytes(certRef, data.certificate);
    certificateUrl = await getDownloadURL(certRef);
  }

  const intervalDays = data.customIntervalDays || defaultIntervalDays;

  const record: Omit<VaccinationRecord, "id"> = {
    dogId,
    ownerId,
    vaccinationTypeId: data.vaccinationTypeId,
    vaccinationTypeName,
    dateAdministered: data.dateAdministered,
    nextDueDate: calculateNextDueDate(data.dateAdministered, intervalDays),
    customIntervalDays: data.customIntervalDays,
    status: "completed",
    vetName: data.vetName,
    clinicName: data.clinicName,
    batchNumber: data.batchNumber,
    manufacturer: data.manufacturer,
    certificateUrl,
    sideEffectsNoted: data.sideEffectsNoted,
    sideEffectsNotes: data.sideEffectsNotes,
    cost: data.cost,
    reminderSent: false,
    createdBy: ownerId,
    createdAt: toISOString(),
    updatedAt: toISOString(),
  };

  const docRef = await addDoc(collection(db, "vaccinationRecords"), record);
  return docRef.id;
}

export async function updateVaccinationRecord(
  recordId: string,
  data: Partial<VaccinationRecord>,
): Promise<void> {
  await updateDoc(doc(db, "vaccinationRecords", recordId), {
    ...data,
    updatedAt: toISOString(),
  } as Record<string, unknown>);
}

export async function deleteVaccinationRecord(recordId: string): Promise<void> {
  await deleteDoc(doc(db, "vaccinationRecords", recordId));
}

export function subscribeToVaccinationRecords(
  dogId: string,
  callback: (records: VaccinationRecord[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "vaccinationRecords"),
    where("dogId", "==", dogId),
  );
  return onSnapshot(q, (snap) => {
    const records = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as VaccinationRecord)
      .sort((a, b) => b.dateAdministered.localeCompare(a.dateAdministered));
    callback(records);
  });
}

export function subscribeToAllUserVaccinationRecords(
  ownerId: string,
  callback: (records: VaccinationRecord[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "vaccinationRecords"),
    where("ownerId", "==", ownerId),
  );
  return onSnapshot(q, (snap) => {
    const records = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as VaccinationRecord)
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
    callback(records);
  });
}

// =====================
// Health Record Repository
// =====================

export async function createHealthRecord(
  dogId: string,
  ownerId: string,
  data: HealthRecordFormData,
): Promise<string> {
  let attachmentUrl: string | null = null;

  if (data.attachment) {
    const attRef = ref(storage, `health/${ownerId}/${dogId}/${uuidv4()}`);
    await uploadBytes(attRef, data.attachment);
    attachmentUrl = await getDownloadURL(attRef);
  }

  const record: Omit<HealthRecord, "id"> = {
    dogId,
    ownerId,
    type: data.type,
    title: data.title,
    date: data.date,
    notes: data.notes,
    attachmentUrl,
    cost: data.cost,
    createdAt: toISOString(),
    updatedAt: toISOString(),
  };

  const docRef = await addDoc(collection(db, "healthRecords"), record);
  return docRef.id;
}

export function subscribeToHealthRecords(
  dogId: string,
  callback: (records: HealthRecord[]) => void,
): Unsubscribe {
  const q = query(collection(db, "healthRecords"), where("dogId", "==", dogId));
  return onSnapshot(q, (snap) => {
    const records = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as HealthRecord)
      .sort((a, b) => b.date.localeCompare(a.date));
    callback(records);
  });
}

// =====================
// Admin Repository
// =====================

export function subscribeToAllUsers(
  callback: (users: UserProfile[]) => void,
): Unsubscribe {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map(
      (d) => ({ uid: d.id, ...d.data() }) as UserProfile,
    );
    callback(users);
  });
}

export async function createAuditLog(log: Omit<AuditLog, "id">): Promise<void> {
  await addDoc(collection(db, "adminLogs"), log);
}

export function subscribeToAuditLogs(
  callback: (logs: AuditLog[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "adminLogs"),
    orderBy("timestamp", "desc"),
    limit(100),
  );
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
    callback(logs);
  });
}

export async function getAllDogs(): Promise<Dog[]> {
  const snap = await getDocs(
    query(collection(db, "dogs"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Dog);
}

export async function getAllVaccinationRecords(): Promise<VaccinationRecord[]> {
  const snap = await getDocs(
    query(collection(db, "vaccinationRecords"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VaccinationRecord);
}

// ============================================
// Feedback & Notifications
// ============================================

export async function submitFeedback(
  userId: string,
  userEmail: string | undefined,
  type: "bug" | "feature" | "other",
  message: string,
) {
  const docRef = doc(collection(db, "feedback"));
  await setDoc(docRef, {
    id: docRef.id,
    userId,
    userEmail: userEmail || "Unknown",
    type,
    message,
    status: "new",
    createdAt: new Date().toISOString(),
  });
}

export function subscribeToAllFeedback(
  callback: (feedback: Feedback[]) => void,
) {
  const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Feedback));
  });
}

export async function resolveFeedback(feedbackId: string) {
  await updateDoc(doc(db, "feedback", feedbackId), { status: "resolved" });
}

export async function createNotification(
  title: string,
  message: string,
  type: "info" | "warning" | "success",
  createdBy: string,
) {
  const docRef = doc(collection(db, "notifications"));
  await setDoc(docRef, {
    id: docRef.id,
    title,
    message,
    type,
    isActive: true,
    createdBy,
    createdAt: new Date().toISOString(),
  });
}

export async function deactivateNotification(id: string) {
  await updateDoc(doc(db, "notifications", id), { isActive: false });
}

export function subscribeToActiveNotifications(
  callback: (notifications: SystemNotification[]) => void,
) {
  const q = query(collection(db, "notifications"));
  return onSnapshot(q, (snap) => {
    const notifications = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as SystemNotification)
      .filter((n) => n.isActive !== false)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    callback(notifications);
  });
}

export function subscribeToAllNotifications(
  callback: (notifications: SystemNotification[]) => void,
) {
  const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SystemNotification),
    );
  });
}
