'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import FeedbackOverlay from '@/components/layout/FeedbackOverlay';
import GlobalNotification from '@/components/layout/GlobalNotification';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading PawShield...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 md:ml-[240px] pt-14 md:pt-0">
        <GlobalNotification />
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pt-0 md:pt-0">
          {children}
        </div>
      </main>
      <FeedbackOverlay />
    </div>
  );
}
