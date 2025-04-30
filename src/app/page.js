'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import Dashboard from '../components/Dashboard';
import Transactions from '../components/Transactions';
import Analytics from '../components/Analytics';
import Import from '../components/Import';
import Reminders from '../components/Reminders';
import Settings from '../components/Settings';
import CustomMappings from '../components/CustomMappings';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'analytics':
        return <Analytics />;
      case 'import':
        return <Import />;
      case 'reminders':
        return <Reminders />;
      case 'settings':
        return <Settings />;
      case 'custom-mappings':
        return <CustomMappings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-6">
        {renderContent()}
      </main>
    </div>
  );
}