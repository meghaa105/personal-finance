'use client';


import { TransactionProvider } from '../contexts/TransactionContext';
import { CategoryProvider } from '../contexts/CategoryContext';
import { CustomMappingsProvider } from '../contexts/CustomMappingsContext';
import { MultiSelectProvider, useMultiSelect } from '../contexts/MultiSelectContext';
import Navigation from '@/components/Navigation';
import ErrorBoundary from '@/components/ErrorBoundary';
import AIAssistant from '@/components/AIAssistant';

function AppContent({ children }) {
  const { dropdownOpen } = useMultiSelect();

  return (
    <div className="app-container bg-gray-50 dark:bg-gray-900 dark:text-white min-h-screen flex flex-col">
      <Navigation />
      <main className="p-4 sm:p-6 pt-10 sm:pt-16 mt-16 sm:mt-20 flex-grow">
        {children}
      </main>
      <AIAssistant />
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