"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Bell, Heart, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <Image
            src="/icons/icon-192.png"
            alt="PawShield"
            width={36}
            height={36}
            className="rounded-xl"
          />
          <span className="text-xl font-extrabold tracking-tight">
            PawShield
          </span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          Sign In →
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold mb-8 tracking-wide uppercase">
          <Shield size={12} /> Your pet&apos;s health, protected
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 max-w-2xl leading-tight">
          Never miss a <span className="text-amber-400">vaccination</span> again
        </h1>

        <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed">
          PawShield tracks your dog&apos;s vaccinations, sends smart reminders,
          and keeps complete health records — so you can focus on the walks, not
          the paperwork.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base transition-all transform hover:scale-[1.02] shadow-lg shadow-amber-500/25"
          >
            Get Started Free <ArrowRight size={18} />
          </button>
          <button
            onClick={() => router.push("/login")}
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-base transition-all"
          >
            Try Demo Mode
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-3xl w-full text-left">
          {[
            {
              icon: Shield,
              title: "Full Health Records",
              desc: "Complete vaccination history for all your dogs in one place.",
            },
            {
              icon: Bell,
              title: "Smart Reminders",
              desc: "Push notifications 7, 3, and 1 day before each booster is due.",
            },
            {
              icon: Heart,
              title: "Multi-Dog Support",
              desc: "Manage the whole pack — unlimited dogs per account.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-amber-400" />
              </div>
              <h3 className="font-bold text-white mb-1">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-slate-600">
        © {new Date().getFullYear()} PawShield. Built with ❤️ for pet parents.
      </footer>
    </div>
  );
}
