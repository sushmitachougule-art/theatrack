'use client';

import React, { useEffect, useState } from 'react';
import { SystemNotification } from '@/types';
import { subscribeToActiveNotifications } from '@/lib/repositories';
import { Info, AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function GlobalNotification() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = subscribeToActiveNotifications((data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, []);

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2 mb-4 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto pt-4 md:pt-6">
      {visibleNotifications.map((notification) => {
        const isError = notification.type === 'warning';
        const isSuccess = notification.type === 'success';

        let bg = 'rgba(59,130,246,0.1)';
        let border = 'rgba(59,130,246,0.2)';
        let iconColor = '#3b82f6';
        let Icon = Info;

        if (isError) {
          bg = 'rgba(239,68,68,0.1)';
          border = 'rgba(239,68,68,0.2)';
          iconColor = '#f87171';
          Icon = AlertTriangle;
        } else if (isSuccess) {
          bg = 'rgba(16,185,129,0.1)';
          border = 'rgba(16,185,129,0.2)';
          iconColor = '#10b981';
          Icon = CheckCircle;
        }

        return (
          <div 
            key={notification.id}
            className="w-full p-3 rounded-xl flex items-start gap-3 animate-slide-down relative shadow-sm"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div className="flex-shrink-0 mt-0.5">
              <Icon size={18} style={{ color: iconColor }} />
            </div>
            <div className="flex-1 pr-6">
              {notification.title && (
                <h4 className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {notification.title}
                </h4>
              )}
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {notification.message}
              </p>
            </div>
            <button 
              onClick={() => setDismissed(prev => new Set(prev).add(notification.id))}
              className="absolute top-3 right-3 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
