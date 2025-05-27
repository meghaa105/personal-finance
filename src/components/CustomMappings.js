'use client';

import { useState } from 'react';
import { useCustomMappings } from '@/contexts/CustomMappingsContext';
import { useCategories } from '@/contexts/CategoryContext';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';

export default function CustomMappings() {
  const { customMappings, addCustomMapping, updateCustomMapping, deleteCustomMapping } = useCustomMappings();
  const { categories } = useCategories();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMapping, setNewMapping] = useState({
    pattern: '',
    category: '',
    description: ''
  });

  const filteredMappings = Object.entries(customMappings).reduce((acc, [categoryId, patterns]) => {
    const matchingPatterns = patterns.filter(pattern =>
      pattern.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (matchingPatterns.length > 0) {
      acc[categoryId] = matchingPatterns;
    }
    return acc;
  }, {});

  // Convert customMappings object to array for rendering
  const mappingsList = Object.entries(customMappings).flatMap(([category, patterns]) =>
    patterns.map(pattern => ({
      pattern,
      category,
      description: '' // Add description if needed
    }))
  );

  const handleAddMapping = (e) => {
    e.preventDefault();

    // Check if pattern already exists in any category
    const patternExists = Object.entries(customMappings).some(([category, patterns]) =>
      patterns.includes(newMapping.pattern.toLowerCase())
    );

    if (patternExists) {
      alert('This pattern already exists in another category!');
      return;
    }

    if (editingMapping) {
      updateCustomMapping(editingMapping.category, newMapping.category, editingMapping.pattern);
      setEditingMapping(null);
    } else {
      addCustomMapping(newMapping.category, newMapping.pattern.toLowerCase());
    }
    setNewMapping({ pattern: '', category: '', description: '' });
    setShowAddForm(false);
  };

  const handleEdit = (mapping) => {
    setNewMapping(mapping);
    setEditingMapping(mapping);
    setShowAddForm(true);
  };

  const handleDelete = (category, pattern) => {
    if (confirm('Are you sure you want to delete this mapping?')) {
      deleteCustomMapping(category, pattern);
    }
  };

  return (
    <div className="custom-mappings-container">
      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingMapping(null);
          setNewMapping({ pattern: '', category: '', description: '' });
          setShowAddForm(true);
        }}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center z-40"
        title="Add New Mapping"
      >
        <FaPlus size={24} />
      </button>

      {showAddForm && (
        <div className="fixed p-6 inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800/95 rounded-lg w-full max-w-2xl p-6 shadow-lg relative">
            <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{editingMapping ? 'Edit' : 'Add New'} Mapping</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMapping(null);
                  setNewMapping({ pattern: '', category: '', description: '' });
                }}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/10 dark:hover:bg-gray-700/50 rounded-full transition-all duration-200 ease-in-out"
              >
                <AiOutlineClose size={24} />
              </button>
            </div>
            <form onSubmit={handleAddMapping} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pattern
                </label>
                <input
                  type="text"
                  value={newMapping.pattern}
                  onChange={(e) => setNewMapping({ ...newMapping, pattern: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary/70"
                  placeholder="Enter text pattern to match (e.g., starbucks, uber)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newMapping.category}
                  onChange={(e) => setNewMapping({ ...newMapping, category: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary/70"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-4 border-t dark:border-gray-700">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark hover:scale-105 hover:shadow-md transition-all duration-200 ease-in-out"
                >
                  {editingMapping ? 'Update' : 'Save'} Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="search-bar mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search mappings..."
          className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary/70"
        />
      </div>

      <div className="mappings-list bg-white dark:bg-gray-800/95 rounded-lg shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(filteredMappings).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8 col-span-full">No custom mappings found</p>
        ) : (
          Object.entries(filteredMappings).map(([categoryId, patterns]) => {
            const categoryObj = categories.find(c => c.id === categoryId || c.label === categoryId);
            return (
              <div key={categoryId} className="category-section rounded-md border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 shadow-sm transition-all duration-200 ease-in-out">
                <button
                  onClick={() => setSelectedCategory(categoryId)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-grow">
                    <span className="text-xl">{categoryObj?.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">{categoryObj?.label}</h3>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">{patterns.length} patterns</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {selectedCategory && (
        <div className="fixed p-6 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800/95 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-between border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xl">{categories.find(c => c.id === selectedCategory || c.label === selectedCategory)?.icon}</span>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {categories.find(c => c.id === selectedCategory || c.label === selectedCategory)?.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/10 dark:hover:bg-gray-700/50 rounded-full transition-all duration-200 ease-in-out"
              >
                <AiOutlineClose size={24} />
              </button>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {customMappings[selectedCategory]?.map((pattern, index) => (
                <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex-grow">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{pattern}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleEdit({ pattern, category: selectedCategory });
                        setSelectedCategory(null);
                      }}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary rounded-full transition-colors"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        handleDelete(selectedCategory, pattern);
                      }}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}