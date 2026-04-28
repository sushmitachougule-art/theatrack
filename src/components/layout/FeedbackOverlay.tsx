"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  X,
  Send,
  ListChecks,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { submitFeedback, subscribeToUserFeedback } from "@/lib/repositories";
import { useAuth } from "@/hooks/useAuth";
import { Feedback } from "@/types";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  new: { label: "New", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  "in-progress": {
    label: "In Progress",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  reviewed: {
    label: "Reviewed",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
  },
  resolved: {
    label: "Resolved",
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
  },
};

export default function FeedbackOverlay() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"submit" | "mine">("submit");
  const [type, setType] = useState<"bug" | "feature" | "other">("feature");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserFeedback(user.uid, setMyFeedback);
    return () => unsub();
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      setSubmitting(true);
      await submitFeedback(user.uid, user.email || undefined, type, message);
      toast.success("Thank you for your feedback!");
      setMessage("");
      setType("feature");
      // Switch to My Feedback tab so user sees their submission
      setActiveTab("mine");
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = myFeedback.filter((f) => f.status !== "resolved").length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-50 animate-pulse-glow"
        style={{ background: "var(--color-primary)", color: "white" }}
        title="Send Feedback"
      >
        <MessageSquarePlus size={22} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-slide-down"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X size={20} style={{ color: "var(--text-muted)" }} />
            </button>

            <h2
              className="text-xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Feedback
            </h2>

            {/* Tabs */}
            <div
              className="flex gap-1 mb-5 mt-3 p-1 rounded-xl"
              style={{ background: "var(--bg-secondary)" }}
            >
              <button
                onClick={() => setActiveTab("submit")}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                style={{
                  background:
                    activeTab === "submit"
                      ? "var(--bg-primary)"
                      : "transparent",
                  color:
                    activeTab === "submit"
                      ? "var(--color-primary)"
                      : "var(--text-muted)",
                  boxShadow:
                    activeTab === "submit"
                      ? "0 1px 4px rgba(0,0,0,0.1)"
                      : "none",
                }}
              >
                <Send size={13} /> Send
              </button>
              <button
                onClick={() => setActiveTab("mine")}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                style={{
                  background:
                    activeTab === "mine" ? "var(--bg-primary)" : "transparent",
                  color:
                    activeTab === "mine"
                      ? "var(--color-primary)"
                      : "var(--text-muted)",
                  boxShadow:
                    activeTab === "mine" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                <ListChecks size={13} /> My Feedback
                {pendingCount > 0 && (
                  <span
                    className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: "var(--color-primary-bg-hover)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>

            {/* Submit Tab */}
            {activeTab === "submit" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label text-sm font-medium block mb-1">
                    Feedback Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["feature", "bug", "other"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className="py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors"
                        style={{
                          background:
                            type === t
                              ? "var(--color-primary-bg-strong)"
                              : "var(--bg-input)",
                          color:
                            type === t
                              ? "var(--color-primary)"
                              : "var(--text-muted)",
                          border: `1px solid ${type === t ? "var(--color-primary-border)" : "transparent"}`,
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="form-label text-sm font-medium block mb-1">
                    Message
                  </label>
                  <textarea
                    className="form-input w-full p-3 rounded-xl min-h-[120px] resize-none"
                    placeholder={
                      type === "bug"
                        ? "Describe the issue you encountered..."
                        : "What features would you like to see?"
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-xl mt-2 disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Submit Feedback"}
                  {!submitting && <Send size={16} />}
                </button>
              </form>
            )}

            {/* My Feedback Tab */}
            {activeTab === "mine" && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {myFeedback.length === 0 ? (
                  <div className="py-10 text-center">
                    <ListChecks
                      size={28}
                      className="mx-auto mb-2"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No feedback submitted yet
                    </p>
                    <button
                      onClick={() => setActiveTab("submit")}
                      className="mt-3 text-xs font-medium"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Send your first feedback →
                    </button>
                  </div>
                ) : (
                  myFeedback.map((f) => {
                    const s = STATUS_CONFIG[f.status] || STATUS_CONFIG.new;
                    return (
                      <div
                        key={f.id}
                        className="rounded-xl p-3 flex flex-col gap-1.5"
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium"
                            style={{
                              background:
                                f.type === "bug"
                                  ? "rgba(239,68,68,0.12)"
                                  : "rgba(96,165,250,0.12)",
                              color: f.type === "bug" ? "#f87171" : "#60a5fa",
                            }}
                          >
                            {f.type}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                            style={{ background: s.bg, color: s.color }}
                          >
                            {f.status === "resolved" ? (
                              <CheckCircle size={10} />
                            ) : f.status === "in-progress" ? (
                              <Clock size={10} />
                            ) : (
                              <AlertCircle size={10} />
                            )}
                            {s.label}
                          </span>
                        </div>
                        <p
                          className="text-xs whitespace-pre-wrap leading-relaxed"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {f.message}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(f.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
