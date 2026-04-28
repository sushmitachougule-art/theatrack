"use client";

import React, { useState, useRef, useEffect, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { getDog, updateDog } from "@/lib/repositories";
import { Dog, DogFormData, DogGender } from "@/types";
import { DOG_BREEDS } from "@/lib/data/vaccinationTypes";
import { ArrowLeft, Camera, X } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

function EditDogContent({ params }: { params: Promise<{ dogId: string }> }) {
  const { dogId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<DogFormData>({
    name: "",
    breed: "",
    dateOfBirth: "",
    gender: "male" as DogGender,
    weight: null,
    color: "",
    microchipNumber: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceExpiry: "",
    emergencyVetName: "",
    emergencyVetPhone: "",
    notes: "",
    photo: null,
  });

  useEffect(() => {
    getDog(dogId).then((d) => {
      if (!d) {
        toast.error("Dog not found");
        router.push("/dogs");
        return;
      }
      setDog(d);
      setForm({
        name: d.name,
        breed: d.breed,
        dateOfBirth: d.dateOfBirth,
        gender: d.gender,
        weight: d.weight,
        color: d.color,
        microchipNumber: d.microchipNumber,
        insuranceProvider: d.insuranceProvider,
        insurancePolicyNumber: d.insurancePolicyNumber,
        insuranceExpiry: d.insuranceExpiry,
        emergencyVetName: d.emergencyVetName,
        emergencyVetPhone: d.emergencyVetPhone,
        notes: d.notes,
        photo: null,
      });
      // Show optional section if any optional field is filled
      if (
        d.microchipNumber ||
        d.insuranceProvider ||
        d.insurancePolicyNumber ||
        d.insuranceExpiry ||
        d.emergencyVetName ||
        d.emergencyVetPhone ||
        d.notes
      ) {
        setShowOptional(true);
      }
      setLoading(false);
    });
  }, [dogId, router]);

  const update = (field: keyof DogFormData, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    // Selecting a new photo cancels any explicit remove request
    update("photo", file);
    update("removePhoto", false);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    update("photo", null);
    update("removePhoto", true);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const today = new Date().toISOString().split("T")[0];
  const minDOB = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 50);
    return d.toISOString().split("T")[0];
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dog) return;
    if (form.dateOfBirth > today) {
      toast.error("Date of birth cannot be in the future");
      return;
    }
    if (form.dateOfBirth && form.dateOfBirth < minDOB) {
      toast.error("Date of birth cannot be more than 50 years ago");
      return;
    }
    if (
      form.weight !== null &&
      (isNaN(form.weight) || form.weight < 0.1 || form.weight > 120)
    ) {
      toast.error("Weight must be between 0.1 and 120 kg");
      return;
    }
    try {
      setSubmitting(true);
      await updateDog(dogId, user.uid, form);
      toast.success(`${form.name} updated!`);
      router.push(`/dogs/${dogId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update dog");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );

  // Current photo: new preview takes priority, then existing photoUrl
  const displayPhoto = photoPreview ?? dog?.photoUrl ?? null;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link
        href={`/dogs/${dogId}`}
        className="flex items-center gap-2 text-sm mb-6 hover:underline"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={16} /> Back to {dog?.name}
      </Link>

      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: "var(--text-primary)" }}
      >
        Edit {dog?.name}
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Update your dog&apos;s information below.
      </p>

      <form
        onSubmit={handleSubmit}
        className="glass-card p-6 space-y-5"
        style={{ cursor: "default" }}
      >
        {/* Photo upload */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed transition-all relative"
              style={{
                background: "var(--bg-input)",
                borderColor: displayPhoto
                  ? "transparent"
                  : "var(--border-color)",
              }}
              onClick={() => photoInputRef.current?.click()}
            >
              {displayPhoto ? (
                <Image
                  src={displayPhoto}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Camera size={24} style={{ color: "var(--text-muted)" }} />
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Add Photo
                  </span>
                </div>
              )}
            </div>
            {displayPhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: "#ef4444", color: "white" }}
              >
                <X size={12} />
              </button>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Tap to change photo (max 5MB)
          </p>
        </div>

        {/* Required fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Dog Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Max"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Breed *</label>
            <select
              className="form-select"
              value={form.breed}
              onChange={(e) => update("breed", e.target.value)}
              required
            >
              <option value="">Select breed</option>
              {DOG_BREEDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Date of Birth *</label>
            <input
              type="date"
              className="form-input"
              value={form.dateOfBirth}
              min={minDOB}
              max={today}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Gender *</label>
            <div className="flex gap-3 mt-1">
              {(["male", "female"] as DogGender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => update("gender", g)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background:
                      form.gender === g
                        ? "var(--color-primary-bg-strong)"
                        : "var(--bg-input)",
                    border: `1px solid ${form.gender === g ? "var(--color-primary)" : "var(--border-color)"}`,
                    color:
                      form.gender === g
                        ? "var(--color-primary)"
                        : "var(--text-secondary)",
                  }}
                >
                  {g === "male" ? "♂ Male" : "♀ Female"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="120"
              className="form-input"
              placeholder="e.g. 25"
              value={form.weight ?? ""}
              onChange={(e) =>
                update(
                  "weight",
                  e.target.value ? parseFloat(e.target.value) : null,
                )
              }
            />
          </div>
          <div>
            <label className="form-label">Color</label>
            <input
              className="form-input"
              placeholder="e.g. Golden"
              value={form.color}
              onChange={(e) => update("color", e.target.value)}
            />
          </div>
        </div>

        {/* Toggle optional */}
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          {showOptional ? "▾ Hide" : "▸ Show"} additional details (microchip,
          insurance, emergency vet)
        </button>

        {showOptional && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
            style={{ borderTop: "1px solid var(--border-color)" }}
          >
            <div>
              <label className="form-label">Microchip Number</label>
              <input
                className="form-input"
                placeholder="e.g. 985112345678901"
                value={form.microchipNumber}
                onChange={(e) => update("microchipNumber", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Insurance Provider</label>
              <input
                className="form-input"
                placeholder="e.g. Trupanion"
                value={form.insuranceProvider}
                onChange={(e) => update("insuranceProvider", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Policy Number</label>
              <input
                className="form-input"
                placeholder="Policy #"
                value={form.insurancePolicyNumber}
                onChange={(e) =>
                  update("insurancePolicyNumber", e.target.value)
                }
              />
            </div>
            <div>
              <label className="form-label">Insurance Expiry</label>
              <input
                type="date"
                className="form-input"
                value={form.insuranceExpiry}
                min={today}
                onChange={(e) => update("insuranceExpiry", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Emergency Vet Name</label>
              <input
                className="form-input"
                placeholder="Dr. name"
                value={form.emergencyVetName}
                onChange={(e) => update("emergencyVetName", e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Emergency Vet Phone</label>
              <input
                className="form-input"
                placeholder="+91 98765 43210"
                value={form.emergencyVetPhone}
                onChange={(e) => update("emergencyVetPhone", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Any additional notes..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <Link href={`/dogs/${dogId}`} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function EditDogPage({
  params,
}: {
  params: Promise<{ dogId: string }>;
}) {
  return (
    <AppLayout>
      <EditDogContent params={params} />
    </AppLayout>
  );
}
