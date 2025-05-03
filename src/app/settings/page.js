'use client';

import { useState, Suspense } from 'react';
import { useCategories } from '@/contexts/CategoryContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaDownload, FaEraser } from 'react-icons/fa';
import PageTransition from '@/components/PageTransition';
import LoadingSpinner from '@/components/LoadingSpinner';
import ThemeToggle from '@/components/ThemeToggle';

const THEME_COLORS = [
  { label: 'Blue', value: '#6c63ff' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Indigo', value: '#6366F1' },
];

export default function Settings() {
  const { categories, addCategory, deleteCategory, updateCategory } = useCategories();
  const { transactions, clearTransactions } = useTransactions();
  const { primaryColor, updatePrimaryColor } = useTheme();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [tempBudget, setTempBudget] = useState('');
  const [newCategory, setNewCategory] = useState({ label: '', icon: '⛓️' });
  const [iconError, setIconError] = useState('');

  const generateUniqueId = (label) => {
    const baseId = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existingIds = categories.map(c => c.id);
    let id = baseId;
    let counter = 1;
    
    while (existingIds.includes(id)) {
      id = `${baseId}_${counter}`;
      counter++;
    }
    
    return id;
  };

  const validateEmoji = (text) => {
    const emojiRegex = /^\p{Emoji}$/u;
    return text.length === 1 || text.length === 2 && emojiRegex.test(text);
  };

  const handleIconChange = (e) => {
    const value = e.target.value;
    if (value === '' || validateEmoji(value)) {
      setNewCategory(prev => ({ ...prev, icon: value }));
      setIconError('');
    } else {
      setIconError('Please enter a single emoji');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCategory.label || iconError) return;

    const id = generateUniqueId(newCategory.label);
    addCategory({
      id,
      label: newCategory.label,
      icon: newCategory.icon
    });

    setNewCategory({ label: '', icon: '⛓️' });
    setIconError('');
  };

  const handleExportCSV = () => {
    const csvContent = transactions.map(t => {
      const date = new Date(t.date);
      const formattedDate = date.getDate().toString().padStart(2, '0') + '-' + 
        (date.getMonth() + 1).toString().padStart(2, '0') + '-' + 
        date.getFullYear();
      return [
        `"${formattedDate}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.amount}"`,
        `"${t.type}"`,
        `"${t.category}"`,
        `"${t.source || 'manual'}"`
      ].join(',');
    });
    
    const header = '"Date","Description","Amount","Type","Category","Source"\n';
    const csv = header + csvContent.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleClearTransactions = () => {
    clearTransactions();
    setShowClearConfirm(false);
  };

  return (
    <PageTransition>
      <Suspense fallback={<LoadingSpinner />}>
      <h1 className='text-primary-1'>FUCK YEAH</h1>
        <div className="settings-container space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Appearance</h3>
            <div className="space-y-6">
              <ThemeToggle />
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Primary Color</label>
                <div className="grid grid-cols-4 gap-3">
                  {THEME_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updatePrimaryColor(color.value)}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${primaryColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      style={{ backgroundColor: color.value + '1A' }} // 10% opacity version of the color
                    >
                      <span className="text-sm font-medium" style={{ color: color.value }}>{color.label}</span>
                      <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: color.value }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Data Management</h3>
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors duration-300"
              >
                <FaDownload /> Export as CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors duration-300"
              >
                <FaDownload /> Export as JSON
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 ml-auto"
              >
                <FaEraser /> Clear All Transactions
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Manage Categories</h3>
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Display Label</label>
                  <input
                    type="text"
                    value={newCategory.label}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Groceries"
                    required
                  />
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Icon (Emoji)</label>
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={handleIconChange}
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${iconError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-primary'}`}
                    placeholder="Enter an emoji"
                    maxLength="2"
                  />
                  {iconError && <p className="text-xs text-red-500 mt-1">{iconError}</p>}
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors duration-300 flex items-center gap-2"
                  >
                    <FaPlus /> Add
                  </button>
                </div>
              </div>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{category.icon}</p>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200 -mb-2">{category.label}</p>
                      {editingBudget === category.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            value={tempBudget}
                            onChange={(e) => setTempBudget(e.target.value)}
                            className="w-16 p-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            min="0"
                          />
                          <button
                            onClick={() => {
                              const budget = parseInt(tempBudget) || 5000;
                              updateCategory(category.id, { ...category, budget });
                              setEditingBudget(null);
                              setTempBudget('');
                            }}
                            className="p-1 text-primary hover:text-primary-hover transition-colors duration-300"
                          >
                            <FaCheck size={14} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex gap-1 content-center items-center">
                          <span>Budget: ₹{category.budget?.toLocaleString() || '5,000'}</span>
                          <button
                            onClick={() => {
                              setEditingBudget(category.id);
                              setTempBudget(category.budget?.toString() || '5000');
                            }}
                            className="ml-2 text-primary hover:text-primary-hover transition-colors duration-300 rounded-full p-1.5 grid place-items-center"
                          >
                            <FaEdit size={14} />
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                  {category.id !== 'other' && category.id !== "income" && (
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors duration-300"
                    >
                      <FaTrash size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {showClearConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Clear All Transactions?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">This action cannot be undone. Are you sure you want to clear all transactions?</p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearTransactions}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </PageTransition>
  );
}