// ============================================
// PawShield — Dogs Hook (Real-time)
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Dog } from '@/types';
import { subscribeToDogs } from '@/lib/repositories';
import { useAuth } from './useAuth';

export function useDogs() {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<Dog[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToDogs(user.uid, (updatedDogs) => {
      setDogs(updatedDogs);
    });
    return () => {
      unsubscribe();
      setDogs(null);
    };
  }, [user]);

  return {
    dogs: dogs ?? [],
    loading: user ? dogs === null : false,
  };
}
