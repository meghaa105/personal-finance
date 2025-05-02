'use client';

import { useState } from 'react';
import { useCategories } from '@/contexts/CategoryContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { FaPlus, FaTrash, FaEdit, FaCheck, FaDownload } from 'react-icons/fa';
import PageTransition from '@/components/PageTransition';

export default function Settings() {
  const { categories, addCategory, deleteCategory, updateCategory } = useCategories();
  const { transactions } = useTransactions();
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

  return (
    <PageTransition>
      <div className="settings-container space-y-8">
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Export Data</h3>
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
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Manage Categories</h3>

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
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <p className="font-medium text-gray-800">{category.icon}</p>
                  <div>
                    <p className="font-medium text-gray-800">{category.label}</p>
                    {editingBudget === category.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={tempBudget}
                          onChange={(e) => setTempBudget(e.target.value)}
                          className="w-16 p-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
                      <p className="text-sm text-gray-600 mt-1 flex gap-2 content-center">
                        <span>Budget: ₹{category.budget?.toLocaleString() || '5,000'}</span>
                        <button
                          onClick={() => {
                            setEditingBudget(category.id);
                            setTempBudget(category.budget?.toString() || '5000');
                          }}
                          className="ml-2 text-primary hover:text-primary-hover transition-colors duration-300"
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
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-300"
                  >
                    <FaTrash size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}