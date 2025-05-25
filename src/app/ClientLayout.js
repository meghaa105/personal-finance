'use client';


import { TransactionProvider } from '../contexts/TransactionContext';
import { CategoryProvider } from '../contexts/CategoryContext';
import { CustomMappingsProvider } from '../contexts/CustomMappingsContext';
import { MultiSelectProvider, useMultiSelect } from '../contexts/MultiSelectContext';
import Navigation from '@/components/Navigation';
import ErrorBoundary from '@/components/ErrorBoundary';

function AppContent({ children }) {
  const { dropdownOpen } = useMultiSelect();

  return (
    <div className="app-container bg-gray-50 dark:bg-gray-900 dark:text-white">
      <Navigation />
      <main className="p-6 pt-2 mt-32 bg-gray-50 dark:bg-gray-900">
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
      <CustomMappingsProvider>
        <CategoryProvider>
          <TransactionProvider>
            <MultiSelectProvider>
              <AppContent>{children}</AppContent>
            </MultiSelectProvider>
          </TransactionProvider>
        </CategoryProvider>
      </CustomMappingsProvider>
    </ErrorBoundary>
  );
}