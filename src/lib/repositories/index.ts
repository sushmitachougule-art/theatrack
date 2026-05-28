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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
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
  ShareToken,
  DailyJournal,
  WalkLog,
  CommunityPost,
  CommunityComment,
  Report,
  TrainingProgress,
  ChallengeEntry,
  Expense,
  WalkRoute,
  GeoPoint,
  PlaydateRequest,
  PlaydateStatus,
  ChatThread,
  ChatMessage,
} from "@/types";
import { v4 as uuidv4 } from "uuid";
import { calculateNextDueDate, toISOString } from "@/lib/utils/dateUtils";
import { compressImage } from "@/lib/utils/imageUtils";

// =====================
// Storage Helpers
// =====================

/**
 * Extract the storage object path from a Firebase Storage download URL.
 * Handles both the legacy googleapis.com format and the newer
 * *.firebasestorage.app format.
 */
function storagePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const oIdx = u.pathname.indexOf("/o/");
    if (oIdx === -1) return null;
    // Strip query params (alt=media&token=…) and decode percent-encoding
    return decodeURIComponent(u.pathname.slice(oIdx + 3).split("?")[0]);
  } catch {
    return null;
  }
}

/**
 * Delete a file from Firebase Storage by its download URL.
 * Silently no-ops if the URL is null/undefined or the file no longer exists.
 */
async function safeDeleteStorageFile(
  url: string | null | undefined,
): Promise<void> {
  if (!url) return;
  const path = storagePathFromUrl(url);
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (err: unknown) {
    // File may already be gone — don't propagate the error
    console.warn("[storage] Could not delete file:", path, err);
  }
}

// =====================
// Dog Repository
// =====================

export async function createDog(
  ownerId: string,
  data: DogFormData,
): Promise<string> {
  let photoUrl: string | null = null;

  if (data.photo) {
    const compressed = await compressImage(data.photo, {
      maxWidthPx: 600,
      maxHeightPx: 600,
      quality: 0.72,
    });
    const photoRef = ref(storage, `dogs/${ownerId}/${uuidv4()}`);
    await uploadBytes(photoRef, compressed);
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
  // These are not Firestore fields
  delete updateData.photo;
  delete updateData.removePhoto;

  if (data.photo) {
    // Fetch current dog to retrieve old photo URL before overwriting
    const currentSnap = await getDoc(doc(db, "dogs", dogId));
    const oldPhotoUrl = currentSnap.exists()
      ? (currentSnap.data().photoUrl as string | null)
      : null;

    const compressed = await compressImage(data.photo, {
      maxWidthPx: 600,
      maxHeightPx: 600,
      quality: 0.72,
    });
    const photoRef = ref(storage, `dogs/${ownerId}/${uuidv4()}`);
    await uploadBytes(photoRef, compressed);
    updateData.photoUrl = await getDownloadURL(photoRef);

    // Delete old photo only after new one is safely uploaded
    await safeDeleteStorageFile(oldPhotoUrl);
  } else if (data.removePhoto) {
    // User explicitly removed the photo — delete from Storage and clear the field
    const currentSnap = await getDoc(doc(db, "dogs", dogId));
    const oldPhotoUrl = currentSnap.exists()
      ? (currentSnap.data().photoUrl as string | null)
      : null;
    await safeDeleteStorageFile(oldPhotoUrl);
    updateData.photoUrl = null;
  }

  await updateDoc(doc(db, "dogs", dogId), updateData);
}

export async function deleteDog(dogId: string): Promise<void> {
  // Clean up Storage before removing the Firestore document so we don't
  // leave orphaned files if the doc delete fails or the app crashes.
  const snap = await getDoc(doc(db, "dogs", dogId));
  if (snap.exists()) {
    await safeDeleteStorageFile(snap.data().photoUrl as string | null);
  }
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
  return onSnapshot(
    q,
    (snap) => {
      const dogs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Dog)
        .filter((d) => d.isActive !== false)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(dogs);
    },
    (err) => {
      if (err.code !== "permission-denied")
        console.error("[subscribeToDogs]", err);
    },
  );
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
  return onSnapshot(
    q,
    (snap) => {
      const types = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as VaccinationType)
        .filter((t) => t.isActive !== false)
        .sort(
          (a, b) =>
            a.category.localeCompare(b.category) ||
            a.name.localeCompare(b.name),
        );
      callback(types);
    },
    (err) => {
      if (err.code !== "permission-denied")
        console.error("[subscribeToVaccinationTypes]", err);
    },
  );
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
    // Compress image certificates; PDFs pass through untouched
    const compressed = await compressImage(data.certificate, {
      maxWidthPx: 1200,
      maxHeightPx: 1600,
      quality: 0.78,
      maxSizeBytes: 500 * 1024,
    });
    const certRef = ref(
      storage,
      `certificates/${ownerId}/${dogId}/${uuidv4()}`,
    );
    await uploadBytes(certRef, compressed);
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
  // Delete the certificate file from Storage before removing the Firestore doc
  const snap = await getDoc(doc(db, "vaccinationRecords", recordId));
  if (snap.exists()) {
    await safeDeleteStorageFile(snap.data().certificateUrl as string | null);
  }
  await deleteDoc(doc(db, "vaccinationRecords", recordId));
}

