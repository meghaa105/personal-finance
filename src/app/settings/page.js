'use client';

import { useState } from 'react';
import { useCategories } from '@/contexts/CategoryContext';
import { FaPlus, FaTrash } from 'react-icons/fa';
import PageTransition from '@/components/PageTransition';

export default function Settings() {
  const { categories, addCategory, deleteCategory } = useCategories();
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

  return (
    <PageTransition>
      <div className="settings-container space-y-8">
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
                  </div>
                </div>
                {category.id !== 'other' && (
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