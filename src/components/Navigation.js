'use client';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'import', label: 'Import' },
    { id: 'reminders', label: 'Reminders' },
    { id: 'settings', label: 'Settings' },
    { id: 'custom-mappings', label: 'Custom Mappings' },
  ];

  return (
    <header className="bg-primary shadow-md" role="banner">
      <nav className="container mx-auto px-6" role="navigation" aria-label="Main navigation">
        <h1 className="text-2xl font-bold text-white text-center py-4">Personal Finance Manager (₹)</h1>
        <div className="tabs flex justify-between overflow-x-auto py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn px-6 py-2 text-white font-medium rounded-lg transition-colors ${activeTab === tab.id ? 'bg-white/20' : 'hover:bg-white/10'}`}
              onClick={() => setActiveTab(tab.id)}
              data-tab={tab.id}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}