'use client';

import ThemeProvider from './ThemeProvider';
import { TransactionProvider } from '../contexts/TransactionContext';
import { CategoryProvider } from '../contexts/CategoryContext';
import { CustomMappingsProvider } from '../contexts/CustomMappingsContext';
import Navigation from '@/components/Navigation';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ClientLayout({ children }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CustomMappingsProvider>
          <CategoryProvider>
            <TransactionProvider>
              <div className="app-container">
                <Navigation />
                <main className="p-6 pt-0 mt-32">
                  {children}
                </main>
              </div>
            </TransactionProvider>
        </CategoryProvider>
          </CustomMappingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}