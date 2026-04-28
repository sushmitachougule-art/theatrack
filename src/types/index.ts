// ============================================
// PawShield — TypeScript Type Definitions
// ============================================

// --- User ---
export type UserRole = "owner" | "admin" | "vet";
export type UserPlan = "free" | "pro";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  role: UserRole;
  plan: UserPlan;
  settings: UserSettings;
  fcmTokens?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  reminderDaysBefore: number[]; // e.g. [7, 3, 1]
  darkMode: boolean;
  timezone: string;
}

// --- Dog ---
export type DogGender = "male" | "female";

export interface Dog {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  dateOfBirth: string; // ISO date
  gender: DogGender;
  weight: number | null; // kg
  color: string;
  microchipNumber: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  emergencyVetName: string;
  emergencyVetPhone: string;
  photoUrl: string | null;
  isActive: boolean;
  sharedWith: string[]; // userIds
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// --- Vaccination Type ---
export type VaccinationCategory = "core" | "non-core" | "preventive" | "custom";

export interface VaccinationType {
  id: string;
  name: string;
  description: string;
  category: VaccinationCategory;
  defaultIntervalDays: number;
  firstDoseMinAgeDays: number;
  breedSpecific: string[] | null;
  isSystem: boolean;
  createdBy: string; // userId or 'system'
  isActive: boolean;
}

// --- Vaccination Record ---
export type VaccinationStatus =
  | "completed"
  | "scheduled"
  | "missed"
  | "skipped";

export interface VaccinationRecord {
  id: string;
  dogId: string;
  ownerId: string;
  vaccinationTypeId: string;
  vaccinationTypeName: string; // denormalized for display
  dateAdministered: string;
  nextDueDate: string;
  customIntervalDays: number | null;
  status: VaccinationStatus;
  vetName: string;
  clinicName: string;
  batchNumber: string;
  manufacturer: string;
  certificateUrl: string | null;
  sideEffectsNoted: boolean;
  sideEffectsNotes: string;
  cost: number | null;
  reminderSent: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// --- Health Record ---
export type HealthRecordType =
  | "vet_visit"
  | "weight"
  | "allergy"
  | "surgery"
  | "medication"
  | "other";

export interface HealthRecord {
  id: string;
  dogId: string;
  ownerId: string;
  type: HealthRecordType;
  title: string;
  date: string;
  notes: string;
  attachmentUrl: string | null;
  cost: number | null;
  createdAt: string;
  updatedAt: string;
}

// --- Reminder ---
export type ReminderType = "7day" | "3day" | "1day" | "overdue";

export interface Reminder {
  id: string;
  dogId: string;
  dogName: string;
  ownerId: string;
  vaccinationRecordId: string;
  vaccinationName: string;
  reminderDate: string;
  dueDate: string;
  type: ReminderType;
  isRead: boolean;
  isDismissed: boolean;
  notificationSent: boolean;
  createdAt: string;
}

// --- Admin Audit Log ---
export type AdminAction =
  | "user_suspended"
  | "user_role_changed"
  | "vaccination_type_created"
  | "vaccination_type_updated"
  | "vaccination_type_deleted"
  | "broadcast_sent"
  | "user_deleted";

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: AdminAction;
  targetType: "user" | "vaccination_type" | "notification";
  targetId: string;
  details: string;
  timestamp: string;
}

// --- UI Helpers ---
export type StatusColor = "green" | "yellow" | "red" | "gray";

export interface VaccinationStatusInfo {
  status: StatusColor;
  label: string;
  daysUntilDue: number;
}

// --- Form types ---
export interface DogFormData {
  name: string;
  breed: string;
  dateOfBirth: string;
  gender: DogGender;
  weight: number | null;
  color: string;
  microchipNumber: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  emergencyVetName: string;
  emergencyVetPhone: string;
  notes: string;
  photo: File | null;
  /** When true, the existing dog photo is deleted from Storage and photoUrl is set to null */
  removePhoto?: boolean;
}

export interface VaccinationFormData {
  vaccinationTypeId: string;
  dateAdministered: string;
  customIntervalDays: number | null;
  vetName: string;
  clinicName: string;
  batchNumber: string;
  manufacturer: string;
  sideEffectsNoted: boolean;
  sideEffectsNotes: string;
  cost: number | null;
  certificate: File | null;
}

export interface HealthRecordFormData {
  type: HealthRecordType;
  title: string;
  date: string;
  notes: string;
  cost: number | null;
  attachment: File | null;
}

export interface Feedback {
  id: string;
  userId: string;
  userEmail?: string;
  type: "bug" | "feature" | "other";
  message: string;
  status: "new" | "in-progress" | "reviewed" | "resolved";
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

// --- Share Token ---
export interface ShareToken {
  id: string; // token = document id
  dogId: string;
  ownerId: string;
  expiresAt: string; // ISO date — null means no expiry
  createdAt: string;
}
