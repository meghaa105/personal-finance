'use client';

import ThemeProvider from './ThemeProvider';
import { TransactionProvider } from '../contexts/TransactionContext';
import Navigation from '@/components/Navigation';

export default function ClientLayout({ children }) {
  return (
    <ThemeProvider>
      <TransactionProvider>
        <div className="app-container">
          <Navigation />
          <main className="p-6">
            {children}
          </main>
        </div>
      </TransactionProvider>
    </ThemeProvider>
  );
}