'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Plus } from 'lucide-react';

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to PawShield!",
      desc: "Your premium digital health record for your furry family members. Let's get you set up.",
      image: "/images/onboard-1.png",
      bgColor: "#f97316", // Vibrant Orange
      btnColor: "rgba(0,0,0,0.2)",
      textColor: "#ffffff"
    },
    {
      title: "Never Miss a Vaccine",
      desc: "Get automatic reminders for boosters. We track the schedules so you don't have to.",
      image: "/images/onboard-2.png",
      bgColor: "#3b82f6", // Vibrant Blue
      btnColor: "rgba(0,0,0,0.2)",
      textColor: "#ffffff"
    },
    {
      title: "Complete Health History",
      desc: "Log vet visits, upload certificates, and keep all medical history in one secure place.",
      image: "/images/onboard-3.png",
      bgColor: "#ef4444", // Vibrant Red/Salmon
      btnColor: "rgba(0,0,0,0.2)",
      textColor: "#ffffff"
    }
  ];

  const current = steps[step];

  return (
    <div 
      className="w-full min-h-[70vh] rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-between p-8 sm:p-12 transition-colors duration-700 relative animate-scale-in shadow-2xl"
      style={{ backgroundColor: current.bgColor }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full border-[30px] border-white" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full border-[40px] border-white" />
      </div>

      <div className="w-full flex justify-end relative z-10">
        <button 
          onClick={() => setStep(steps.length - 1)}
          className="text-white/80 hover:text-white font-semibold text-sm transition-colors"
        >
          {step < steps.length - 1 ? 'Skip' : ''}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 mt-4 mb-8">
        {/* Animated Image Container */}
        <div className="w-64 h-64 sm:w-80 sm:h-80 relative mb-8 animate-float shadow-2xl rounded-[2rem] overflow-hidden border-4 border-white/20">
          <Image 
            src={current.image} 
            alt={current.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-center" style={{ color: current.textColor }}>
          {current.title}
        </h2>
        <p className="text-base sm:text-lg text-center leading-relaxed" style={{ color: current.textColor, opacity: 0.9 }}>
          {current.desc}
        </p>
      </div>

      <div className="w-full max-w-md flex items-center justify-between relative z-10">
        {/* Dots */}
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-2.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-white' : 'w-2.5 bg-white/40'}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div>
          {step < steps.length - 1 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              className="px-8 py-3.5 rounded-full text-white font-bold flex items-center gap-2 hover:bg-black/10 transition-colors backdrop-blur-sm"
              style={{ backgroundColor: current.btnColor }}
            >
              Next <ArrowRight size={18} />
            </button>
          ) : (
            <Link 
              href="/dogs/new" 
              className="px-8 py-3.5 rounded-full text-gray-900 bg-white font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl animate-pulse-glow"
            >
              <Plus size={18} /> Add Your First Dog
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
