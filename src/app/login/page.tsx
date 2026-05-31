"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  signInAsDemo,
  getAuthErrorMessage,
} from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import toast from "react-hot-toast";
import { ArrowRight, Mail, Lock, User } from "lucide-react";
import { seedDemoAccount } from "@/lib/seed";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const flags = useFeatureFlags();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  const handleGoogle = async () => {
    try {
      setSubmitting(true);
      await signInWithGoogle();
      toast.success("Welcome to PawShield!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setSubmitting(true);
      const user = await signInAsDemo();
      await seedDemoAccount(user.uid);
      toast.success("Welcome to the Demo!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (mode === "register") {
        await registerWithEmail(email, password, name);
        toast.success("Account created! Welcome!");
      } else {
        await signInWithEmail(email, password);
        toast.success("Welcome back!");
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md animate-slide-right">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/icons/icon-192.png"
                alt="PawShield"
                width={40}
                height={40}
                className="rounded-xl shadow-lg"
              />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                PawShield
              </h1>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-slate-400">
              Your premium digital health record for your furry family members.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-700/50 text-white font-medium transition-all duration-300 group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
              <ArrowRight
                size={14}
                className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400"
              />
            </button>

            <button
              onClick={handleDemoLogin}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border transition-all duration-300 group mt-3 bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
              style={{ display: flags.demoLoginEnabled ? undefined : "none" }}
            >
              Try Demo Mode
              <ArrowRight
                size={14}
                className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
              />
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Or continue with email
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmail} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all outline-none"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="email"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all outline-none"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all outline-none"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-3.5 rounded-xl mt-4 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02]"
              >
                {submitting ? (
                  <div
                    className="spinner"
                    style={{
                      width: 18,
                      height: 18,
                      borderWidth: 2,
                      borderColor: "rgba(0,0,0,0.2)",
                      borderTopColor: "black",
                    }}
                  />
                ) : (
                  <>
                    {mode === "login"
                      ? "Sign In to Dashboard"
                      : "Create Account"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-8 text-slate-400">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            {(mode === "register" || flags.registrationEnabled) && (
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="font-bold text-amber-500 hover:text-amber-400 transition-colors"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            )}
          </p>

          <p className="text-center text-xs mt-6 text-slate-500">
            Free forever · No credit card required
          </p>
        </div>
      </div>

      {/* Right Column - Image/Illustration (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1c5ce5] items-center justify-center overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full border-[40px] border-white/20" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full border-[60px] border-white/20" />
        </div>

        {/* The beautiful generated illustration */}
        <div className="relative z-10 w-full max-w-lg p-12">
          <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl animate-float">
            <Image
              src="/images/login-hero.png"
              alt="Happy Dog Illustration"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div
            className="mt-12 text-white text-center px-8 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <h3 className="text-2xl font-bold mb-3">
              All your pet&apos;s needs in one place
            </h3>
            <p className="text-blue-100/80">
              Join thousands of pet parents who trust PawShield to organize
              vaccinations, health records, and vet reminders automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
