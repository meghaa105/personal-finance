'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import PageTransition from '@/components/PageTransition';
import LoadingSpinner from '@/components/LoadingSpinner';

const Analytics = dynamic(() => import('@/components/Analytics'), {
  loading: () => <LoadingSpinner />
});

export default function AnalyticsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingSpinner />}>
        <Analytics />
      </Suspense>
    </PageTransition>
  );
}