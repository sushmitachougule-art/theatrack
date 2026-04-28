"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  useVaccinationRecords,
  useVaccinationTypes,
} from "@/hooks/useVaccinations";
import {
  getDog,
  createVaccinationRecord,
  deleteVaccinationRecord,
  deleteDog,
  createShareToken,
  getDogShareTokens,
  revokeShareToken,
} from "@/lib/repositories";
import { Dog, VaccinationFormData, ShareToken } from "@/types";
import {
  getVaccinationStatus,
  formatDate,
  getDogAge,
} from "@/lib/utils/dateUtils";
import {
  ArrowLeft,
  Plus,
  Syringe,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Shield,
  Phone,
  X,
  Camera,
  Eye,
  Pencil,
  Share2,
  Copy,
  Link2,
  RefreshCw,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// ─── Share Modal ──────────────────────────────────────────────────────────
function ShareModal({
  dogId,
  ownerId,
  onClose,
}: {
  dogId: string;
  ownerId: string;
  onClose: () => void;
}) {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    getDogShareTokens(dogId).then((t) => {
      setTokens(t);
      setLoading(false);
    });
  }, [dogId]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const token = await createShareToken(dogId, ownerId);
      const all = await getDogShareTokens(dogId);
      setTokens(all);
      // Auto-copy new link
      const url = `${origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(null), 3000);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (token: string) => {
    await navigator.clipboard.writeText(`${origin}/share/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied!");
  };

  const handleRevoke = async (token: string) => {
    if (!confirm("Revoke this link? Anyone with it will lose access.")) return;
    await revokeShareToken(token);
    setTokens((t) => t.filter((x) => x.id !== token));
    toast.success("Link revoked");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-semibold flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <Share2 size={18} style={{ color: "var(--color-primary)" }} />
            Share Vaccination Record
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Generate a read-only link valid for 30 days. Anyone with the link can
          view vaccination records — no login required.
        </p>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-5"
        >
          {generating ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Link2 size={14} /> Generate New Link
            </>
          )}
        </button>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="spinner" />
          </div>
        ) : tokens.length === 0 ? (
          <p
            className="text-center text-sm py-4"
            style={{ color: "var(--text-muted)" }}
          >
            No active links yet
          </p>
        ) : (
          <div className="space-y-2">
            <p
              className="text-xs font-medium mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Active links
            </p>
            {tokens.map((t) => {
              const url = `${origin}/share/${t.id}`;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <p
                    className="flex-1 text-xs truncate font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {url}
                  </p>
                  <button
                    onClick={() => handleCopy(t.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    style={{
                      color:
                        copied === t.id ? "#34d399" : "var(--color-primary)",
                    }}
                    title="Copy link"
                  >
                    {copied === t.id ? (
                      <CheckCircle size={15} />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                  <button
                    onClick={() => handleRevoke(t.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    style={{ color: "#f87171" }}
                    title="Revoke link"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            <p
              className="text-[10px] mt-2"
              style={{ color: "var(--text-muted)" }}
            >
              Links expire 30 days after creation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Certificate Preview Lightbox ─────────────────────────────────────────
function CertificatePreviewModal({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-color)" }}
        >
          <p
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Vaccination Certificate
          </p>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: "var(--color-primary-bg)",
                color: "var(--color-primary)",
                border: "1px solid var(--color-primary-border)",
              }}
            >
              <Download size={13} /> Open / Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto">
          {imgError ? (
            <div className="text-center py-10 space-y-3">
              <FileText
                size={48}
                style={{ color: "var(--text-muted)" }}
                className="mx-auto"
              />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                PDF or non-image certificate
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Download size={14} /> Open Certificate
              </a>
            </div>
          ) : (
            <div className="relative w-full" style={{ minHeight: 200 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Vaccination Certificate"
                className="w-full h-auto rounded-xl object-contain"
                style={{ maxHeight: "60vh" }}
                onError={() => setImgError(true)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Vaccination Modal ─────────────────────────────────────────────────────
function VaccinationModal({
  dogId,
  ownerId,
  onClose,
}: {
  dogId: string;
  ownerId: string;
  onClose: () => void;
}) {
  const { types } = useVaccinationTypes();
  const [form, setForm] = useState<VaccinationFormData>({
    vaccinationTypeId: "",
    dateAdministered: "",
    customIntervalDays: null,
    vetName: "",
    clinicName: "",
    batchNumber: "",
    manufacturer: "",
    sideEffectsNoted: false,
    sideEffectsNotes: "",
    cost: null,
    certificate: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [certFileName, setCertFileName] = useState<string | null>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedType = types.find((t) => t.id === form.vaccinationTypeId);
    if (!selectedType) return toast.error("Please select a vaccination type");
    const today = new Date().toISOString().split("T")[0];
    if (form.dateAdministered > today) {
      return toast.error("Date administered cannot be in the future");
    }
    if (form.cost !== null && form.cost < 0) {
      return toast.error("Cost cannot be negative");
    }
    if (
      form.customIntervalDays !== null &&
      (form.customIntervalDays < 1 || form.customIntervalDays > 3650)
    ) {
      return toast.error("Interval must be between 1 and 3650 days");
    }
    try {
      setSubmitting(true);
      await createVaccinationRecord(
        dogId,
        ownerId,
        form,
        selectedType.name,
        selectedType.defaultIntervalDays,
      );
      toast.success("Vaccination record added!");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Add Vaccination Record
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Vaccination Type *</label>
            <select
              className="form-select"
              value={form.vaccinationTypeId}
              onChange={(e) =>
                setForm((p) => ({ ...p, vaccinationTypeId: e.target.value }))
              }
              required
            >
              <option value="">Select vaccination</option>
              {["core", "non-core", "preventive", "custom"].map((cat) => {
                const catTypes = types.filter((t) => t.category === cat);
                return catTypes.length > 0 ? (
                  <optgroup
                    key={cat}
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                  >
                    {catTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Date Administered *</label>
              <input
                type="date"
                className="form-input"
                value={form.dateAdministered}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dateAdministered: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="form-label">Custom Interval (days)</label>
              <input
                type="number"
                min="1"
                max="3650"
                className="form-input"
                placeholder="Leave blank for default"
                value={form.customIntervalDays || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    customIntervalDays: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Vet Name</label>
              <input
                className="form-input"
                value={form.vetName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vetName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="form-label">Clinic Name</label>
              <input
                className="form-input"
                value={form.clinicName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clinicName: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Batch Number</label>
              <input
                className="form-input"
                value={form.batchNumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, batchNumber: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="form-label">Cost (₹)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.cost || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    cost: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sideEffectsNoted}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sideEffectsNoted: e.target.checked }))
                }
                className="accent-amber-500"
              />
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Side effects noted
              </span>
            </label>
            {form.sideEffectsNoted && (
              <textarea
                className="form-input mt-2"
                rows={2}
                placeholder="Describe side effects..."
                value={form.sideEffectsNotes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sideEffectsNotes: e.target.value }))
                }
              />
            )}
          </div>

          {/* Certificate upload */}
          <div>
            <label className="form-label">
              Vaccination Certificate (optional)
            </label>
            <div
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed cursor-pointer transition-all"
              style={{
                borderColor: certFileName
                  ? "var(--color-primary-border)"
                  : "var(--border-color)",
                background: "var(--bg-input)",
              }}
              onClick={() => certInputRef.current?.click()}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--color-primary-bg)" }}
              >
                <Camera size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                {certFileName ? (
                  <>
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {certFileName}
                    </p>
                    <p
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Tap to change
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Upload certificate photo or PDF
                    </p>
                    <p
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      JPG, PNG or PDF · Max 5MB
                    </p>
                  </>
                )}
              </div>
              {certFileName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((p) => ({ ...p, certificate: null }));
                    setCertFileName(null);
                    if (certInputRef.current) certInputRef.current.value = "";
                  }}
                  style={{ color: "#f87171" }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <input
              ref={certInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("File must be under 5MB");
                  return;
                }
                setForm((p) => ({ ...p, certificate: file }));
                setCertFileName(file.name);
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? "Saving..." : "💉 Save Record"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DogDetailContent({ params }: { params: Promise<{ dogId: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [certPreviewUrl, setCertPreviewUrl] = useState<string | null>(null);
  const { records, loading: recsLoading } = useVaccinationRecords(
    resolvedParams.dogId,
  );

  useEffect(() => {
    getDog(resolvedParams.dogId).then((d) => {
      setDog(d);
      setLoading(false);
    });
  }, [resolvedParams.dogId]);

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Delete this vaccination record?")) return;
    try {
      await deleteVaccinationRecord(id);
      toast.success("Record deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteDog = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${dog?.name}? This cannot be undone.`,
      )
    )
      return;
    try {
      await deleteDog(resolvedParams.dogId);
      toast.success("Dog removed");
      router.push("/dogs");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleExportPDF = () => {
    if (!dog) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text(`Vaccination Record: ${dog.name}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
      `Breed: ${dog.breed} | Age: ${getDogAge(dog.dateOfBirth)} | Gender: ${dog.gender}`,
      14,
      30,
    );
    if (dog.microchipNumber)
      doc.text(`Microchip: ${dog.microchipNumber}`, 14, 36);

    // Table
    const tableData = records.map((r) => [
      r.vaccinationTypeName,
      formatDate(r.dateAdministered),
      formatDate(r.nextDueDate),
      r.vetName || "N/A",
      r.status,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Vaccine", "Date Given", "Next Due", "Vet/Clinic", "Status"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] },
    });

    doc.save(`${dog.name}-vaccinations.pdf`);
    toast.success("PDF Exported!");
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  if (!dog)
    return (
      <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
        Dog not found
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/dogs"
        className="flex items-center gap-2 text-sm hover:underline"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={16} /> Back to My Dogs
      </Link>

      {/* Profile card — horizontal layout */}
      <div className="glass-card p-5" style={{ cursor: "default" }}>
        <div className="flex gap-5">
          {/* Left — Large photo */}
          <div
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex-shrink-0 flex items-center justify-center text-4xl overflow-hidden"
            style={{ background: "var(--color-primary-bg-strong)" }}
          >
            {dog.photoUrl ? (
              <Image
                src={dog.photoUrl}
                alt={dog.name}
                width={144}
                height={144}
                className="w-full h-full object-cover"
              />
            ) : (
              "🐕"
            )}
          </div>

          {/* Right — Info + Actions */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h1
                className="text-xl sm:text-2xl font-bold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {dog.name}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {dog.breed}
              </p>
              <div
                className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-2"
                style={{ color: "var(--text-muted)" }}
              >
                <span>{getDogAge(dog.dateOfBirth)}</span>
                <span>{dog.gender === "male" ? "♂ Male" : "♀ Female"}</span>
                {dog.weight && <span>{dog.weight} kg</span>}
              </div>
            </div>

            {/* Action buttons — compact row */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={handleExportPDF}
                className="btn-secondary flex items-center gap-1.5 text-xs px-2.5 py-1.5"
              >
                <Download size={13} /> PDF
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="btn-secondary flex items-center gap-1.5 text-xs px-2.5 py-1.5"
              >
                <Share2 size={13} /> Share
              </button>
              <Link
                href={`/dogs/${resolvedParams.dogId}/edit`}
                className="btn-secondary flex items-center gap-1.5 text-xs px-2.5 py-1.5"
              >
                <Pencil size={13} /> Edit
              </Link>
              <button
                onClick={handleDeleteDog}
                className="btn-danger flex items-center gap-1.5 text-xs px-2.5 py-1.5"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Info chips */}
        {(dog.microchipNumber ||
          dog.emergencyVetPhone ||
          dog.insuranceProvider) && (
          <div
            className="flex flex-wrap gap-2 text-xs mt-4 pt-4"
            style={{ borderTop: "1px solid var(--border-color)" }}
          >
            {dog.microchipNumber && (
              <span
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                <Shield size={12} /> Microchip: {dog.microchipNumber}
              </span>
            )}
            {dog.emergencyVetPhone && (
              <span
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                <Phone size={12} /> Emergency: {dog.emergencyVetName} (
                {dog.emergencyVetPhone})
              </span>
            )}
            {dog.insuranceProvider && (
              <span
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                <FileText size={12} /> Insurance: {dog.insuranceProvider}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Health summary */}
      {!recsLoading &&
        records.length > 0 &&
        (() => {
          const completed = records.filter((r) => r.status === "completed");
          const overdue = completed.filter(
            (r) => getVaccinationStatus(r.nextDueDate).status === "red",
          ).length;
          const dueSoon = completed.filter(
            (r) => getVaccinationStatus(r.nextDueDate).status === "yellow",
          ).length;
          const upToDate = completed.filter(
            (r) => getVaccinationStatus(r.nextDueDate).status === "green",
          ).length;
          const total = completed.length;
          const score = total === 0 ? 0 : Math.round((upToDate / total) * 100);
          const totalSpend = completed.reduce((s, r) => s + (r.cost || 0), 0);
          const scoreColor =
            score >= 80 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";

          return (
            <div className="glass-card p-5" style={{ cursor: "default" }}>
              <h3
                className="text-sm font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <Shield size={15} style={{ color: "var(--color-primary)" }} />{" "}
                Health Overview
              </h3>

              {/* Stat row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Up to Date", val: upToDate, color: "#34d399" },
                  { label: "Due Soon", val: dueSoon, color: "#fbbf24" },
                  { label: "Overdue", val: overdue, color: "#f87171" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <p
                      className="text-xl font-extrabold"
                      style={{ color: s.color }}
                    >
                      {s.val}
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Protection bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--text-muted)" }}>
                    Protection Level
                  </span>
                  <span className="font-bold" style={{ color: scoreColor }}>
                    {score}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-input)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, background: scoreColor }}
                  />
                </div>
              </div>

              {/* Segmented bar */}
              {total > 0 && (
                <div
                  className="flex rounded-full overflow-hidden h-1.5 mb-3"
                  style={{ background: "var(--bg-input)" }}
                >
                  {upToDate > 0 && (
                    <div
                      style={{
                        width: `${(upToDate / total) * 100}%`,
                        background: "#34d399",
                      }}
                    />
                  )}
                  {dueSoon > 0 && (
                    <div
                      style={{
                        width: `${(dueSoon / total) * 100}%`,
                        background: "#fbbf24",
                      }}
                    />
                  )}
                  {overdue > 0 && (
                    <div
                      style={{
                        width: `${(overdue / total) * 100}%`,
                        background: "#f87171",
                      }}
                    />
                  )}
                </div>
              )}

              {/* Footer */}
              <div
                className="flex items-center justify-between text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <span>
                  {total} record{total !== 1 ? "s" : ""} total
                </span>
                {totalSpend > 0 && (
                  <span>
                    Total spend:{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      ₹{totalSpend.toLocaleString()}
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })()}

      {/* Vaccination records */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Vaccination Records
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> Add Record
          </button>
        </div>

        {recsLoading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : records.length === 0 ? (
          <div
            className="glass-card p-8 text-center"
            style={{ cursor: "default" }}
          >
            <Syringe
              size={32}
              className="mx-auto mb-3"
              style={{ color: "var(--text-muted)" }}
            />
            <p
              className="text-sm mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              No vaccination records yet
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Add the first vaccination to start tracking schedules.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus size={14} /> Add First Record
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r) => {
              const info = getVaccinationStatus(r.nextDueDate);
              return (
                <div
                  key={r.id}
                  className="glass-card p-4"
                  style={{
                    cursor: "default",
                    borderLeft: `3px solid ${
                      info.status === "green"
                        ? "#34d399"
                        : info.status === "yellow"
                          ? "#fbbf24"
                          : "#f87171"
                    }`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ background: "var(--color-primary-bg-strong)" }}
                      >
                        <Syringe
                          size={16}
                          style={{ color: "var(--color-primary)" }}
                        />
                      </div>
                      <div>
                        <h3
                          className="font-medium text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {r.vaccinationTypeName}
                        </h3>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Given: {formatDate(r.dateAdministered)}
                          {r.vetName ? ` · Dr. ${r.vetName}` : ""}
                          {r.clinicName ? ` at ${r.clinicName}` : ""}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Next due: {formatDate(r.nextDueDate)}
                        </p>
                        {r.cost && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Cost: ₹{r.cost}
                          </p>
                        )}
                        {r.sideEffectsNoted && (
                          <p
                            className="text-xs mt-1 px-2 py-1 rounded"
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              color: "#f87171",
                            }}
                          >
                            ⚠️ Side effects: {r.sideEffectsNotes}
                          </p>
                        )}
                        {r.certificateUrl && (
                          <button
                            onClick={() => setCertPreviewUrl(r.certificateUrl!)}
                            className="flex items-center gap-1 text-[11px] mt-1.5 font-medium transition-colors hover:underline"
                            style={{ color: "var(--color-primary)" }}
                          >
                            <Eye size={11} /> View Certificate
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`status-${info.status} px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1`}
                      >
                        {info.status === "green" && <CheckCircle size={11} />}
                        {info.status === "yellow" && <Clock size={11} />}
                        {info.status === "red" && <AlertTriangle size={11} />}
                        {info.label}
                      </span>
                      <button
                        onClick={() => handleDeleteRecord(r.id)}
                        className="p-1 rounded hover:bg-red-500/10"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && user && (
        <VaccinationModal
          dogId={resolvedParams.dogId}
          ownerId={user.uid}
          onClose={() => setShowModal(false)}
        />
      )}
      {showShareModal && user && (
        <ShareModal
          dogId={resolvedParams.dogId}
          ownerId={user.uid}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {certPreviewUrl && (
        <CertificatePreviewModal
          url={certPreviewUrl}
          onClose={() => setCertPreviewUrl(null)}
        />
      )}
    </div>
  );
}

export default function DogDetailPage({
  params,
}: {
  params: Promise<{ dogId: string }>;
}) {
  return (
    <AppLayout>
      <DogDetailContent params={params} />
    </AppLayout>
  );
}
