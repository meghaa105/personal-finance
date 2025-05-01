'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import PageTransition from '@/components/PageTransition';
import LoadingSpinner from '@/components/LoadingSpinner';

const Reminders = dynamic(() => import('@/components/Reminders'), {
  loading: () => <LoadingSpinner />
});

export default function RemindersPage() {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingSpinner />}>
        <Reminders />
      </Suspense>
    </PageTransition>
  );
}