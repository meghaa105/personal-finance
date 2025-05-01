'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import PageTransition from '@/components/PageTransition';
import LoadingSpinner from '@/components/LoadingSpinner';

const CustomMappings = dynamic(() => import('@/components/CustomMappings'), {
  loading: () => <LoadingSpinner />
});

export default function CustomMappingsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingSpinner />}>
        <CustomMappings />
      </Suspense>
    </PageTransition>
  );
}