export function subscribeToVaccinationRecords(
  dogId: string,
  ownerId: string,
  callback: (records: VaccinationRecord[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "vaccinationRecords"),
    where("dogId", "==", dogId),
    where("ownerId", "==", ownerId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as VaccinationRecord)
        .sort((a, b) => b.dateAdministered.localeCompare(a.dateAdministered));
      callback(records);
    },
    (err) => {
      if (err.code !== "permission-denied")
        console.error("[subscribeToVaccinationRecords]", err);
      // Always resolve loading state so the spinner doesn't get stuck
      callback([]);
    },
  );
}

export function subscribeToAllUserVaccinationRecords(
  ownerId: string,
  callback: (records: VaccinationRecord[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "vaccinationRecords"),
    where("ownerId", "==", ownerId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as VaccinationRecord)
        .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
      callback(records);
    },
    (err) => {
      if (err.code !== "permission-denied")
        console.error("[subscribeToAllUserVaccinationRecords]", err);
    },
  );
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

export async function updateFeedbackStatus(
  feedbackId: string,
  status: "new" | "in-progress" | "reviewed" | "resolved",
) {
  await updateDoc(doc(db, "feedback", feedbackId), { status });
}

export async function deleteFeedback(feedbackId: string) {
  await deleteDoc(doc(db, "feedback", feedbackId));
}

export function subscribeToUserFeedback(
  userId: string,
  callback: (feedback: Feedback[]) => void,
) {
  const q = query(
    collection(db, "feedback"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Feedback));
  });
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
  const q = query(
    collection(db, "notifications"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const notifications = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as SystemNotification,
      );
      callback(notifications);
    },
    (err) => {
      if (err.code !== "permission-denied")
        console.error("[subscribeToActiveNotifications]", err);
    },
  );
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

// =====================
// Share Token Repository
// =====================

const SHARE_EXPIRY_DAYS = 30;

/**
 * Create a new share token for a dog. Returns the token string (= doc id).
 * Tokens expire after 30 days.
 */
export async function createShareToken(
  dogId: string,
  ownerId: string,
): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SHARE_EXPIRY_DAYS);

  await setDoc(doc(db, "shareTokens", token), {
    id: token,
    dogId,
    ownerId,
    expiresAt: expiresAt.toISOString(),
    createdAt: toISOString(),
  } satisfies ShareToken);

  return token;
}

/**
 * Get share token metadata. Returns null if not found or expired.
 */
export async function getShareToken(token: string): Promise<ShareToken | null> {
  const snap = await getDoc(doc(db, "shareTokens", token));
  if (!snap.exists()) return null;
  const data = snap.data() as ShareToken;
  if (new Date(data.expiresAt) < new Date()) return null; // expired
  return data;
}

/**
 * Delete a share token (revoke the link).
 */
export async function revokeShareToken(token: string): Promise<void> {
  await deleteDoc(doc(db, "shareTokens", token));
}

