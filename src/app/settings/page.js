'use client';

import { useState, useEffect } from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const [settings, setSettings] = useState({
    currency: '₹',
    language: 'en',
    theme: 'light',
    notifications: true,
    backupFrequency: 'weekly',
    categories: [
      'Food',
      'Transportation',
      'Housing',
      'Utilities',
      'Entertainment',
      'Shopping',
      'Healthcare',
      'Education'
    ]
  });

  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = (updatedSettings) => {
    localStorage.setItem('settings', JSON.stringify(updatedSettings));
    setSettings(updatedSettings);
  };

  const handleSettingChange = (setting, value) => {
    const updatedSettings = { ...settings, [setting]: value };
    saveSettings(updatedSettings);
  };

  const addCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    const updatedCategories = [...settings.categories, newCategory.trim()];
    saveSettings({ ...settings, categories: updatedCategories });
    setNewCategory('');
  };

  const removeCategory = (category) => {
    const updatedCategories = settings.categories.filter(c => c !== category);
    saveSettings({ ...settings, categories: updatedCategories });
  };

  return (
    <div className="p-6 dark:bg-gray-900">
      <div className="flex items-center space-x-2 mb-6">
        <CogIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        <h1 className="text-2xl font-bold dark:text-white">Settings</h1>
      </div>

      <div className="max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="₹">Indian Rupee (₹)</option>
                  <option value="$">US Dollar ($)</option>
                  <option value="€">Euro (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Enable notifications for reminders and important updates
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Backup Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <form onSubmit={addCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add new category"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {settings.categories.map((category) => (
                <div
                  key={category}
                  className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center"
                >
                  {category}
                  <button
                    onClick={() => removeCategory(category)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}