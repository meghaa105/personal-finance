import './globals.css';
import ThemeProvider from './ThemeProvider';

export const metadata = {
  title: 'Personal Finance Manager (₹)',
  description: 'Track your expenses, income, and manage your personal finances efficiently.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-900">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}