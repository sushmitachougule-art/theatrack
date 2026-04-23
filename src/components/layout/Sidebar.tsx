'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Dog,
  Bell,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Download,
  BellRing
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useFCM } from '@/hooks/useFCM';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dogs', label: 'My Dogs', icon: Dog },
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_ITEMS = [
  { href: '/admin', label: 'Admin Panel', icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isInstallable, promptInstall } = usePWAInstall();
  const { notificationPermissionStatus, requestPermission } = useFCM();

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <Image src="/icons/icon-192.png" alt="PawShield" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-sm text-gradient">PawShield</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-primary)', background: mobileOpen ? 'rgba(245,158,11,0.1)' : 'transparent' }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 animate-fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-[250px] flex flex-col transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)', borderRight: '1px solid var(--border-color)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <Image src="/icons/icon-192.png" alt="PawShield" width={36} height={36} className="rounded-xl" />
          <div>
            <h1 className="font-bold text-base text-gradient">PawShield</h1>
            <p className="text-[10px] tracking-wide" style={{ color: 'var(--text-muted)' }}>Vaccination Tracker</p>
          </div>
        </div>

        <div className="divider-glow mx-5 mb-2" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest px-3 mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Menu</p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={18} />
                {item.label}
                {item.href === '/reminders' && (
                  <span className="notification-dot ml-auto" />
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="divider-glow my-3" />
              <p className="text-[10px] uppercase tracking-widest px-3 mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Admin</p>
              {ADMIN_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold dog-avatar">
              {profile?.photoUrl ? (
                <Image src={profile.photoUrl} alt="" width={36} height={36} className="rounded-xl" />
              ) : (
                <span style={{ color: 'var(--color-primary)' }}>
                  {profile?.displayName?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {profile?.displayName || 'User'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                {profile?.email}
              </p>
            </div>
          </div>
          
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'var(--color-primary)', color: 'black' }}
            >
              <Download size={14} /> Install App
            </button>
          )}

          {notificationPermissionStatus === 'default' && (
            <button
              onClick={requestPermission}
              className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-lg text-xs font-bold transition-all border border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
            >
              <BellRing size={14} /> Enable Notifications
            </button>
          )}

          <button
            onClick={logout}
            className="sidebar-link w-full text-xs"
            style={{ color: '#f87171' }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
