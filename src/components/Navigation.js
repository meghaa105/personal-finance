'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'transactions', label: 'Transactions', path: '/transactions' },
    { id: 'analytics', label: 'Analytics', path: '/analytics' },
    { id: 'import', label: 'Import', path: '/import' },
    { id: 'custom-mappings', label: 'Custom Mappings', path: '/custom-mappings' },
    { id: 'settings', label: 'Settings', path: '/settings' },
  ];

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        // Check if the click is on the hamburger button itself
        if (!event.target.closest('#hamburger-button')) {
          setIsMobileMenuOpen(false);
        }
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-primary shadow-md fixed top-0 left-0 right-0 z-50" role="banner">
        <nav className="container mx-auto px-4 sm:px-6" role="navigation" aria-label="Main navigation">
          <Link href="/dashboard" className="block" onClick={closeMobileMenu}>
            <h1 className="text-xl sm:text-2xl font-bold text-white dark:text-white text-center py-3 sm:py-4">Personal Finance Manager (₹)</h1>
          </Link>
          {/* Desktop Tabs - Hidden on small screens */}
          <div className="hidden sm:flex justify-start sm:justify-between overflow-x-auto py-1 sm:py-2">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.path}
                className={`tab-btn px-3 sm:px-6 py-2 text-sm sm:text-base text-white dark:text-white font-medium rounded-lg transition-colors whitespace-nowrap ${pathname === tab.path ? 'bg-white/20' : 'hover:bg-white/10'}`}
                aria-current={pathname === tab.path ? 'page' : undefined}
                role="link"
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile Hamburger Button - Visible only on small screens */}
      <button
        id="hamburger-button"
        onClick={toggleMobileMenu}
        className="sm:hidden fixed bottom-5 left-5 z-[61] p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors duration-300 focus:outline-none ring-2 ring-primary-hover"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
      </button>

      {/* Mobile Menu Overlay - Shown when mobile menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] animate-[fadeIn_0.2s_ease-in-out]"
          onClick={closeMobileMenu} // Close on overlay click
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        ref={menuRef}
        className={`sm:hidden fixed bottom-0 left-0 right-0 w-full max-h-[80vh] bg-primary shadow-xl z-[60] transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'} p-5 pb-20 rounded-t-2xl overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
      >
        <h2 id="mobile-menu-title" className="text-2xl font-bold text-white mb-6 text-center">Menu</h2>
        <nav className="flex flex-col space-y-2">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.path}
              onClick={closeMobileMenu}
              className={`block px-4 py-3 text-lg text-white rounded-lg transition-colors ${pathname === tab.path ? 'bg-white/30 font-semibold' : 'hover:bg-white/20'}`}
              aria-current={pathname === tab.path ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        {/* Removed the explicit close button from here, as the hamburger button now serves this purpose */}
      </div>
    </>
  );
}