'use client';

import { useState } from 'react';

export default function CustomMappings() {
  const [mappings, setMappings] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMapping, setNewMapping] = useState({
    pattern: '',
    category: '',
    description: ''
  });

  const handleAddMapping = (e) => {
    e.preventDefault();
    // TODO: Implement add mapping logic
    setShowAddForm(false);
  };

  return (
    <div className="custom-mappings-container">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Custom Mappings</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Add Mapping
        </button>
      </div>

      {showAddForm && (
        <div className="add-mapping-form bg-white rounded-lg p-6 shadow-sm mb-6">
          <form onSubmit={handleAddMapping}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pattern
                </label>
                <input
                  type="text"
                  value={newMapping.pattern}
                  onChange={(e) => setNewMapping({ ...newMapping, pattern: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter text pattern to match"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newMapping.category}
                  onChange={(e) => setNewMapping({ ...newMapping, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="utilities">Utilities</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newMapping.description}
                  onChange={(e) => setNewMapping({ ...newMapping, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Add a description for this mapping"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Save Mapping
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mappings-list bg-white rounded-lg shadow-sm">
        {mappings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No custom mappings found</p>
        ) : (
          <div className="divide-y">
            {/* Mapping items will be mapped here */}
          </div>
        )}
      </div>
    </div>
  );
}