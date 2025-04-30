import './globals.css';
import dynamic from 'next/dynamic';

const ThemeProvider = dynamic(() => import('./ThemeProvider'), { ssr: true });
const Navigation = dynamic(() => import('@/components/Navigation'), { ssr: true });

export const metadata = {
  title: 'Personal Finance Manager (₹)',
  description: 'Track your expenses, income, and manage your personal finances efficiently.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/icon?family=Material+Icons" 
          rel="stylesheet" 
          media="print" 
          onLoad="this.media='all'" 
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-900">
        <ThemeProvider>
          <div className="app-container">
            <Navigation />
            <main className="p-6">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}