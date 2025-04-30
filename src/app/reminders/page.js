'use client';

import Reminders from '@/components/Reminders';
import PageTransition from '@/components/PageTransition';

export default function RemindersPage() {
  return (
    <PageTransition>
      <Reminders />
    </PageTransition>
  );
}