/**
 * Get all active (non-expired) share tokens for a dog.
 */
export async function getDogShareTokens(dogId: string): Promise<ShareToken[]> {
  const snap = await getDocs(
    query(collection(db, "shareTokens"), where("dogId", "==", dogId)),
  );
  const now = new Date();
  return snap.docs
    .map((d) => d.data() as ShareToken)
    .filter((t) => new Date(t.expiresAt) > now);
}

// =====================
// Daily Journal Repository
// =====================

export async function saveDailyJournal(
  data: Omit<DailyJournal, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  // Use composite key: ownerId_dogId_date to enforce one entry per dog per day
  const compositeId = `${data.ownerId}_${data.dogId}_${data.date}`;
  const docRef = doc(db, "dailyJournals", compositeId);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    await updateDoc(docRef, {
      mood: data.mood,
      energy: data.energy,
      appetite: data.appetite,
      poop: data.poop,
      notes: data.notes,
      updatedAt: toISOString(),
    });
    return compositeId;
  }

  await setDoc(docRef, {
    ...data,
    id: compositeId,
    createdAt: toISOString(),
    updatedAt: toISOString(),
  } satisfies DailyJournal);

  return compositeId;
}

export async function getDailyJournal(
  ownerId: string,
  dogId: string,
  date: string,
): Promise<DailyJournal | null> {
  const compositeId = `${ownerId}_${dogId}_${date}`;
  const snap = await getDoc(doc(db, "dailyJournals", compositeId));
  if (!snap.exists()) return null;
  return snap.data() as DailyJournal;
}

export async function getJournalsByMonth(
  ownerId: string,
  dogId: string,
  year: number,
  month: number,
): Promise<DailyJournal[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const q = query(
    collection(db, "dailyJournals"),
    where("ownerId", "==", ownerId),
    where("dogId", "==", dogId),
    where("date", ">=", startDate),
    where("date", "<", endDate),
    orderBy("date", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as DailyJournal);
}

export function subscribeToRecentJournals(
  ownerId: string,
  dogId: string,
  callback: (journals: DailyJournal[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, "dailyJournals"),
    where("ownerId", "==", ownerId),
    where("dogId", "==", dogId),
    orderBy("date", "desc"),
    limit(7),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as DailyJournal));
    },
    (error) => {
      console.error("Journal subscription error:", error);
      onError?.(error);
    },
  );
}

// =====================
// Walk Log Repository
// =====================

export async function createWalkLog(
  data: Omit<WalkLog, "id" | "createdAt">,
): Promise<string> {
  const walkData = {
    ...data,
    id: "",
    createdAt: toISOString(),
  };
  const docRef = await addDoc(collection(db, "walkLogs"), walkData);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function deleteWalkLog(walkId: string): Promise<void> {
  await deleteDoc(doc(db, "walkLogs", walkId));
}

export function subscribeToWalkLogs(
  ownerId: string,
  callback: (walks: WalkLog[]) => void,
  maxResults = 20,
): Unsubscribe {
  const q = query(
    collection(db, "walkLogs"),
    where("ownerId", "==", ownerId),
    orderBy("startTime", "desc"),
    limit(maxResults),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WalkLog));
    },
    (error) => {
      console.error("Walk logs subscription error:", error);
      callback([]);
    },
  );
}

