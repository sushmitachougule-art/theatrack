"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { use } from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Syringe,
  Shield,
  Download,
  Eye,
} from "lucide-react";
import {
  formatDate,
  getDogAge,
  getVaccinationStatus,
} from "@/lib/utils/dateUtils";

interface PublicDog {
  id: string;
  name: string;
  breed: string;
  dateOfBirth: string;
  gender: string;
  weight: number | null;
  color: string;
  photoUrl: string | null;
  microchipNumber: string;
  emergencyVetName: string;
  emergencyVetPhone: string;
  insuranceProvider: string;
  notes: string;
}

interface PublicRecord {
  id: string;
  vaccinationTypeName: string;
  dateAdministered: string;
  nextDueDate: string;
  vetName: string;
  clinicName: string;
  batchNumber: string;
  cost: number | null;
  sideEffectsNoted: boolean;
  sideEffectsNotes: string;
  certificateUrl: string | null;
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [dog, setDog] = useState<PublicDog | null>(null);
  const [records, setRecords] = useState<PublicRecord[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setDog(data.dog);
          setRecords(data.records);
          setExpiresAt(data.expiresAt);
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1e] px-4 text-center gap-4">
        <div className="text-5xl">🔗</div>
        <h1 className="text-xl font-bold text-white">
          {error === "Link has expired" ? "Link Expired" : "Link Not Found"}
        </h1>
        <p className="text-sm text-slate-400 max-w-xs">
          {error === "Link has expired"
            ? "This share link has expired. Ask the owner to generate a new one."
            : "This link is invalid or has been revoked."}
        </p>
      </div>
    );
  }

  if (!dog) return null;

  const upToDate = records.filter(
    (r) => getVaccinationStatus(r.nextDueDate).status === "green",
  ).length;
  const dueSoon = records.filter(
    (r) => getVaccinationStatus(r.nextDueDate).status === "yellow",
  ).length;
  const overdue = records.filter(
    (r) => getVaccinationStatus(r.nextDueDate).status === "red",
  ).length;
  const score =
    records.length === 0 ? 0 : Math.round((upToDate / records.length) * 100);
  const scoreColor =
    score >= 80 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{
          background: "rgba(10,15,30,0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            🐾 PawShield
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Shared vaccination record
        </p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-10">
        {/* Dog profile card */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.15)" }}
            >
              {dog.photoUrl ? (
                <Image
                  src={dog.photoUrl}
                  alt={dog.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">🐕</span>
              )}
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {dog.name}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {dog.breed} · {getDogAge(dog.dateOfBirth)} ·{" "}
                {dog.gender === "male" ? "♂ Male" : "♀ Female"}
                {dog.weight ? ` · ${dog.weight}kg` : ""}
              </p>
            </div>
          </div>

          {/* Stats row */}
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
                className="h-full rounded-full transition-all"
                style={{ width: `${score}%`, background: scoreColor }}
              />
            </div>
          </div>

          {/* Dog details chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {dog.microchipNumber && (
              <span
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                <Shield size={11} /> Microchip: {dog.microchipNumber}
              </span>
            )}
            {dog.insuranceProvider && (
              <span
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                Insurance: {dog.insuranceProvider}
              </span>
            )}
          </div>
        </div>

        {/* Vaccination records */}
        <div>
          <h2
            className="text-base font-semibold mb-3 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <Syringe size={15} style={{ color: "var(--color-primary)" }} />
            Vaccination Records ({records.length})
          </h2>

          {records.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No vaccination records
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => {
                const info = getVaccinationStatus(r.nextDueDate);
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl p-4"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      borderLeft: `3px solid ${
                        info.status === "green"
                          ? "#34d399"
                          : info.status === "yellow"
                            ? "#fbbf24"
                            : "#f87171"
                      }`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
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
                        {r.batchNumber && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Batch: {r.batchNumber}
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
                            onClick={() => setPreviewUrl(r.certificateUrl!)}
                            className="flex items-center gap-1 text-[11px] mt-1.5 font-medium hover:underline"
                            style={{ color: "var(--color-primary)" }}
                          >
                            <Eye size={11} /> View Certificate
                          </button>
                        )}
                      </div>
                      <span
                        className={`status-${info.status} px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 flex-shrink-0`}
                      >
                        {info.status === "green" && <CheckCircle size={11} />}
                        {info.status === "yellow" && <Clock size={11} />}
                        {info.status === "red" && <AlertTriangle size={11} />}
                        {info.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {expiresAt && (
          <p
            className="text-center text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            This link expires on {formatDate(expiresAt)} · Powered by PawShield
          </p>
        )}
      </div>

      {/* Certificate lightbox */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <Download size={13} /> Open
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                  style={{ color: "var(--text-muted)" }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewUrl}
                alt="Certificate"
                className="w-full h-auto rounded-xl object-contain"
                style={{ maxHeight: "60vh" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
