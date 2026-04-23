'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Settings, User, Bell } from 'lucide-react';

function SettingsContent() {
  const { profile } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your account preferences</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-5" style={{ cursor: 'default' }}>
        <div className="flex items-center gap-2 mb-4">
          <User size={18} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Profile</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="form-label">Display Name</label>
            <input className="form-input" value={profile?.displayName || ''} readOnly />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" value={profile?.email || ''} readOnly />
          </div>
          <div>
            <label className="form-label">Role</label>
            <input className="form-input capitalize" value={profile?.role || 'owner'} readOnly />
          </div>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="glass-card p-5" style={{ cursor: 'default' }}>
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Enable push notifications</span>
            <div className="w-10 h-5 rounded-full relative" style={{ background: 'var(--border-color)' }}>
              <div className="w-4 h-4 rounded-full absolute top-0.5 left-0.5" style={{ background: 'var(--text-muted)' }} />
            </div>
          </label>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Reminder days before due: 7, 3, 1 day(s)
          </p>
        </div>
      </div>

      {/* App info */}
      <div className="glass-card p-5" style={{ cursor: 'default' }}>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>About</h2>
        </div>
        <div className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>PawShield v1.0.0</p>
          <p>Built with Next.js + Firebase</p>
          <p>© {new Date().getFullYear()} PawShield</p>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return <AppLayout><SettingsContent /></AppLayout>;
}
