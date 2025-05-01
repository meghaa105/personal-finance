'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import PageTransition from '@/components/PageTransition';
import LoadingSpinner from '@/components/LoadingSpinner';

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  loading: () => <LoadingSpinner />
});

export default function DashboardPage() {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    </PageTransition>
  );
}