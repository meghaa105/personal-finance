'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import PageTransition from '@/components/PageTransition';
import LoadingSpinner from '@/components/LoadingSpinner';

const Transactions = dynamic(() => import('@/components/Transactions'), {
  loading: () => <LoadingSpinner />
});

export default function TransactionsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingSpinner />}>
        <Transactions />
      </Suspense>
    </PageTransition>
  );
}