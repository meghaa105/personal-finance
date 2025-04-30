'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function CustomMappings() {
  const [mappings, setMappings] = useState([]);
  const [newMapping, setNewMapping] = useState({
    pattern: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    const savedMappings = localStorage.getItem('customMappings');
    if (savedMappings) {
      setMappings(JSON.parse(savedMappings));
    }
  }, []);

  const saveMappings = (updatedMappings) => {
    localStorage.setItem('customMappings', JSON.stringify(updatedMappings));
    setMappings(updatedMappings);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMapping.pattern || !newMapping.category) return;

    const mapping = {
      ...newMapping,
      id: Date.now()
    };

    saveMappings([...mappings, mapping]);
    setNewMapping({
      pattern: '',
      category: '',
      description: ''
    });
  };

  const deleteMapping = (id) => {
    const updatedMappings = mappings.filter(mapping => mapping.id !== id);
    saveMappings(updatedMappings);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Custom Transaction Mappings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Mapping Rule</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pattern</label>
                <input
                  type="text"
                  value={newMapping.pattern}
                  onChange={(e) => setNewMapping({...newMapping, pattern: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., AMAZON*, UBER*"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use * as a wildcard. Case-insensitive.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={newMapping.category}
                  onChange={(e) => setNewMapping({...newMapping, category: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Shopping"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <input
                  type="text"
                  value={newMapping.description}
                  onChange={(e) => setNewMapping({...newMapping, description: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Online shopping transactions"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                Add Mapping
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Existing Mappings</h2>
          <div className="space-y-4">
            {mappings.length === 0 ? (
              <p className="text-gray-500 text-center">No custom mappings defined</p>
            ) : (
              mappings.map(mapping => (
                <div key={mapping.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{mapping.pattern}</h3>
                    <p className="text-sm text-gray-600">
                      Category: {mapping.category}
                    </p>
                    {mapping.description && (
                      <p className="text-xs text-gray-500">
                        {mapping.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMapping(mapping.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
        <div className="prose prose-sm">
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>
              Create patterns that match transaction descriptions using wildcards (*)
            </li>
            <li>
              When importing transactions, these rules will automatically categorize matching entries
            </li>
            <li>
              Rules are processed in order, with more specific patterns taking precedence
            </li>
            <li>
              Patterns are case-insensitive for easier matching
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}