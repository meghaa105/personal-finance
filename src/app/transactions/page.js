'use client';

import Transactions from '@/components/Transactions';
import PageTransition from '@/components/PageTransition';

export default function TransactionsPage() {
  return (
    <PageTransition>
      <Transactions />
    </PageTransition>
  );
}