export async function getWalkLogsByDateRange(
  ownerId: string,
  startDate: string,
  endDate: string,
): Promise<WalkLog[]> {
  const q = query(
    collection(db, "walkLogs"),
    where("ownerId", "==", ownerId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WalkLog);
}

// =====================
// Community Repository
// =====================

export async function createCommunityPost(
  data: Omit<
    CommunityPost,
    | "id"
    | "likeCount"
    | "commentCount"
    | "likedBy"
    | "isActive"
    | "createdAt"
    | "updatedAt"
  >,
  photoFile: File,
): Promise<string> {
  const compressed = await compressImage(photoFile, {
    maxWidthPx: 800,
    maxHeightPx: 800,
    quality: 0.8,
  });
  const ext = compressed.type === "image/webp" ? "webp" : "jpg";
  const photoRef = ref(
    storage,
    `community/${data.authorId}/${uuidv4()}.${ext}`,
  );
  await uploadBytes(photoRef, compressed);
  const photoUrl = await getDownloadURL(photoRef);

  const post: Omit<CommunityPost, "id"> = {
    ...data,
    photoUrl,
    likeCount: 0,
    commentCount: 0,
    likedBy: [],
    isActive: true,
    createdAt: toISOString(),
    updatedAt: toISOString(),
  };

  const docRef = await addDoc(collection(db, "communityPosts"), post);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function togglePostLike(
  postId: string,
  userId: string,
): Promise<boolean> {
  const postRef = doc(db, "communityPosts", postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return false;

  const post = snap.data() as CommunityPost;
  const alreadyLiked = post.likedBy.includes(userId);

  if (alreadyLiked) {
    await updateDoc(postRef, {
      likedBy: post.likedBy.filter((id) => id !== userId),
      likeCount: Math.max(0, post.likeCount - 1),
      updatedAt: toISOString(),
    });
    return false;
  } else {
    await updateDoc(postRef, {
      likedBy: [...post.likedBy, userId],
      likeCount: post.likeCount + 1,
      updatedAt: toISOString(),
    });
    return true;
  }
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  const postRef = doc(db, "communityPosts", postId);
  const snap = await getDoc(postRef);
  if (snap.exists()) {
    const post = snap.data() as CommunityPost;
    await safeDeleteStorageFile(post.photoUrl);
  }
  await deleteDoc(postRef);
}

export function subscribeToCommunityPosts(
  callback: (posts: CommunityPost[]) => void,
  maxResults = 10,
): Unsubscribe {
  const q = query(
    collection(db, "communityPosts"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
    limit(maxResults),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CommunityPost),
      );
    },
    (error) => {
      console.error("Community posts subscription error:", error);
      callback([]);
    },
  );
}

export async function addComment(
  data: Omit<CommunityComment, "id" | "createdAt">,
): Promise<string> {
  const commentData = {
    ...data,
    id: "",
    createdAt: toISOString(),
  };
  const commentRef = await addDoc(
    collection(db, "communityComments"),
    commentData,
  );
  await updateDoc(commentRef, { id: commentRef.id });

  // Increment comment count on post
  const postRef = doc(db, "communityPosts", data.postId);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const post = postSnap.data() as CommunityPost;
    await updateDoc(postRef, {
      commentCount: post.commentCount + 1,
      updatedAt: toISOString(),
    });
  }

  return commentRef.id;
}

export function subscribeToComments(
  postId: string,
  callback: (comments: CommunityComment[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "communityComments"),
    where("postId", "==", postId),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CommunityComment),
    );
  });
}

export async function reportPost(
  data: Omit<Report, "id" | "status" | "createdAt">,
): Promise<void> {
  await addDoc(collection(db, "reports"), {
    ...data,
    status: "new",
    createdAt: toISOString(),
  });
}

// =====================
// Training Repository
// =====================

export async function getTrainingProgress(
  ownerId: string,
  dogId: string,
): Promise<TrainingProgress[]> {
  const q = query(
    collection(db, "trainingProgress"),
    where("ownerId", "==", ownerId),
    where("dogId", "==", dogId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrainingProgress);
}

export function subscribeToTrainingProgress(
  ownerId: string,
  dogId: string,
  callback: (progress: TrainingProgress[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "trainingProgress"),
    where("ownerId", "==", ownerId),
    where("dogId", "==", dogId),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrainingProgress),
      );
    },
    (error) => {
      console.error("Training progress subscription error:", error);
      callback([]);
    },
  );
}

