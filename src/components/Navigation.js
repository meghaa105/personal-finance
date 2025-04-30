'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'transactions', label: 'Transactions', path: '/transactions' },
    { id: 'analytics', label: 'Analytics', path: '/analytics' },
    { id: 'import', label: 'Import', path: '/import' },
    { id: 'reminders', label: 'Reminders', path: '/reminders' },
    { id: 'settings', label: 'Settings', path: '/settings' },
    { id: 'custom-mappings', label: 'Custom Mappings', path: '/custom-mappings' },
  ];

  return (
    <header className="bg-primary shadow-md" role="banner">
      <nav className="container mx-auto px-6" role="navigation" aria-label="Main navigation">
        <Link href="/dashboard" className="block">
          <h1 className="text-2xl font-bold text-white text-center py-4">Personal Finance Manager (₹)</h1>
        </Link>
        <div className="tabs flex justify-between overflow-x-auto py-2">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.path}
              className={`tab-btn px-6 py-2 text-white font-medium rounded-lg transition-colors ${pathname === tab.path ? 'bg-white/20' : 'hover:bg-white/10'}`}
              aria-current={pathname === tab.path ? 'page' : undefined}
              role="link"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}