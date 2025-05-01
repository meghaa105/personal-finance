'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import PageTransition from '@/components/PageTransition';
import LoadingSpinner from '@/components/LoadingSpinner';

const Import = dynamic(() => import('@/components/Import'), {
  loading: () => <LoadingSpinner />
});

export default function ImportPage() {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingSpinner />}>
        <Import />
      </Suspense>
    </PageTransition>
  );
}