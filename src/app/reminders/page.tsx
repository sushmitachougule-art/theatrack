'use client';

import React, { useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useDogs } from '@/hooks/useDogs';
import { useVaccinationRecords } from '@/hooks/useVaccinations';
import { getVaccinationStatus, formatDate } from '@/lib/utils/dateUtils';
import { Bell, CheckCircle, Clock, AlertTriangle, Syringe } from 'lucide-react';
import Link from 'next/link';

function RemindersContent() {
  const { dogs } = useDogs();
  const { records, loading } = useVaccinationRecords();

  const grouped = useMemo(() => {
    const overdue: typeof enriched = [];
    const dueSoon: typeof enriched = [];
    const upcoming: typeof enriched = [];

    const enriched = records
      .filter((r) => r.status === 'completed')
      .map((r) => ({
        ...r,
        dogName: dogs.find((d) => d.id === r.dogId)?.name || 'Unknown',
        statusInfo: getVaccinationStatus(r.nextDueDate),
      }));

    enriched.forEach((r) => {
      if (r.statusInfo.status === 'red') overdue.push(r);
      else if (r.statusInfo.status === 'yellow') dueSoon.push(r);
      else upcoming.push(r);
    });

    overdue.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    dueSoon.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    upcoming.sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

    return { overdue, dueSoon, upcoming };
  }, [records, dogs]);

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" /></div>;

  const ReminderCard = ({ r }: { r: typeof grouped.overdue[0] }) => (
    <Link href={`/dogs/${r.dogId}`} className="glass-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Syringe size={16} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.vaccinationTypeName}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {r.dogName} · Due {formatDate(r.nextDueDate)}
          </p>
        </div>
      </div>
      <span className={`status-${r.statusInfo.status} px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1`}>
        {r.statusInfo.status === 'green' && <CheckCircle size={11} />}
        {r.statusInfo.status === 'yellow' && <Clock size={11} />}
        {r.statusInfo.status === 'red' && <AlertTriangle size={11} />}
        {r.statusInfo.label}
      </span>
    </Link>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reminders</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Stay on top of your pets&apos; vaccination schedule</p>
      </div>

      {records.length === 0 ? (
        <div className="glass-card p-12 text-center" style={{ cursor: 'default' }}>
          <Bell size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>No reminders yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add vaccination records to your dogs to see reminders here.</p>
        </div>
      ) : (
        <>
          {grouped.overdue.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#f87171' }}>
                <AlertTriangle size={16} /> Overdue ({grouped.overdue.length})
              </h2>
              <div className="space-y-2">{grouped.overdue.map((r) => <ReminderCard key={r.id} r={r} />)}</div>
            </div>
          )}
          {grouped.dueSoon.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#fbbf24' }}>
                <Clock size={16} /> Due Soon ({grouped.dueSoon.length})
              </h2>
              <div className="space-y-2">{grouped.dueSoon.map((r) => <ReminderCard key={r.id} r={r} />)}</div>
            </div>
          )}
          {grouped.upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#34d399' }}>
                <CheckCircle size={16} /> Up to Date ({grouped.upcoming.length})
              </h2>
              <div className="space-y-2">{grouped.upcoming.slice(0, 15).map((r) => <ReminderCard key={r.id} r={r} />)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RemindersPage() {
  return <AppLayout><RemindersContent /></AppLayout>;
}
