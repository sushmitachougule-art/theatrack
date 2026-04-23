'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AppLayout from '@/components/layout/AppLayout';
import { useDogs } from '@/hooks/useDogs';
import { getDogAge } from '@/lib/utils/dateUtils';
import { Plus } from 'lucide-react';

function DogsContent() {
  const { dogs, loading } = useDogs();

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Dogs</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{dogs.length} dog{dogs.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Link href="/dogs/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Dog
        </Link>
      </div>

      {dogs.length === 0 ? (
        <div className="glass-card p-12 text-center" style={{ cursor: 'default' }}>
          <div className="text-5xl mb-4">🐾</div>
          <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No dogs added yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Add your first furry friend to get started.</p>
          <Link href="/dogs/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Add Your First Dog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {dogs.map((dog) => (
            <Link key={dog.id} href={`/dogs/${dog.id}`} className="glass-card p-5 block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: 'rgba(245,158,11,0.15)' }}>
                  {dog.photoUrl ? (
                    <Image src={dog.photoUrl} alt={dog.name} width={56} height={56} className="w-full h-full rounded-xl object-cover" />
                  ) : '🐕'}
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{dog.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dog.breed}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{getDogAge(dog.dateOfBirth)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {dog.weight && (
                  <div><span style={{ color: 'var(--text-muted)' }}>Weight:</span> <span style={{ color: 'var(--text-secondary)' }}>{dog.weight} kg</span></div>
                )}
                <div><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <span style={{ color: 'var(--text-secondary)' }}>{dog.gender === 'male' ? '♂ Male' : '♀ Female'}</span></div>
                {dog.microchipNumber && (
                  <div className="col-span-2"><span style={{ color: 'var(--text-muted)' }}>Microchip:</span> <span style={{ color: 'var(--text-secondary)' }}>{dog.microchipNumber}</span></div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DogsPage() {
  return <AppLayout><DogsContent /></AppLayout>;
}
