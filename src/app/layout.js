import './globals.css';
import { metadata } from './metadata';
import ClientLayout from './ClientLayout';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/icon?family=Material+Icons" 
          rel="stylesheet" 
          media="all" 
          // onLoad={(e) => { e.target.media='all'; }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}