export async function startModule(
  ownerId: string,
  dogId: string,
  moduleId: string,
): Promise<string> {
  const docRef = await addDoc(collection(db, "trainingProgress"), {
    id: "",
    ownerId,
    dogId,
    moduleId,
    completedStepIds: [],
    startedAt: toISOString(),
    completedAt: null,
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function completeTrainingStep(
  progressId: string,
  stepId: string,
  totalSteps: number,
): Promise<void> {
  const progressRef = doc(db, "trainingProgress", progressId);
  const snap = await getDoc(progressRef);
  if (!snap.exists()) return;

  const progress = snap.data() as TrainingProgress;
  const updatedSteps = progress.completedStepIds.includes(stepId)
    ? progress.completedStepIds
    : [...progress.completedStepIds, stepId];

  const isComplete = updatedSteps.length >= totalSteps;
  await updateDoc(progressRef, {
    completedStepIds: updatedSteps,
    completedAt: isComplete ? toISOString() : null,
  });
}

export async function resetModuleProgress(progressId: string): Promise<void> {
  await deleteDoc(doc(db, "trainingProgress", progressId));
}

// Challenge entries
export async function getChallengeEntry(
  ownerId: string,
  dogId: string,
  challengeId: string,
): Promise<ChallengeEntry | null> {
  const q = query(
    collection(db, "challengeEntries"),
    where("ownerId", "==", ownerId),
    where("dogId", "==", dogId),
    where("challengeId", "==", challengeId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as ChallengeEntry;
}

export async function joinChallenge(
  ownerId: string,
  dogId: string,
  challengeId: string,
): Promise<string> {
  const docRef = await addDoc(collection(db, "challengeEntries"), {
    id: "",
    ownerId,
    dogId,
    challengeId,
    progress: 0,
    joinedAt: toISOString(),
    completedAt: null,
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function incrementChallengeProgress(
  entryId: string,
  targetCount: number,
): Promise<void> {
  const entryRef = doc(db, "challengeEntries", entryId);
  const snap = await getDoc(entryRef);
  if (!snap.exists()) return;

  const entry = snap.data() as ChallengeEntry;
  const newProgress = Math.min(entry.progress + 1, targetCount);
  const isComplete = newProgress >= targetCount;

  await updateDoc(entryRef, {
    progress: newProgress,
    completedAt: isComplete ? toISOString() : null,
  });
}

// =====================
// Expense Repository
// =====================

export async function createExpense(
  data: Omit<Expense, "id" | "createdAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, "expenses"), {
    ...data,
    id: "",
    createdAt: toISOString(),
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, "expenses", expenseId));
}

export async function updateExpense(
  expenseId: string,
  data: Partial<Pick<Expense, "category" | "amount" | "description" | "date">>,
): Promise<void> {
  await updateDoc(doc(db, "expenses", expenseId), data);
}

export function subscribeToExpenses(
  ownerId: string,
  callback: (expenses: Expense[]) => void,
  maxItems = 100,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, "expenses"),
    where("ownerId", "==", ownerId),
    orderBy("date", "desc"),
    limit(maxItems),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense));
    },
    (error) => {
      console.error("Expenses subscription error:", error);
      if (onError) {
        onError(error);
      } else {
        callback([]);
      }
    },
  );
}

export async function getExpensesByDateRange(
  ownerId: string,
  startDate: string,
  endDate: string,
): Promise<Expense[]> {
  const q = query(
    collection(db, "expenses"),
    where("ownerId", "==", ownerId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense);
}

// =====================
// Walk Route (GPS) Repository
// =====================

export async function saveWalkRoute(
  walkLogId: string,
  ownerId: string,
  points: GeoPoint[],
  distanceMeters: number,
): Promise<string> {
  const docRef = await addDoc(collection(db, "walkRoutes"), {
    id: "",
    walkLogId,
    ownerId,
    points,
    distanceMeters,
    createdAt: toISOString(),
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function getWalkRoute(
  walkLogId: string,
): Promise<WalkRoute | null> {
  const q = query(
    collection(db, "walkRoutes"),
    where("walkLogId", "==", walkLogId),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as WalkRoute;
}

// =====================
// Playdate Requests Repository
// =====================

export async function createPlaydateRequest(
  data: Omit<PlaydateRequest, "id" | "createdAt" | "respondedAt" | "status">,
): Promise<string> {
  const docRef = await addDoc(collection(db, "playdateRequests"), {
    ...data,
    status: "pending",
    respondedAt: null,
    createdAt: toISOString(),
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function respondToPlaydate(
  requestId: string,
  status: PlaydateStatus,
): Promise<void> {
  await updateDoc(doc(db, "playdateRequests", requestId), {
    status,
    respondedAt: toISOString(),
  });
}

export function subscribeToPlaydateRequests(
  userId: string,
  callback: (requests: PlaydateRequest[]) => void,
): Unsubscribe {
  // Get requests sent TO this user or FROM this user
  const qTo = query(
    collection(db, "playdateRequests"),
    where("toUserId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  const qFrom = query(
    collection(db, "playdateRequests"),
    where("fromUserId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  let toResults: PlaydateRequest[] = [];
  let fromResults: PlaydateRequest[] = [];

  const unsubTo = onSnapshot(
    qTo,
    (snap) => {
      toResults = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as PlaydateRequest,
      );
      callback(
        [...toResults, ...fromResults].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        ),
      );
    },
    (err) => {
      console.error("Playdate (to) subscription error:", err);
      callback([]);
    },
  );

  const unsubFrom = onSnapshot(
    qFrom,
    (snap) => {
      fromResults = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as PlaydateRequest,
      );
      callback(
        [...toResults, ...fromResults].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        ),
      );
    },
    (err) => {
      console.error("Playdate (from) subscription error:", err);
      callback([]);
    },
  );

  return () => {
    unsubTo();
    unsubFrom();
  };
}

// =====================
// Chat / DM Repository
// =====================

export async function getOrCreateChatThread(
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string | null,
  otherUserId: string,
  otherUserName: string,
  otherUserAvatar: string | null,
): Promise<string> {
  // Check if thread already exists between these two users
  const q = query(
    collection(db, "chatThreads"),
    where("participants", "array-contains", currentUserId),
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find((d) => {
    const data = d.data();
    return data.participants.includes(otherUserId);
  });

  if (existing) return existing.id;

  // Create new thread
  const docRef = await addDoc(collection(db, "chatThreads"), {
    participants: [currentUserId, otherUserId],
    participantNames: {
      [currentUserId]: currentUserName,
      [otherUserId]: otherUserName,
    },
    participantAvatars: {
      [currentUserId]: currentUserAvatar,
      [otherUserId]: otherUserAvatar,
    },
    lastMessage: "",
    lastMessageAt: toISOString(),
    lastSenderId: "",
    unreadCount: { [currentUserId]: 0, [otherUserId]: 0 },
    createdAt: toISOString(),
  });
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export function subscribeToChatThreads(
  userId: string,
  callback: (threads: ChatThread[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "chatThreads"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc"),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatThread));
    },
    (err) => {
      console.error("Chat threads subscription error:", err);
      callback([]);
    },
  );
}

export async function sendChatMessage(
  threadId: string,
  senderId: string,
  senderName: string,
  text: string,
  otherUserId: string,
): Promise<void> {
  await addDoc(collection(db, "chatMessages"), {
    threadId,
    senderId,
    senderName,
    text,
    createdAt: toISOString(),
  });

  // Update thread's last message + increment unread for the other user
  const threadRef = doc(db, "chatThreads", threadId);
  const threadSnap = await getDoc(threadRef);
  const threadData = threadSnap.data() as ChatThread;
  const currentUnread = threadData.unreadCount?.[otherUserId] || 0;

  await updateDoc(threadRef, {
    lastMessage: text.slice(0, 60),
    lastMessageAt: toISOString(),
    lastSenderId: senderId,
    [`unreadCount.${otherUserId}`]: currentUnread + 1,
  });
}

export function subscribeToChatMessages(
  threadId: string,
  callback: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "chatMessages"),
    where("threadId", "==", threadId),
    orderBy("createdAt", "asc"),
    limit(100),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage),
      );
    },
    (err) => {
      console.error("Chat messages subscription error:", err);
      callback([]);
    },
  );
}

export async function markThreadAsRead(
  threadId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, "chatThreads", threadId), {
    [`unreadCount.${userId}`]: 0,
  });
}
