import './globals.css';
import ClientLayout from './ClientLayout';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { CustomMappingsProvider } from '@/contexts/CustomMappingsContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
          media="all"
        // onLoad={(e) => { e.target.media='all'; }}
        />
        <title>Personal Finance Manager (₹)</title>
      </head>
      <body className="bg-white dark:bg-gray-900">
        <ThemeProvider>
          <CustomMappingsProvider>
            <CategoryProvider>
              <TransactionProvider>
                <ClientLayout>{children}</ClientLayout>
              </TransactionProvider>
            </CategoryProvider>
          </CustomMappingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}