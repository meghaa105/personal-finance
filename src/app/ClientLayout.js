'use client';

import ThemeProvider from './ThemeProvider';
import { TransactionProvider } from '../contexts/TransactionContext';
import { CategoryProvider } from '../contexts/CategoryContext';
import { CustomMappingsProvider } from '../contexts/CustomMappingsContext';
import { MultiSelectProvider, useMultiSelect } from '../contexts/MultiSelectContext';
import Navigation from '@/components/Navigation';
import ErrorBoundary from '@/components/ErrorBoundary';

function AppContent({ children }) {
  const { dropdownOpen } = useMultiSelect();

  return (
    <div className="app-container">
      <Navigation />
      <main className="p-6 pt-0 mt-32">
        {children}
      </main>
      {dropdownOpen && (
        <style jsx global>{`
          body {
            overflow: hidden;
          }
        `}</style>
      )}
    </div>
  );
}

export default function ClientLayout({ children }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CustomMappingsProvider>
          <CategoryProvider>
            <TransactionProvider>
              <MultiSelectProvider>
                <AppContent>{children}</AppContent>
              </MultiSelectProvider>
            </TransactionProvider>
          </CategoryProvider>
        </CustomMappingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}