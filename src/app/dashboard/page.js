'use client';

import Dashboard from '@/components/Dashboard';
import PageTransition from '@/components/PageTransition';

export default function DashboardPage() {
  return (
    <PageTransition>
      <Dashboard />
    </PageTransition>
  );
}